#!/bin/zsh
set -euo pipefail

ref="${SUPABASE_PROJECT_REF:-rfuvtsnnmoovscdteqnx}"
url="https://${ref}.supabase.co"
keys="$(supabase projects api-keys --project-ref "$ref" -o json)"
anon="$(printf '%s' "$keys" | jq -r '.[] | select(.name == "anon") | (.api_key // .key // .value // empty)' | head -n 1)"
service="$(printf '%s' "$keys" | jq -r '.[] | select(.name == "service_role") | (.api_key // .key // .value // empty)' | head -n 1)"
run="$(date +%s)-$RANDOM"
password="$(openssl rand -base64 30 | tr -d '\n')Aa1!"
user_a='' user_b='' est_a='' est_b='' service_id='' client_id='' appointment_id='' comanda_id='' item_id='' transaction_id=''

admin() { curl -fsS "$@" -H "apikey: $service" -H "Authorization: Bearer $service"; }
cleanup() {
  set +e
  [[ -z "$item_id" ]] || admin -X DELETE "$url/rest/v1/comanda_items?id=eq.$item_id" >/dev/null
  [[ -z "$transaction_id" ]] || admin -X DELETE "$url/rest/v1/transactions?id=eq.$transaction_id" >/dev/null
  [[ -z "$appointment_id" ]] || admin -X DELETE "$url/rest/v1/appointments?id=eq.$appointment_id" >/dev/null
  [[ -z "$comanda_id" ]] || admin -X DELETE "$url/rest/v1/comandas?id=eq.$comanda_id" >/dev/null
  [[ -z "$service_id" ]] || admin -X DELETE "$url/rest/v1/services?id=eq.$service_id" >/dev/null
  [[ -z "$client_id" ]] || admin -X DELETE "$url/rest/v1/clients?id=eq.$client_id" >/dev/null
  [[ -z "$est_a" ]] || admin -X DELETE "$url/rest/v1/establishments?id=eq.$est_a" >/dev/null
  [[ -z "$est_b" ]] || admin -X DELETE "$url/rest/v1/establishments?id=eq.$est_b" >/dev/null
  [[ -z "$user_a" ]] || admin -X DELETE "$url/auth/v1/admin/users/$user_a" >/dev/null
  [[ -z "$user_b" ]] || admin -X DELETE "$url/auth/v1/admin/users/$user_b" >/dev/null
}
trap cleanup EXIT INT TERM

create_user() {
  admin -X POST "$url/auth/v1/admin/users" -H 'Content-Type: application/json' \
    --data "$(jq -nc --arg email "$1" --arg password "$password" '{email:$email,password:$password,email_confirm:true,user_metadata:{purpose:"temporary_domain_qa"}}')"
}
login() {
  curl -fsS -X POST "$url/auth/v1/token?grant_type=password" -H "apikey: $anon" -H 'Content-Type: application/json' \
    --data "$(jq -nc --arg email "$1" --arg password "$password" '{email:$email,password:$password}')" | jq -r '.access_token'
}
owner_post() {
  local table="$1" token="$2" data="$3"
  curl -fsS -X POST "$url/rest/v1/$table" -H "apikey: $anon" -H "Authorization: Bearer $token" \
    -H 'Content-Type: application/json' -H 'Prefer: return=representation' --data "$data"
}
owner_read() {
  local table="$1" token="$2" id="$3"
  curl -sS "$url/rest/v1/$table?id=eq.$id&select=id" -H "apikey: $anon" -H "Authorization: Bearer $token"
}

email_a="qa-domain-a-${run}@qa.appbello.com.br"
email_b="qa-domain-b-${run}@qa.appbello.com.br"
print -u2 'stage:users'
user_a="$(create_user "$email_a" | jq -r '.id')"
user_b="$(create_user "$email_b" | jq -r '.id')"
token_a="$(login "$email_a")"
token_b="$(login "$email_b")"

ests="$(admin -X POST "$url/rest/v1/establishments" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  --data "$(jq -nc --arg a "$user_a" --arg b "$user_b" --arg run "$run" '[{owner_id:$a,name:("QA DOMAIN A " + $run),business_type:"salon",active:true,slug:("qa-domain-a-"+$run)},{owner_id:$b,name:("QA DOMAIN B " + $run),business_type:"salon",active:true,slug:("qa-domain-b-"+$run)}]')")"
est_a="$(printf '%s' "$ests" | jq -r --arg uid "$user_a" '.[]|select(.owner_id==$uid)|.id')"
est_b="$(printf '%s' "$ests" | jq -r --arg uid "$user_b" '.[]|select(.owner_id==$uid)|.id')"

