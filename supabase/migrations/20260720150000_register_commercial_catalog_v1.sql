-- PROD-001: register the approved commercial catalog without enabling billing.
insert into public.app_settings(key, value, updated_at)
values (
  'commercial_catalog',
  '{"version":"2026-07-20.1","status":"official","currency":"BRL","billingPeriod":"month","trialDays":30,"couponsEnabled":false,"gracePeriodDays":0,"onlineCheckoutEnabled":false,"plans":[{"id":"starter","name":"Starter","priceMonthlyCents":4900,"professionalLimit":5,"features":["Agenda ilimitada","Gestão de clientes","Controle financeiro","Relatórios","Controle de estoque","Comissões"]},{"id":"pro","name":"Pro","priceMonthlyCents":9900,"professionalLimit":null,"features":["Tudo do Starter","Profissionais ilimitados","Assistente IA","Link de agendamento premium","Suporte prioritário"]}]}'::jsonb,
  now()
)
on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;

update public.app_settings
set value = jsonb_set(coalesce(value, '{}'::jsonb), '{trialDays}', '30'::jsonb, true),
    updated_at = now()
where key = 'geral';
