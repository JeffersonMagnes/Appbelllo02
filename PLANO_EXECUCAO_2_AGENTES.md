# Plano de execução das 31 tarefas restantes — dois agentes

**Atualizado em:** 20/07/2026  
**Base:** `PLANO_DESENVOLVIMENTO_APPBELLO.md`  
**Objetivo:** executar o backlog restante em paralelo, sem migrations concorrentes, regras duplicadas ou publicação sem validação.

## Papéis

### Agente A — núcleo, banco e integração

Responsável por `supabase/migrations`, RLS, backend, APIs, regras transacionais, assinaturas, performance de dados, carga e integração final. É também o **validador** das entregas do Agente B.

### Agente B — interfaces, paridade e conformidade

Responsável por Mobile/Web UI, matriz de paridade, Design System, acessibilidade, jornadas, inventários LGPD e preparação de configurações das lojas. Não aplica migrations nem publica em produção.

## Regras de colaboração

1. Cada tarefa usa branch própria: `agent-a/ID-descricao` ou `agent-b/ID-descricao`.
2. O Agente B não altera `supabase/migrations`, `Portal-site/app/api` ou `Portal-site/lib/server` sem transferência explícita de ownership.
3. O Agente A evita editar telas sob trabalho do Agente B na mesma onda.
4. Cada entrega contém: resumo, arquivos alterados, riscos, testes executados e pendências.
5. Nenhuma migration é aplicada por outro agente. O Agente A revisa, faz `dry-run`, aplica isoladamente e testa limpeza.
6. Nenhuma entrega vai para `main` sem typecheck/testes aplicáveis e revisão de paridade Mobile/Web.
7. Mercado Pago e distribuição nas lojas permanecem bloqueados até autorização expressa; o código preparatório pode avançar sem ativar cobrança ou publicar aplicativo.
8. Dados temporários de produção devem ter prefixo `QA`, limpeza automática e evidência de contagem final zero.

## Ondas de execução

### Onda 1 — concluir o núcleo técnico

| # | ID | Agente | Dependência | Entrega | Estimativa |
|---:|---|---|---|---|---:|
| 1 | DB-001 | A | — | baseline reproduzível das migrations e relatório de divergências | 1–2 d |
| 2 | OBS-001 | A | — | error boundaries, logs estruturados, correlation ID e captura sem PII | 1–2 d |
| 3 | ARC-001 | A | DB-001 | contratos versionados e matriz de autorização por módulo | 1–2 d |
| 4 | ARC-002 | A | ARC-001 | serviços/repositórios do monólito modular para regras críticas | 2–4 d |
| 5 | DB-002 | A | DB-001 | RLS multiempresa, `WITH CHECK`, cascatas, constraints e índices | 1–2 d |
| 6 | CODE-001 | B | matriz inicial de arquivos | decomposição das telas gigantes sem mudar regras | 3–5 d |

**Gate O1:** migrations reproduzíveis; RLS owner/employee/admin/public verde; typecheck/lint/build verdes; nenhum P0/P1 novo.

### Onda 2 — paridade, UX e base comercial sem gateway

| # | ID | Agente | Dependência | Entrega | Estimativa |
|---:|---|---|---|---|---:|
| 7 | PROD-001 | A + Produto | ARC-001 | catálogo comercial versionado; sem integração de pagamento | 1 d + aprovação |
| 8 | SUB-001 | A | PROD-001, DB-002 | schema e máquina de estados de assinaturas | 2–3 d |
| 9 | SUB-002 | A | SUB-001 | entitlements canônicos consumíveis por Web/Mobile | 2–3 d |
| 10 | SUB-003 | A | SUB-001 | trial único e datas exclusivamente server-side | 1–2 d |
| 11 | PAR-001 | B | ARC-001 | matriz completa módulo/capacidade/contrato/permissão/Web/Mobile | 1–2 d |
| 12 | PAR-002 | B | PAR-001, SUB-002 | correção das divergências de regras e validações | 3–5 d |
| 13 | UX-001 | B | PAR-001 | auditoria Nielsen das jornadas críticas e evidências | 2–3 d |
| 14 | DS-001 | B | UX-001 | tokens e componentes compartilhados/documentados | 3–5 d |
| 15 | A11Y-001 | B | UX-001 | acessibilidade Mobile nos fluxos críticos | 3–5 d |
| 16 | A11Y-002 | B | UX-001 | teclado, foco, semântica e WCAG 2.2 AA no Web | 3–5 d |

**Gate O2:** entitlements não são decididos pela UI; matriz crítica 100%; mesmas entradas geram os mesmos resultados; auditoria automatizada sem violações sérias.

