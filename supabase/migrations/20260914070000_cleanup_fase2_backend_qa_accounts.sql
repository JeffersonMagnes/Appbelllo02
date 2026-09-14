-- Cleanup for the Fase 2 backend Hono live tests (U01-U06, AI01-AI04),
-- run locally against the backend's own auth/rate-limit/validation code
-- using two throwaway accounts created via the normal public sign-up flow.
-- Neither account created any establishment or product data — only the
-- auth account and its auto-created profile row need removing. Every
-- predicate below matches on the exact id AND exact email together —
-- nothing broader.

delete from public.profiles
where id in ('64e9265c-c274-4171-a969-09004aeea801', '5a66054f-8516-4fad-9466-b0ed1d56f8fa')
  and email in (
    'qa.security.backend.1789356342@appbello-qa-test.invalid',
    'qa.security.backend2.1789356379@appbello-qa-test.invalid'
  );

delete from auth.users
where id in ('64e9265c-c274-4171-a969-09004aeea801', '5a66054f-8516-4fad-9466-b0ed1d56f8fa')
  and email in (
    'qa.security.backend.1789356342@appbello-qa-test.invalid',
    'qa.security.backend2.1789356379@appbello-qa-test.invalid'
  );
