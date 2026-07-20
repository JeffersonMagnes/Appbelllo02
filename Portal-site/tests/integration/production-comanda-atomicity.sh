#!/bin/zsh
set -euo pipefail
ref="${SUPABASE_PROJECT_REF:-rfuvtsnnmoovscdteqnx}"
url="https://${ref}.supabase.co"
key="$(supabase projects api-keys --project-ref "$ref" -o json | jq -r '.[] | select(.name == "service_role") | .api_key' | head -n 1)"
suffix="$RANDOM$RANDOM"
product_id=''; comanda_id=''; failed_key="qa-fail-$suffix"; create_key="qa-create-$suffix"; close_key="qa-close-$suffix"
tmp_dir="$(mktemp -d)"
api() { curl -fsS "$@" -H "apikey: $key" -H "Authorization: Bearer $key"; }
cleanup() {
  set +e
  [[ -z "$comanda_id" ]] || api -X PATCH "$url/rest/v1/comandas?id=eq.$comanda_id" -H 'Content-Type: application/json' --data '{"status":"open"}' >/dev/null
  [[ -z "$comanda_id" ]] || api -X DELETE "$url/rest/v1/comanda_items?comanda_id=eq.$comanda_id" >/dev/null
  [[ -z "$comanda_id" ]] || api -X DELETE "$url/rest/v1/transactions?source_id=eq.$comanda_id" >/dev/null
  [[ -z "$comanda_id" ]] || api -X DELETE "$url/rest/v1/comandas?id=eq.$comanda_id" >/dev/null
  api -X DELETE "$url/rest/v1/comandas?idempotency_key=eq.$failed_key" >/dev/null
  [[ -z "$product_id" ]] || api -X DELETE "$url/rest/v1/products?id=eq.$product_id" >/dev/null
  rm -rf "$tmp_dir"
}
trap cleanup EXIT INT TERM

establishment_id="$(api "$url/rest/v1/establishments?select=id&limit=1" | jq -r '.[0].id')"
print -u2 'stage:fixtures'
product_id="$(api -X POST "$url/rest/v1/products" -H 'Content-Type: application/json' -H 'Prefer: return=representation' --data "$(jq -nc --arg e "$establishment_id" '{establishment_id:$e,name:"QA ATOMIC",price:10,stock:2,active:true}')" | jq -r '.[0].id')"

items="$(jq -nc --arg p "$product_id" '[{type:"product",product_id:$p,description:"QA Product",quantity:2,unit_price:10},{type:"service",description:"QA Service",quantity:1,unit_price:5}]')"
payload="$(jq -nc --arg e "$establishment_id" --argjson items "$items" --arg k "$create_key" '{p_establishment_id:$e,p_client_id:null,p_client_name:"QA ATOMIC",p_items:$items,p_notes:null,p_idempotency_key:$k}')"
print -u2 'stage:create'
create_status="$(curl -sS -o "$tmp_dir/create.json" -w '%{http_code}' -X POST "$url/rest/v1/rpc/create_comanda_with_items" -H "apikey: $key" -H "Authorization: Bearer $key" -H 'Content-Type: application/json' --data "$payload")"
print -u2 "create_http=$create_status detail=$(jq -r 'if type == "object" then (.code // .message // "error") else "ok" end' "$tmp_dir/create.json")"
[[ "$create_status" == 200 ]]
comanda_id="$(jq -r '.' "$tmp_dir/create.json")"
repeat_id="$(api -X POST "$url/rest/v1/rpc/create_comanda_with_items" -H 'Content-Type: application/json' --data "$payload" | jq -r '.')"
[[ "$comanda_id" == "$repeat_id" ]]

print -u2 'stage:stock-and-total'
snapshot="$(api "$url/rest/v1/comandas?id=eq.$comanda_id&select=total,status" | jq -c '.[0]')"
stock="$(api "$url/rest/v1/products?id=eq.$product_id&select=stock" | jq -r '.[0].stock')"
computed_total="$(printf '%s' "$snapshot" | jq -r '.total')"
print -u2 "computed_total=$computed_total stock=$stock"
[[ "$(printf '%s' "$computed_total" | awk '{printf "%.2f", $1}')" == 25.00 && "$stock" == 0 ]]

failed_payload="$(jq -nc --arg e "$establishment_id" --arg p "$product_id" --arg k "$failed_key" '{p_establishment_id:$e,p_client_id:null,p_client_name:"QA FAIL",p_items:[{type:"product",product_id:$p,description:"No stock",quantity:1,unit_price:10}],p_notes:null,p_idempotency_key:$k}')"
print -u2 'stage:rollback-on-insufficient-stock'
failed_status="$(curl -sS -o /tmp/appbello-comanda-fail.json -w '%{http_code}' -X POST "$url/rest/v1/rpc/create_comanda_with_items" -H "apikey: $key" -H "Authorization: Bearer $key" -H 'Content-Type: application/json' --data "$failed_payload")"
failed_count="$(api "$url/rest/v1/comandas?idempotency_key=eq.$failed_key&select=id" | jq 'length')"
[[ "$failed_status" == 400 && "$failed_count" == 0 ]]

payments='[{"method":"pix","amount":15},{"method":"cash","amount":10}]'
print -u2 'stage:idempotent-close'
close_payload="$(jq -nc --arg id "$comanda_id" --arg key "$close_key" --argjson payments "$payments" '{p_comanda_id:$id,p_discount:0,p_payments:$payments,p_idempotency_key:$key}')"
api -X POST "$url/rest/v1/rpc/close_comanda" -H 'Content-Type: application/json' --data "$close_payload" >/dev/null
api -X POST "$url/rest/v1/rpc/close_comanda" -H 'Content-Type: application/json' --data "$close_payload" >/dev/null
transaction_count="$(api "$url/rest/v1/transactions?source_id=eq.$comanda_id&select=id" | jq 'length')"
paid_status="$(api "$url/rest/v1/comandas?id=eq.$comanda_id&select=status" | jq -r '.[0].status')"
[[ "$transaction_count" == 2 && "$paid_status" == paid ]]

rm -f /tmp/appbello-comanda-fail.json
jq -nc --arg total "$(printf '%s' "$snapshot" | jq -r '.total')" --arg stock "$stock" --arg failure "$failed_status" --arg tx "$transaction_count" '{computed_total:($total|tonumber),stock_after_items:($stock|tonumber),rollback_http:($failure|tonumber),failed_comanda_rolled_back:true,idempotent_create:true,idempotent_close:true,transactions:($tx|tonumber),cleanup:true}'
