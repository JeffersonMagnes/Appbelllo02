# Inventário de schema — AppBello

**Data:** 19/07/2026  
**Tarefa:** DB-001 — Consolidar schema e migrations

## Situação confirmada

- O histórico remoto e o local estão alinhados nas 16 migrations após a reconciliação de 19/07/2026.
- O contrato OpenAPI privilegiado confirmou **28 tabelas** e **11 RPCs** no schema público de produção.
- O arquivo legado `supabase-setup.sql` contém a criação do schema-base, mas não integra o histórico versionado.
- Um banco vazio não pode ser reconstruído apenas com `supabase/migrations`, pois as primeiras migrations incrementais pressupõem tabelas já existentes.
- A inspeção remota foi somente leitura. A exportação via `supabase db dump` não foi possível porque a CLI instalada depende do Docker; nenhum Supabase local será criado.

## Migrations anteriormente ausentes do histórico remoto

| Versão | Arquivo | Tratamento antes de aplicar |
|---|---|---|
| 20260604160000 | `product_images.sql` | A tabela já existe em produção; reconciliar histórico, não reaplicar cegamente |
| 20260623180000 | `demo_data_flag.sql` | Comparar coluna/valor atual antes de executar |
| 20260701200000 | `fix_comandas_schema.sql` | Comandas já existem e receberam correções posteriores; revisar compatibilidade |

As três versões foram marcadas como aplicadas somente após confirmar suas tabelas e colunas. A migration `20260719110000_reconcile_untracked_schema.sql` completou os índices ausentes, normalizou RLS de `product_images` e confirmou a estrutura de `comanda_items`.

## Tabelas encontradas em produção

`admin_users`, `anamnesis_submissions`, `anamnesis_templates`, `app_settings`, `appointments`, `blocked_slots`, `client_anamnesis`, `clients`, `comanda_items`, `comandas`, `employees`, `establishments`, `offers`, `online_order_items`, `online_orders`, `partner_ads`, `plans`, `product_images`, `products`, `professional_services`, `professionals`, `profiles`, `service_categories`, `service_packages`, `services`, `subscriptions`, `transactions`, `working_hours`.

## Tabelas referenciadas diretamente pelo código

`admin_users`, `anamnesis_submissions`, `anamnesis_templates`, `app_settings`, `appointments`, `avatars`, `blocked_slots`, `client_anamnesis`, `clients`, `comanda_items`, `comandas`, `employees`, `establishments`, `online_order_items`, `online_orders`, `orders`, `partner_ads`, `plans`, `product_images`, `products`, `professional_services`, `professionals`, `profiles`, `service_categories`, `service_packages`, `services`, `transactions`.

`avatars` foi confirmado como bucket de Storage, não tabela pública. A referência incorreta do dashboard a `orders` foi corrigida para `online_orders` em 19/07/2026.

## RPCs referenciadas pelo código

`admin_bulk_extend_trial`, `admin_extend_trial`, `create_public_booking`, `get_admin_establishments`, `get_carousel_ads`, `get_public_storefront`, `get_user_id_by_email`.

Produção expõe 11 RPCs: `admin_bulk_extend_trial`, `admin_extend_trial`, `create_public_booking`, `get_admin_establishments`, `get_carousel_ads`, `get_public_storefront`, `get_push_token_for_establishment`, `get_user_establishment_id`, `is_app_admin`, `is_super_admin` e `unaccent`.

As migrations versionam explicitamente apenas parte delas. O código chama `get_user_id_by_email`, que **não existe em produção**. Essa chamada pertence ao login de funcionário e não deve ser recriada como busca pública por e-mail: o fluxo atual também consulta PIN no navegador e precisa ser substituído por autenticação server-side no AUTH-001.

## Divergências de ambiente encontradas

- A chave anônima em `Portal-site/.env` recebe HTTP 401 e está desatualizada ou revogada.
- A chave pública atual obtida pela CLI funciona nos testes de integração.
- Nenhuma chave foi impressa no relatório ou gravada em arquivo versionado.

## Hardening multi-tenant — DB-002

Em 20/07/2026, a auditoria de metadados confirmou duas tabelas sem RLS (`admin_users` e `app_settings`), leituras públicas diretas excessivas e ausência de índices não parciais em FKs/filtros tenant. A migration `20260720122000_harden_multitenant_rls_and_indexes.sql`:

- habilitou RLS nas tabelas administrativas;
- padronizou owner/admin com `USING` e `WITH CHECK` explícitos;
- removeu leitura direta pública de empresas, profissionais, imagens de produto, pedidos e itens;
- preservou o catálogo público somente pela RPC whitelist;
- restringiu escrita de planos e anúncios a administradores validados;
- adicionou 23 índices para filtros tenant, datas e FKs;
- removeu a função temporária usada exclusivamente para auditar metadados.

Testes em produção confirmaram cross-tenant zero, escritas comuns HTTP 403/SQLSTATE 42501, catálogo público HTTP 200, acesso administrativo HTTP 200 e limpeza dos usuários/dados temporários.
- A introspecção OpenAPI pública está bloqueada; o inventário exigiu credencial administrativa temporária e retornou somente metadados.

## Próxima execução segura

1. Extrair metadados de colunas, constraints, funções, triggers e policies do banco remoto por consultas de catálogo autenticadas.
2. Gerar uma baseline idempotente anterior a `20260604134408` sem dados de produção.
3. Incorporar tabelas/RPCs atualmente não versionadas.
4. Reconciliar as quatro versões locais/remotas divergentes sem reaplicar alterações incompatíveis.
5. Validar a baseline em banco descartável quando houver ambiente apropriado; não usar produção para simular banco vazio.
