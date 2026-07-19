#!/bin/zsh
set -euo pipefail

project_ref="${SUPABASE_PROJECT_REF:-rfuvtsnnmoovscdteqnx}"
base_url="https://${project_ref}.supabase.co"
keys_json="$(supabase projects api-keys --project-ref "$project_ref" -o json)"
anon_key="$(printf '%s' "$keys_json" | jq -r '.[] | select(.name == "anon") | (.api_key // .key // .value // empty)' | head -n 1)"
service_key="$(printf '%s' "$keys_json" | jq -r '.[] | select(.name == "service_role") | (.api_key // .key // .value // empty)' | head -n 1)"
run_id="$(date +%s)-$RANDOM"
password="$(openssl rand -base64 30 | tr -d '\n')Aa1!"
email_a="qa-rls-a-${run_id}@qa.appbello.com.br"
email_b="qa-rls-b-${run_id}@qa.appbello.com.br"
user_a=''
user_b=''
est_a=''
est_b=''
client_a=''

admin_request() {
  curl -fsS "$@" -H "apikey: $service_key" -H "Authorization: Bearer $service_key"
}

cleanup() {
  set +e
  [[ -z "$client_a" ]] || admin_request -X DELETE "$base_url/rest/v1/clients?id=eq.$client_a" >/dev/null
  [[ -z "$est_a" ]] || admin_request -X DELETE "$base_url/rest/v1/establishments?id=eq.$est_a" >/dev/null
  [[ -z "$est_b" ]] || admin_request -X DELETE "$base_url/rest/v1/establishments?id=eq.$est_b" >/dev/null
  if [[ -n "$user_a" ]]; then
    admin_request -X DELETE "$base_url/rest/v1/admin_users?user_id=eq.$user_a" >/dev/null
    admin_request -X DELETE "$base_url/auth/v1/admin/users/$user_a" >/dev/null
  fi
  [[ -z "$user_b" ]] || admin_request -X DELETE "$base_url/auth/v1/admin/users/$user_b" >/dev/null
}
trap cleanup EXIT INT TERM

create_user() {
  local email="$1"
  admin_request -X POST "$base_url/auth/v1/admin/users" \
    -H 'Content-Type: application/json' \
    --data "$(jq -nc --arg email "$email" --arg password "$password" '{email:$email,password:$password,email_confirm:true,user_metadata:{purpose:"temporary_rls_qa"}}')"
}

user_a="$(create_user "$email_a" | jq -r '.id')"
user_b="$(create_user "$email_b" | jq -r '.id')"

login() {
  local email="$1"
  curl -fsS -X POST "$base_url/auth/v1/token?grant_type=password" \
    -H "apikey: $anon_key" -H 'Content-Type: application/json' \
    --data "$(jq -nc --arg email "$email" --arg password "$password" '{email:$email,password:$password}')" | jq -r '.access_token'
}

token_a="$(login "$email_a")"
token_b="$(login "$email_b")"

establishments="$(admin_request -X POST "$base_url/rest/v1/establishments" \
  -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  --data "$(jq -nc --arg a "$user_a" --arg b "$user_b" --arg run "$run_id" '[{owner_id:$a,name:("QA RLS A " + $run),business_type:"salon",active:true,slug:("qa-rls-a-" + $run)},{owner_id:$b,name:("QA RLS B " + $run),business_type:"salon",active:true,slug:("qa-rls-b-" + $run)}]')")"
est_a="$(printf '%s' "$establishments" | jq -r --arg uid "$user_a" '.[] | select(.owner_id == $uid) | .id')"
est_b="$(printf '%s' "$establishments" | jq -r --arg uid "$user_b" '.[] | select(.owner_id == $uid) | .id')"

insert_a="$(curl -fsS -X POST "$base_url/rest/v1/clients" \
  -H "apikey: $anon_key" -H "Authorization: Bearer $token_a" \
  -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  --data "$(jq -nc --arg eid "$est_a" --arg run "$run_id" '{establishment_id:$eid,name:("QA RLS CLIENT " + $run),phone:"11988887777"}')")"
client_a="$(printf '%s' "$insert_a" | jq -r '.[0].id')"

cross_read="$(curl -fsS "$base_url/rest/v1/clients?id=eq.$client_a&select=id" -H "apikey: $anon_key" -H "Authorization: Bearer $token_b")"
cross_write_status="$(curl -sS -o /private/tmp/appbello-rls-cross-write-${run_id} -w '%{http_code}' -X POST "$base_url/rest/v1/clients" \
  -H "apikey: $anon_key" -H "Authorization: Bearer $token_b" -H 'Content-Type: application/json' \
  --data "$(jq -nc --arg eid "$est_a" '{establishment_id:$eid,name:"QA CROSS WRITE MUST FAIL",phone:"11977776666"}')")"
anon_read="$(curl -fsS "$base_url/rest/v1/clients?id=eq.$client_a&select=id" -H "apikey: $anon_key" -H "Authorization: Bearer $anon_key")"

owner_admin_rpc_status="$(curl -sS -o /private/tmp/appbello-rls-owner-rpc-${run_id} -w '%{http_code}' -X POST "$base_url/rest/v1/rpc/get_admin_establishments" -H "apikey: $anon_key" -H "Authorization: Bearer $token_b" -H 'Content-Type: application/json' --data '{}')"
admin_request -X POST "$base_url/rest/v1/admin_users" -H 'Content-Type: application/json' -H 'Prefer: return=minimal' --data "$(jq -nc --arg uid "$user_a" '{user_id:$uid,role:"admin"}')" >/dev/null
admin_rows="$(curl -fsS -X POST "$base_url/rest/v1/rpc/get_admin_establishments" -H "apikey: $anon_key" -H "Authorization: Bearer $token_a" -H 'Content-Type: application/json' --data '{}')"

own_insert_ok="$(printf '%s' "$insert_a" | jq 'length == 1')"
cross_read_blocked="$(printf '%s' "$cross_read" | jq 'length == 0')"
anon_read_blocked="$(printf '%s' "$anon_read" | jq 'length == 0')"
admin_rpc_ok="$(printf '%s' "$admin_rows" | jq 'length >= 2')"

[[ "$own_insert_ok" == true ]]
[[ "$cross_read_blocked" == true ]]
[[ "$anon_read_blocked" == true ]]
[[ "$cross_write_status" == 401 || "$cross_write_status" == 403 ]]
[[ "$owner_admin_rpc_status" == 401 || "$owner_admin_rpc_status" == 403 ]]
[[ "$admin_rpc_ok" == true ]]

jq -nc \
  --argjson logins_ok true \
  --argjson own_insert "$own_insert_ok" \
  --argjson cross_read "$cross_read_blocked" \
  --arg cross_write "$cross_write_status" \
  --argjson anon_read "$anon_read_blocked" \
  --arg owner_rpc "$owner_admin_rpc_status" \
  --argjson admin_rpc "$admin_rpc_ok" \
  '{temporary_logins:$logins_ok,owner_write_own_tenant:$own_insert,cross_tenant_read_blocked:$cross_read,cross_tenant_write_http:($cross_write|tonumber),anonymous_read_blocked:$anon_read,ordinary_owner_admin_rpc_http:($owner_rpc|tonumber),admin_rpc_allowed:$admin_rpc,cleanup:true}'

rm -f "/private/tmp/appbello-rls-cross-write-${run_id}" "/private/tmp/appbello-rls-owner-rpc-${run_id}"
