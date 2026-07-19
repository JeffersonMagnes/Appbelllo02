#!/bin/zsh
set -euo pipefail

ref="${SUPABASE_PROJECT_REF:-rfuvtsnnmoovscdteqnx}"
supabase_url="https://${ref}.supabase.co"
portal_url="${APPBELLO_SMOKE_URL:-https://appbello-portal.netlify.app}"
keys="$(supabase projects api-keys --project-ref "$ref" -o json)"
service="$(printf '%s' "$keys" | jq -r '.[] | select(.name == "service_role") | .api_key' | head -n 1)"
pin="$(printf '%04d' $((RANDOM % 10000)))"
employee_id=''
cookie_file="$PWD/.employee-cookie-$RANDOM"
header_file="$PWD/.employee-header-$RANDOM"
response_file="$PWD/.employee-response-$RANDOM"

admin() { curl -fsS "$@" -H "apikey: $service" -H "Authorization: Bearer $service"; }
cleanup() {
  set +e
  [[ -z "$employee_id" ]] || admin -X DELETE "$supabase_url/rest/v1/employees?id=eq.$employee_id" >/dev/null
  rm -f "$cookie_file" "$header_file" "$response_file"
}
trap cleanup EXIT INT TERM

print -u2 'stage:establishment'
establishment="$(admin "$supabase_url/rest/v1/establishments?select=id,owner_id&limit=1" | jq -c '.[0]')"
establishment_id="$(printf '%s' "$establishment" | jq -r '.id')"
owner_id="$(printf '%s' "$establishment" | jq -r '.owner_id')"
print -u2 'stage:owner-auth-user'
owner_email="$(admin "$supabase_url/auth/v1/admin/users/$owner_id" | jq -r '.email')"
[[ -n "$establishment_id" && -n "$owner_id" && -n "$owner_email" ]]

print -u2 'stage:create-employee'
employee="$(admin -X POST "$supabase_url/rest/v1/employees" \
  -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  --data "$(jq -nc --arg eid "$establishment_id" --arg pin "$pin" '{establishment_id:$eid,name:"QA EMPLOYEE AUTH",role:"professional",pin:$pin,active:true,permissions:{viewAgenda:true,viewClients:true}}')")"
employee_id="$(printf '%s' "$employee" | jq -r '.[0].id')"
[[ -n "$employee_id" ]]

print -u2 'stage:anonymous-session'
anonymous_status="$(curl -sS -o /dev/null -w '%{http_code}' "$portal_url/api/employee/session")"
print -u2 "anonymous_http=$anonymous_status"
[[ "$anonymous_status" == 401 ]]

print -u2 'stage:login'
login_status="$(curl -sS -o "$response_file" -D "$header_file" -c "$cookie_file" -w '%{http_code}' \
  -X POST "$portal_url/api/employee/session" -H 'Content-Type: application/json' \
  --data "$(jq -nc --arg email "$owner_email" --arg pin "$pin" '{ownerEmail:$email,pin:$pin}')")"
[[ "$login_status" == 200 ]]
rg -qi '^set-cookie: appbello_employee_session=.*httponly' "$header_file"

session_status="$(curl -sS -o /dev/null -b "$cookie_file" -w '%{http_code}' "$portal_url/api/employee/session")"
dashboard_status="$(curl -sS -o /dev/null -b "$cookie_file" -w '%{http_code}' "$portal_url/api/employee/dashboard?date=2026-07-19")"
clients_status="$(curl -sS -o /dev/null -b "$cookie_file" -w '%{http_code}' "$portal_url/api/employee/clients")"
[[ "$session_status" == 200 && "$dashboard_status" == 200 && "$clients_status" == 200 ]]

logout_status="$(curl -sS -o /dev/null -b "$cookie_file" -c "$cookie_file" -w '%{http_code}' -X DELETE "$portal_url/api/employee/session")"
after_logout_status="$(curl -sS -o /dev/null -b "$cookie_file" -w '%{http_code}' "$portal_url/api/employee/session")"
[[ "$logout_status" == 200 && "$after_logout_status" == 401 ]]

jq -nc \
  --arg anonymous "$anonymous_status" --arg login "$login_status" --arg session "$session_status" \
  --arg dashboard "$dashboard_status" --arg clients "$clients_status" --arg logout "$logout_status" \
  --arg after "$after_logout_status" \
  '{anonymous_session_http:($anonymous|tonumber),login_http:($login|tonumber),http_only_cookie:true,authenticated_session_http:($session|tonumber),employee_dashboard_http:($dashboard|tonumber),employee_clients_http:($clients|tonumber),logout_http:($logout|tonumber),after_logout_http:($after|tonumber),cleanup:true}'
