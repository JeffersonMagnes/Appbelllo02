-- Reconcile the notes field already used by Web/Mobile contracts.
alter table public.comandas add column if not exists notes text;