print -u2 'stage:create-service-client'
service_row="$(owner_post services "$token_a" "$(jq -nc --arg eid "$est_a" --arg run "$run" '{establishment_id:$eid,name:("QA SERVICE "+$run),price:50,duration:30,active:true}')")"
service_id="$(printf '%s' "$service_row" | jq -r '.[0].id')"
client_row="$(owner_post clients "$token_a" "$(jq -nc --arg eid "$est_a" --arg run "$run" '{establishment_id:$eid,name:("QA DOMAIN CLIENT "+$run),phone:"11966665555"}')")"
client_id="$(printf '%s' "$client_row" | jq -r '.[0].id')"
print -u2 'stage:create-appointment'
appointment_row="$(owner_post appointments "$token_a" "$(jq -nc --arg eid "$est_a" --arg cid "$client_id" --arg sid "$service_id" '{establishment_id:$eid,client_id:$cid,service_id:$sid,date:"2026-09-15",time:"22:45",status:"pending",client_name:"QA DOMAIN CLIENT"}')")"
appointment_id="$(printf '%s' "$appointment_row" | jq -r '.[0].id')"
print -u2 'stage:create-comanda-item'
comanda_row="$(owner_post comandas "$token_a" "$(jq -nc --arg eid "$est_a" --arg cid "$client_id" '{establishment_id:$eid,client_id:$cid,client_name:"QA DOMAIN CLIENT",status:"open",total:50}')")"
comanda_id="$(printf '%s' "$comanda_row" | jq -r '.[0].id')"
item_row="$(owner_post comanda_items "$token_a" "$(jq -nc --arg cid "$comanda_id" --arg sid "$service_id" '{comanda_id:$cid,item_id:$sid,name:"QA SERVICE",description:"QA SERVICE",quantity:1,unit_price:50,total:50,type:"service"}')")"
item_id="$(printf '%s' "$item_row" | jq -r '.[0].id')"
print -u2 'stage:create-transaction'
transaction_row="$(owner_post transactions "$token_a" "$(jq -nc --arg eid "$est_a" --arg cid "$client_id" '{establishment_id:$eid,client_id:$cid,type:"income",category:"qa",description:"QA DOMAIN TRANSACTION",amount:50,payment_method:"cash",date:"2026-09-15",status:"paid"}')")"
transaction_id="$(printf '%s' "$transaction_row" | jq -r '.[0].id')"

print -u2 'stage:cross-read-services'
cross_services="$(owner_read services "$token_b" "$service_id")"
print -u2 'stage:cross-read-appointments'
cross_appointments="$(owner_read appointments "$token_b" "$appointment_id")"
print -u2 'stage:cross-read-comandas'
cross_comandas="$(owner_read comandas "$token_b" "$comanda_id")"
if [[ "$(printf '%s' "$cross_comandas" | jq -r 'type')" != 'array' ]]; then
  printf '%s' "$cross_comandas" | jq -c '{code,message}' >&2
  exit 1
fi
print -u2 'stage:cross-read-items'
cross_items="$(owner_read comanda_items "$token_b" "$item_id")"
print -u2 'stage:cross-read-transactions'
cross_transactions="$(owner_read transactions "$token_b" "$transaction_id")"
cross_results="$(jq -nc \
  --argjson services "$cross_services" \
  --argjson appointments "$cross_appointments" \
  --argjson comandas "$cross_comandas" \
  --argjson items "$cross_items" \
  --argjson transactions "$cross_transactions" \
  '{services:($services|length),appointments:($appointments|length),comandas:($comandas|length),items:($items|length),transactions:($transactions|length)}')"
cross_write_status="$(curl -sS -o "/private/tmp/appbello-domain-cross-${run}" -w '%{http_code}' -X POST "$url/rest/v1/services" \
  -H "apikey: $anon" -H "Authorization: Bearer $token_b" -H 'Content-Type: application/json' \
  --data "$(jq -nc --arg eid "$est_a" '{establishment_id:$eid,name:"QA CROSS DOMAIN MUST FAIL",price:1,duration:5,active:true}')")"

printf 'diagnostic=%s cross_write_http=%s\n' "$cross_results" "$cross_write_status" >&2
[[ "$(printf '%s' "$cross_results" | jq '[.[]] | add')" == 0 ]]
[[ "$cross_write_status" == 401 || "$cross_write_status" == 403 ]]

jq -nc \
  --argjson created "$(jq -nc --arg a "$service_id" --arg b "$client_id" --arg c "$appointment_id" --arg d "$comanda_id" --arg e "$item_id" --arg f "$transaction_id" '[$a,$b,$c,$d,$e,$f] | all(length > 0)')" \
  --argjson cross "$cross_results" --arg write "$cross_write_status" \
  '{domain_records_created:$created,cross_tenant_visible_counts:$cross,cross_tenant_write_http:($write|tonumber),cleanup:true}'
rm -f "/private/tmp/appbello-domain-cross-${run}"
