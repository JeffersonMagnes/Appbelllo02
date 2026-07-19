#!/bin/zsh
set -euo pipefail

ref="${SUPABASE_PROJECT_REF:-rfuvtsnnmoovscdteqnx}"
supabase_url="https://${ref}.supabase.co"
keys="$(supabase projects api-keys --project-ref "$ref" -o json)"
service_key="$(printf '%s' "$keys" | jq -r '.[] | select(.name == "service_role") | .api_key' | head -n 1)"
anon_key="$(printf '%s' "$keys" | jq -r '.[] | select(.name == "anon") | .api_key' | head -n 1)"
test_date="$(TZ=America/Sao_Paulo date -v+30d +%F)"
suffix="$RANDOM$RANDOM"
phone="119$(printf '%08d' $((suffix % 100000000)))"
service_id=''
employee_id=''
client_id=''
block_id=''
first_id=''
idem_id=''
tmp_dir="$(mktemp -d)"

admin() { curl -fsS "$@" -H "apikey: $service_key" -H "Authorization: Bearer $service_key"; }
cleanup() {
  set +e
  [[ -z "$first_id" ]] || admin -X DELETE "$supabase_url/rest/v1/appointments?id=eq.$first_id" >/dev/null
  [[ -z "$idem_id" ]] || admin -X DELETE "$supabase_url/rest/v1/appointments?id=eq.$idem_id" >/dev/null
  [[ -z "$employee_id" ]] || admin -X DELETE "$supabase_url/rest/v1/appointments?employee_id=eq.$employee_id" >/dev/null
  [[ -z "$block_id" ]] || admin -X DELETE "$supabase_url/rest/v1/blocked_slots?id=eq.$block_id" >/dev/null
  [[ -z "$client_id" ]] || admin -X DELETE "$supabase_url/rest/v1/clients?id=eq.$client_id" >/dev/null
  [[ -z "$employee_id" ]] || admin -X DELETE "$supabase_url/rest/v1/employees?id=eq.$employee_id" >/dev/null
  [[ -z "$service_id" ]] || admin -X DELETE "$supabase_url/rest/v1/services?id=eq.$service_id" >/dev/null
  rm -rf "$tmp_dir"
}
trap cleanup EXIT INT TERM

establishment_id="$(admin "$supabase_url/rest/v1/establishments?select=id&limit=1" | jq -r '.[0].id')"
print -u2 'stage:fixtures'
service_id="$(admin -X POST "$supabase_url/rest/v1/services" -H 'Content-Type: application/json' -H 'Prefer: return=representation' --data "$(jq -nc --arg establishment "$establishment_id" '{establishment_id:$establishment,name:"QA CONCURRENCY",price:1,duration:60,active:true}')" | jq -r '.[0].id')"
employee_id="$(admin -X POST "$supabase_url/rest/v1/employees" -H 'Content-Type: application/json' -H 'Prefer: return=representation' --data "$(jq -nc --arg establishment "$establishment_id" '{establishment_id:$establishment,name:"QA CONCURRENCY",role:"professional",active:true}')" | jq -r '.[0].id')"
client_id="$(admin -X POST "$supabase_url/rest/v1/clients" -H 'Content-Type: application/json' -H 'Prefer: return=representation' --data "$(jq -nc --arg establishment "$establishment_id" --arg phone "$phone" '{establishment_id:$establishment,name:"QA CONCURRENCY",phone:$phone}')" | jq -r '.[0].id')"

appointment_payload="$(jq -nc --arg establishment "$establishment_id" --arg employee "$employee_id" --arg service "$service_id" --arg client "$client_id" --arg date "$test_date" '{establishment_id:$establishment,employee_id:$employee,service_id:$service,client_id:$client,date:$date,time:"10:00",status:"pending",client_name:"QA CONCURRENCY"}')"
first_id="$(admin -X POST "$supabase_url/rest/v1/appointments" -H 'Content-Type: application/json' -H 'Prefer: return=representation' --data "$appointment_payload" | jq -r '.[0].id')"

print -u2 'stage:appointment-overlap'
overlap_payload="$(printf '%s' "$appointment_payload" | jq '.time="10:30"')"
overlap_status="$(curl -sS -o "$tmp_dir/overlap.json" -w '%{http_code}' -X POST "$supabase_url/rest/v1/appointments" -H "apikey: $service_key" -H "Authorization: Bearer $service_key" -H 'Content-Type: application/json' --data "$overlap_payload")"
print -u2 "overlap_http=$overlap_status code=$(jq -r '.code // "none"' "$tmp_dir/overlap.json")"
[[ "$overlap_status" == 400 && "$(jq -r '.code' "$tmp_dir/overlap.json")" == '23P01' ]]