### Onda 3 — performance, escala e LGPD

| # | ID | Agente | Dependência | Entrega | Estimativa |
|---:|---|---|---|---|---:|
| 17 | PERF-001 | A | OBS-001 | Web Vitals, API p50/p95/p99 e budgets Mobile/Web | 1–2 d |
| 18 | PERF-002 | A + B | PERF-001 | paginação, índices, cache, virtualização e imagens | 3–5 d |
| 19 | SCALE-001 | A | PERF-001, DB-002 | carga de login, agenda, dashboard, concorrência e notificações | 2–3 d |
| 20 | SCALE-002 | A | SCALE-001 | retries, outbox, pooling, backup/restauração e runbooks | 3–5 d |
| 21 | LGPD-001 | B | ARC-001 | inventário de dados, finalidade, base legal, retenção e descarte | 2–3 d |
| 22 | LGPD-002 | A + B | LGPD-001, DB-002 | acesso, exportação, correção e exclusão/anonimização auditável | 3–5 d |
| 23 | LGPD-003 | B + Jurídico | LGPD-001 | tratamento de dados sensíveis e plano de incidentes | 2–3 d + revisão |

**Gate O3:** SLOs mensurados; carga-alvo aprovada; restauração testada; direitos LGPD executáveis e documentação coerente com o sistema.

### Onda 4 — monetização real, adiada até autorização

| # | ID | Agente | Dependência | Entrega | Estimativa |
|---:|---|---|---|---|---:|
| 24 | PAY-001 | A | SUB-001 | interface abstrata de gateway e simulador somente de teste | 1–2 d |
| 25 | PAY-002 | A | PAY-001, credenciais | Mercado Pago, webhooks, reconciliação e sandbox | 3–5 d |
| 26 | SUB-004 | A + B | PAY-002 | sincronização Web/Mobile após confirmação do webhook | 2–3 d |
| 27 | STORE-001 | B + Produto/Jurídico | PROD-001 | decisão documentada sobre IAP/Play Billing | 1–3 d + aprovação |

**Gate O4:** nenhum retorno do navegador libera plano; webhook verificado e idempotente; estados iguais no Mobile/Web. Esta onda permanece **não iniciada** até autorização.

### Onda 5 — preparação de release, sem distribuição automática

| # | ID | Agente | Dependência | Entrega | Estimativa |
|---:|---|---|---|---|---:|
| 28 | IOS-001 | B | STORE-001, LGPD | configuração, assets, permissões e checklist Apple | 2–4 d |
| 29 | AND-001 | B | STORE-001, LGPD | configuração, AAB, Data Safety e checklist Google | 2–4 d |
| 30 | QA-002 | A + B | O1–O4 | regressão completa e beta fechado com evidências | 3–5 d + janela beta |
| 31 | REL-001 | A | QA-002 | release candidate, rollback, suporte e aprovação formal | 2–3 d |

**Gate O5:** zero P0/P1, crash-free ≥99,5%, rollback ensaiado e aprovação formal. Preparar não autoriza enviar às lojas.

## Ordem paralela recomendada

```text
Agente A: DB-001 → DB-002 → ARC-001 → ARC-002 → OBS-001
Agente B: PAR-001 → UX-001 → CODE-001 → DS-001 → A11Y-001/002
                         ↓ validação conjunta
Agente A: SUB-001/002/003 → PERF/SCALE → LGPD-002
Agente B: PAR-002 → LGPD-001/003 → preparação IOS/Android
                         ↓ autorização futura
                 PAY-001/002 → SUB-004 → QA-002 → REL-001
```

## Protocolo de validação pelo Agente A

Para cada entrega do Agente B:

1. revisar diff e confirmar escopo/ownership;
2. executar contratos, typecheck, lint e build afetados;
3. comparar comportamento Web/Mobile na matriz `PAR-001`;
4. revisar segurança, PII, mocks e regras comerciais locais;
5. executar smoke test em preview antes de produção;
6. aprovar, solicitar correção ou rejeitar com evidência objetiva;
7. somente após aprovação, integrar em `main` e observar o deploy.

## Previsão com dois agentes

- **Escopo executável agora (ondas 1–3):** 3–5 semanas.
- **Monetização após autorização:** mais 1–2 semanas.
- **Release/lojas e beta:** mais 2–4 semanas, incluindo aprovações externas.
- **Total completo:** aproximadamente 6–10 semanas com paralelismo e sem bloqueios externos.

As estimativas são de calendário, não de tempo sem entregas: cada tarefa deve gerar uma entrega validável diariamente ou a cada 1–3 dias.
