-- Temporary metadata-only helper. Removed by the DB-002 hardening migration.
create or replace function public.db002_schema_audit_snapshot()
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'tables', coalesce((
      select jsonb_agg(jsonb_build_object(
        'table', c.relname,
        'rls', c.relrowsecurity,
        'force_rls', c.relforcerowsecurity,
        'policies', coalesce((
          select jsonb_agg(jsonb_build_object(
            'name', p.polname,
            'command', p.polcmd,
            'roles', p.polroles,
            'using', pg_get_expr(p.polqual, p.polrelid),
            'check', pg_get_expr(p.polwithcheck, p.polrelid)
          ) order by p.polname)
          from pg_policy p where p.polrelid = c.oid
        ), '[]'::jsonb)
      ) order by c.relname)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    ), '[]'::jsonb),
    'foreign_keys', coalesce((
      select jsonb_agg(jsonb_build_object(
        'table', source.relname,
        'name', con.conname,
        'definition', pg_get_constraintdef(con.oid)
      ) order by source.relname, con.conname)
      from pg_constraint con
      join pg_class source on source.oid = con.conrelid
      join pg_namespace n on n.oid = source.relnamespace
      where n.nspname = 'public' and con.contype = 'f'
    ), '[]'::jsonb),
    'indexes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'table', tablename,
        'name', indexname,
        'definition', indexdef
      ) order by tablename, indexname)
      from pg_indexes where schemaname = 'public'
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.db002_schema_audit_snapshot() from public, anon, authenticated;
grant execute on function public.db002_schema_audit_snapshot() to service_role;
