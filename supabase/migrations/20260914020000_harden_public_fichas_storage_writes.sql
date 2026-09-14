-- Fase 2 security: the anamnesis "public-fichas" storage bucket is public
-- read intentionally (a client with no AppBello account must be able to open
-- a shared ficha via a plain link). The bucket-level `public = true` flag
-- already serves reads unconditionally regardless of RLS, so this migration
-- does not touch SELECT. What it closes is writes: without an explicit
-- policy, INSERT/UPDATE/DELETE on storage.objects for this bucket had no
-- tracked authorization rule at all. Only an authenticated AppBello session
-- (the mobile app filling anamnesis in person) may write or remove files
-- here — never anon.
--
-- The real protection against reading someone else's ficha is the
-- cryptographically strong share token generated client-side (see
-- mobile/src/lib/state/anamnesis-store.ts), not this policy — this migration
-- only prevents unauthenticated parties from writing/overwriting/deleting
-- objects in the bucket.

drop policy if exists public_fichas_authenticated_write on storage.objects;
create policy public_fichas_authenticated_write
on storage.objects for insert
to authenticated
with check (bucket_id = 'public-fichas');

drop policy if exists public_fichas_authenticated_update on storage.objects;
create policy public_fichas_authenticated_update
on storage.objects for update
to authenticated
using (bucket_id = 'public-fichas')
with check (bucket_id = 'public-fichas');

drop policy if exists public_fichas_authenticated_delete on storage.objects;
create policy public_fichas_authenticated_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'public-fichas');
