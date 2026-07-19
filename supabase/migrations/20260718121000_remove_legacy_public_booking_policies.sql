-- Apply only after every supported public booking client uses
-- public.create_public_booking. Applying this early breaks older app versions.

drop policy if exists "clients_public_select" on public.clients;
drop policy if exists "clients_public_insert" on public.clients;
drop policy if exists "appointments_public_insert" on public.appointments;