blocked_overlap="$(jq -nc --arg establishment "$establishment_id" --arg employee "$employee_id" --arg date "$test_date" '{establishment_id:$establishment,employee_id:$employee,date:$date,start_time:"10:15",end_time:"10:45",reason:"QA"}')"
print -u2 'stage:block-over-appointment'
block_conflict_status="$(curl -sS -o "$tmp_dir/block-conflict.json" -w '%{http_code}' -X POST "$supabase_url/rest/v1/blocked_slots" -H "apikey: $service_key" -H "Authorization: Bearer $service_key" -H 'Content-Type: application/json' --data "$blocked_overlap")"
print -u2 "block_conflict_http=$block_conflict_status code=$(jq -r '.code // "none"' "$tmp_dir/block-conflict.json")"
[[ "$block_conflict_status" == 400 && "$(jq -r '.code' "$tmp_dir/block-conflict.json")" == '23P01' ]]

block_id="$(admin -X POST "$supabase_url/rest/v1/blocked_slots" -H 'Content-Type: application/json' -H 'Prefer: return=representation' --data "$(printf '%s' "$blocked_overlap" | jq '.start_time="12:00" | .end_time="13:00"')" | jq -r '.[0].id')"
print -u2 'stage:appointment-over-block'
blocked_appointment="$(printf '%s' "$appointment_payload" | jq '.time="12:30"')"
blocked_status="$(curl -sS -o "$tmp_dir/blocked.json" -w '%{http_code}' -X POST "$supabase_url/rest/v1/appointments" -H "apikey: $service_key" -H "Authorization: Bearer $service_key" -H 'Content-Type: application/json' --data "$blocked_appointment")"
print -u2 "blocked_http=$blocked_status code=$(jq -r '.code // "none"' "$tmp_dir/blocked.json")"
[[ "$blocked_status" == 400 && "$(jq -r '.code' "$tmp_dir/blocked.json")" == '23P01' ]]

print -u2 'stage:simultaneous-overlap'
concurrent_a="$(printf '%s' "$appointment_payload" | jq '.time="16:00"')"
concurrent_b="$(printf '%s' "$appointment_payload" | jq '.time="16:15"')"
curl -sS -o "$tmp_dir/concurrent-a.json" -w '%{http_code}' -X POST "$supabase_url/rest/v1/appointments" -H "apikey: $service_key" -H "Authorization: Bearer $service_key" -H 'Content-Type: application/json' --data "$concurrent_a" > "$tmp_dir/concurrent-a.code" &
pid_a=$!
curl -sS -o "$tmp_dir/concurrent-b.json" -w '%{http_code}' -X POST "$supabase_url/rest/v1/appointments" -H "apikey: $service_key" -H "Authorization: Bearer $service_key" -H 'Content-Type: application/json' --data "$concurrent_b" > "$tmp_dir/concurrent-b.code" &
pid_b=$!
wait "$pid_a"
wait "$pid_b"
concurrent_a_status="$(<"$tmp_dir/concurrent-a.code")"
concurrent_b_status="$(<"$tmp_dir/concurrent-b.code")"
print -u2 "simultaneous_http=$concurrent_a_status,$concurrent_b_status"
[[ ( "$concurrent_a_status" == 201 && "$concurrent_b_status" == 400 ) || ( "$concurrent_a_status" == 400 && "$concurrent_b_status" == 201 ) ]]

idem_key="qa-$suffix"
print -u2 'stage:idempotency'
rpc_payload="$(jq -nc --arg establishment "$establishment_id" --arg employee "$employee_id" --arg service "$service_id" --arg date "$test_date" --arg phone "$phone" --arg key "$idem_key" '{p_establishment_id:$establishment,p_service_id:$service,p_employee_id:$employee,p_date:$date,p_time:"14:00",p_client_name:"QA CONCURRENCY",p_client_phone:$phone,p_notes:null,p_idempotency_key:$key}')"
idem_id="$(curl -fsS -X POST "$supabase_url/rest/v1/rpc/create_public_booking" -H "apikey: $anon_key" -H "Authorization: Bearer $anon_key" -H 'Content-Type: application/json' --data "$rpc_payload" | jq -r '.')"
idem_repeat="$(curl -fsS -X POST "$supabase_url/rest/v1/rpc/create_public_booking" -H "apikey: $anon_key" -H "Authorization: Bearer $anon_key" -H 'Content-Type: application/json' --data "$rpc_payload" | jq -r '.')"
[[ "$idem_id" == "$idem_repeat" ]]

jq -nc --arg overlap "$overlap_status" --arg block "$block_conflict_status" --arg blocked "$blocked_status" --arg simultaneous_a "$concurrent_a_status" --arg simultaneous_b "$concurrent_b_status" --arg first "$idem_id" --arg repeated "$idem_repeat" '{overlap_http:($overlap|tonumber),block_over_appointment_http:($block|tonumber),appointment_over_block_http:($blocked|tonumber),simultaneous_http:[($simultaneous_a|tonumber),($simultaneous_b|tonumber)],idempotency_same_id:($first==$repeated),cleanup:true}'
