-- Cleanup for the Fase 2 O01/O02 live bypass tests (public order price
-- manipulation and cross-tenant product access). Two throwaway accounts
-- were created via the normal public sign-up flow to own two temporary
-- "QA SECURITY TENANT A/B" establishments and products, exercised against
-- production, then had their establishment/product/order rows deleted via
-- the accounts' own authenticated sessions immediately after testing. This
-- migration removes the two auth accounts themselves. Every predicate below
-- matches on the exact id AND exact email together — nothing broader.

delete from public.profiles
where id in ('7009768b-c272-4b53-b317-52106994da72', 'cf113f5e-4aff-4549-9642-be26abfb5aa6')
  and email in (
    'qa.security.fase2.a.1789355458@appbello-qa-test.invalid',
    'qa.security.fase2.b.1789355458@appbello-qa-test.invalid'
  );

delete from auth.users
where id in ('7009768b-c272-4b53-b317-52106994da72', 'cf113f5e-4aff-4549-9642-be26abfb5aa6')
  and email in (
    'qa.security.fase2.a.1789355458@appbello-qa-test.invalid',
    'qa.security.fase2.b.1789355458@appbello-qa-test.invalid'
  );
