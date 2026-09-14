-- Cleanup for the Fase 2 anamnesis A01-A06 live bypass tests (signed-URL
-- minting, cross-tenant storage isolation, upsert re-upload regression
-- fix). Two throwaway accounts were created via the normal public sign-up
-- flow, exercised against production, and had their establishment/storage
-- rows deleted via the accounts' own authenticated sessions immediately
-- after testing. This migration removes the two auth accounts themselves.
-- Every predicate below matches on the exact id AND exact email together —
-- nothing broader.

delete from public.profiles
where id in ('350ee2c5-59bc-4110-9aed-c543d8bb2a39', '9744b398-7a45-4a16-b1d2-26bf8c4233c7')
  and email in (
    'qa.security.anamnese.a.1789355863@appbello-qa-test.invalid',
    'qa.security.anamnese.b.1789355863@appbello-qa-test.invalid'
  );

delete from auth.users
where id in ('350ee2c5-59bc-4110-9aed-c543d8bb2a39', '9744b398-7a45-4a16-b1d2-26bf8c4233c7')
  and email in (
    'qa.security.anamnese.a.1789355863@appbello-qa-test.invalid',
    'qa.security.anamnese.b.1789355863@appbello-qa-test.invalid'
  );
