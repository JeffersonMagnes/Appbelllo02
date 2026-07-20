#!/bin/zsh
set -euo pipefail
ref="${SUPABASE_PROJECT_REF:-rfuvtsnnmoovscdteqnx}"
url="https://${ref}.supabase.co"
keys="$(supabase projects api-keys --project-ref "$ref" -o json)"
anon="$(printf '%s' "$keys" | jq -r '.[]|select(.name=="anon")|.api_key'|head -n1)"
service="$(printf '%s' "$keys" | jq -r '.[]|select(.name=="service_role")|.api_key'|head -n1)"
run="$(date +%s)-$RANDOM"; password="$(openssl rand -base64 24 | tr -d '\n')Aa1!"; user_id=''
admin() { curl -fsS "$@" -H "apikey: $service" -H "Authorization: Bearer $service"; }
cleanup() {
  set +e
  [[ -z "$user_id" ]] || admin -X DELETE "$url/rest/v1/admin_users?user_id=eq.$user_id" >/dev/null
  [[ -z "$user_id" ]] || admin -X DELETE "$url/auth/v1/admin/users/$user_id" >/dev/null
}
trap cleanup EXIT INT TERM

email="qa-db002-$run@qa.appbello.com.br"
user_id="$(admin -X POST "$url/auth/v1/admin/users" -H 'Content-Type: application/json' --data "$(jq -nc --arg e "$email" --arg p "$password" '{email:$e,password:$p,email_confirm:true}')" | jq -r '.id')"
token="$(curl -fsS -X POST "$url/auth/v1/token?grant_type=password" -H "apikey: $anon" -H 'Content-Type: application/json' --data "$(jq -nc --arg e "$email" --arg p "$password" '{email:$e,password:$p}')" | jq -r '.access_token')"

anon_get() { curl -fsS "$url/rest/v1/$1" -H "apikey: $anon" -H "Authorization: Bearer $anon"; }
user_get() { curl -fsS "$url/rest/v1/$1" -H "apikey: $anon" -H "Authorization: Bearer $token"; }
anon_establishments="$(anon_get 'establishments?select=id&limit=1' | jq 'length')"
anon_orders="$(anon_get 'online_orders?select=id&limit=1' | jq 'length')"
anon_order_items="$(anon_get 'online_order_items?select=id&limit=1' | jq 'length')"
anon_images="$(anon_get 'product_images?select=id&limit=1' | jq 'length')"
ordinary_settings="$(user_get 'app_settings?select=key&limit=1' | jq 'length')"
ordinary_admin_rows="$(user_get 'admin_users?select=user_id&limit=1' | jq 'length')"

settings_write="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$url/rest/v1/app_settings" -H "apikey: $anon" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data "$(jq -nc --arg k "qa-db002-$run" '{key:$k,value:{qa:true}}')")"
plan_error="/private/tmp/appbello-db002-plan-$run.json"
plan_write="$(curl -sS -o "$plan_error" -w '%{http_code}' -X POST "$url/rest/v1/plans" -H "apikey: $anon" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data "$(jq -nc --arg s "qa$RANDOM" '{name:"QA",slug:$s,price:1,color:"#000000",featured:false,active:false,features:{},sort_order:999}')")"
ad_write="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$url/rest/v1/partner_ads" -H "apikey: $anon" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data '{}')"

slug="$(admin "$url/rest/v1/establishments?active=eq.true&slug=not.is.null&select=slug&limit=1" | jq -r '.[0].slug')"
catalog_status="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$url/rest/v1/rpc/get_public_storefront" -H "apikey: $anon" -H "Authorization: Bearer $anon" -H 'Content-Type: application/json' --data "$(jq -nc --arg slug "$slug" '{p_slug:$slug}')")"

admin -X POST "$url/rest/v1/admin_users" -H 'Content-Type: application/json' --data "$(jq -nc --arg u "$user_id" '{user_id:$u,role:"admin"}')" >/dev/null
admin_rpc_status="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$url/rest/v1/rpc/get_admin_establishments" -H "apikey: $anon" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data '{}')"
admin_settings_status="$(curl -sS -o /dev/null -w '%{http_code}' "$url/rest/v1/app_settings?select=key&limit=1" -H "apikey: $anon" -H "Authorization: Bearer $token")"

print -u2 "anon_counts=$anon_establishments,$anon_orders,$anon_order_items,$anon_images ordinary_counts=$ordinary_settings,$ordinary_admin_rows"
print -u2 "write_http=$settings_write,$plan_write,$ad_write allowed_http=$catalog_status,$admin_rpc_status,$admin_settings_status"
print -u2 "plan_error_code=$(jq -r '.code // "none"' "$plan_error")"

[[ "$anon_establishments" == 0 && "$anon_orders" == 0 && "$anon_order_items" == 0 && "$anon_images" == 0 ]]
[[ "$ordinary_settings" == 0 && "$ordinary_admin_rows" == 0 ]]
[[ "$settings_write" == 401 || "$settings_write" == 403 ]]
[[ "$plan_write" == 401 || "$plan_write" == 403 || ( "$plan_write" == 400 && "$(jq -r '.code' "$plan_error")" == '42501' ) ]]
[[ "$ad_write" == 401 || "$ad_write" == 403 ]]
[[ "$catalog_status" == 200 && "$admin_rpc_status" == 200 && "$admin_settings_status" == 200 ]]

jq -nc --arg settings "$settings_write" --arg plan "$plan_write" --arg ad "$ad_write" --arg catalog "$catalog_status" --arg admin "$admin_rpc_status" '{anonymous_direct_private_reads_zero:true,ordinary_admin_tables_zero:true,ordinary_settings_write_http:($settings|tonumber),ordinary_plan_write_http:($plan|tonumber),ordinary_ad_write_http:($ad|tonumber),public_catalog_rpc_http:($catalog|tonumber),admin_rpc_http:($admin|tonumber),cleanup:true}'
rm -f "$plan_error"
