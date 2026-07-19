# Plano Executável de Desenvolvimento — AppBello

**Base:** `AUDITORIA_GERAL_APPBELLO.md` e `AUDITORIA_MONETIZACAO.md`  
**Objetivo:** transformar o AppBello em um produto seguro, testável, paritário, monetizável e publicável.  
**Estratégia:** corrigir primeiro exposição de dados e estabilidade; depois centralizar regras; então concluir monetização, paridade, qualidade e publicação.

## Status de execução

**Última atualização:** 19/07/2026

| Tarefa | Estado | Evidência / próximo passo |
|---|---|---|
| SEC-001 | **Concluída em produção** | Migration aplicada isoladamente; teste anônimo retorna HTTP 401 / SQLSTATE 42501 |
| SEC-002 | **Concluída em produção** | políticas públicas legadas removidas; leitura anônima retorna zero clientes; inserção direta negada pela RLS; RPC pública validada após a remoção |
| SEC-003 | **Concluída em produção** | RPC e Portal publicados; health, página pública e catálogo HTTP 200; teste anônimo sem campos privados; agendamento pós-deploy criado, confirmado na agenda e removido |
| SEC-NOTIFY | **Concluída em produção** | tokens resolvidos somente no servidor; endpoint exige usuário validado e limita empresa, conteúdo e frequência; tentativa anônima retorna HTTP 401 |
| SEC-004 | Web em produção; Mobile corrigido aguardando release | cartão/PIX/cobranças fictícios removidos; Web informa integração em implantação; Mobile não ativa, troca ou cancela assinatura localmente; typechecks verdes |
| WEB-001 | **Concluída em produção** | telefone fictício, datas desatualizadas, estatísticas e promessas sem evidência removidas; trial e gateway descritos honestamente; seis páginas públicas e health validados com HTTP 200 |
| QA-001 | Cobertura inicial operacional implementada | 8 contratos + 6 smoke tests aprovados; integrações validam login/admin, clientes, serviços, agenda, comandas/itens e transações com isolamento cross-tenant. Testes revelaram e corrigiram RLS inválida de comandas e leitura cruzada de serviços; limpeza confirmou zero registros temporários. Assinatura canônica fica fora até o domínio backend existir |
| DEV-001 | **Concluída localmente** | comando único `bun run quality` executa contratos, typecheck, lint, build Web, bundle Android de validação e typecheck Backend; workflows de qualidade e QA de produção criados. Ativação remota depende apenas de conectar estes arquivos ao repositório GitHub |
| DB-001 | **Em execução — histórico reconciliado** | 28 tabelas e 11 RPCs inventariadas; 3 migrations divergentes reconciliadas; índices demo e schema de produtos/comandas normalizados pela migration `20260719110000`; histórico local/remoto alinhado e testes RLS aprovados. Falta gerar e validar baseline em banco descartável |
| AUTH-001 | **Concluída em produção** | Netlify conectado ao GitHub e build remoto do commit `3a2b7d0` publicado; Route Handlers ativos. Teste integrado: anônimo 401, login 200, cookie HttpOnly, sessão/dashboard/clientes 200, logout 200, pós-logout 401 e limpeza do funcionário temporário confirmada |
| WEB-DOMAIN | **DNS concluído; HTTPS aguardando emissão** | `appbello.com.br` definido como principal e `www` como alias no Netlify; A/CNAME confirmados nos servidores autoritativos do Registro.br, Cloudflare e Google; URLs internas migradas. Falta o Netlify emitir o certificado específico e habilitar o redirecionamento HTTPS |
| DOM-001 | **Concluída em produção** | trigger transacional serializa escritas por empresa/data e impede sobreposição de profissional e bloqueios; fuso explícito e idempotência adicionados. Teste simultâneo retornou 201/400 (somente uma reserva), conflitos retornaram SQLSTATE 23P01, repetição retornou o mesmo ID e a limpeza foi confirmada |
| MOB-001 | **Concluída** | `bun run typecheck` Mobile retorna código 0 |
| BE-001 | **Concluída** | dependências do lockfile restauradas; `bun run typecheck` backend retorna código 0 |
| WEB typecheck | **Concluído** | `bun run typecheck` Portal-site retorna código 0 |
| Mobile lint | **Sem erros** | Hook condicional corrigido; restam 315 avisos para saneamento incremental |
| Web lint | **Sem erros** | script corrigido para ESLint direto; restam 60 avisos |
| Web build | **Concluído** | build de produção gerou 70 páginas e todas as rotas com código 0 |

Migration de segurança preparada: `supabase/migrations/20260718120000_secure_public_booking_and_admin_rpc.sql`.

Contrato público de catálogo aplicado e Portal publicado em produção: `supabase/migrations/20260718122000_public_storefront_rpc.sql`. Testes pós-deploy confirmaram health, página pública, catálogo e agendamento. O endpoint `/api/notify` também foi protegido: nenhum token é aceito do navegador e chamadas anônimas são negadas.

## 1. Regras de execução

1. Nenhuma fase avança com bloqueador P0 aberto.
2. Cada tarefa só termina após cumprir seu critério de aceite e anexar evidência de teste.
3. Mobile e Web não podem criar novas regras comerciais locais.
4. Toda mutação crítica deve ser validada no servidor e protegida por autorização/RLS.
5. Mocks não podem ser usados silenciosamente em produção.
6. Mudanças de banco devem ser migrations versionadas, reversíveis quando possível e testadas em ambiente limpo.
7. Cada entrega deve manter typecheck e testes verdes.
8. Nenhuma publicação ocorre antes do marco de Release Candidate.

## 2. Papéis sugeridos

Uma pessoa pode acumular papéis; eles indicam responsabilidade, não tamanho obrigatório da equipe.

| Papel | Responsabilidade |
|---|---|
| Tech Lead | arquitetura, prioridades, revisão e decisões de domínio |
| Backend/Supabase | APIs, migrations, RLS, jobs, integrações e observabilidade |
| Mobile | Expo/React Native, acessibilidade, integração e publicação |
| Web | Web App, Site, acessibilidade, SEO e integração |
| QA | casos de teste, regressão, dispositivos e evidências |
| Produto/Comercial | catálogo, regras, mensagens, funil e aceite funcional |
| Jurídico/Privacidade | LGPD, termos, políticas, retenção e lojas |

## 3. Cronograma de referência

| Fase | Duração estimada | Resultado |
|---|---:|---|
| Fase 0 — Contenção | 2–4 dias | exposições críticas fechadas |
| Fase 1 — Estabilização | 1–2 semanas | builds verdes e testes básicos |
| Fase 2 — Fundação backend | 2–4 semanas | regras críticas centralizadas |
| Fase 3 — Monetização | 2–4 semanas | assinatura e Mercado Pago reais |
| Fase 4 — Paridade e UX | 2–4 semanas | Mobile/Web coerentes e acessíveis |
| Fase 5 — Performance/LGPD | 1–3 semanas | produto observável e governado |
| Fase 6 — Publicação | 1–3 semanas | beta fechado e release candidate |

Com execução sequencial por uma pessoa: aproximadamente **11–20 semanas**. Com frentes paralelas após a Fase 1: aproximadamente **7–12 semanas**, sem contar aprovações externas.

## 4. Fase 0 — Contenção de segurança

**Meta:** impedir exposição de dados e funcionalidades enganosas antes de ampliar o produto.

### SEC-001 — Restringir função administrativa

- **Prioridade:** P0
- **Responsável:** Backend/Supabase
- **Ação:** revogar `get_admin_establishments()` de `anon` e usuários autenticados comuns; permitir somente execução administrativa validada.
- **Teste:** usuário anônimo, owner e employee recebem negação; admin autorizado recebe somente os campos necessários.
- **Aceite:** nenhum papel público consegue enumerar empresas, proprietários, e-mails, telefones ou endereços.

### SEC-002 — Remover leitura pública de clientes

- **Prioridade:** P0
- **Dependência:** nenhuma
- **Ação:** remover `clients_public_select`; substituir a checagem de duplicidade por RPC/API que retorne apenas resultado mínimo e seja limitada por tenant e rate limit.
- **Teste:** chave anônima não consegue listar clientes nem consultar PII.
- **Aceite:** agendamento público funciona sem leitura pública da tabela.

### SEC-003 — Criar views públicas com whitelist

- **Prioridade:** P0
- **Ação:** substituir leitura pública direta de `establishments`, profissionais e serviços por views/RPCs que exponham somente dados necessários.
- **Aceite:** nenhum campo interno, financeiro, de assinatura ou contato privado aparece em respostas públicas.

### SEC-004 — Suspender simulações com aparência real

- **Prioridade:** P0
- **Responsáveis:** Mobile/Web/Produto
- **Ação:** remover ou marcar inequivocamente pagamentos, cartões, PIX, histórico, login demo e ativação local como demonstração; impedir uso em produção.
- **Aceite:** nenhum usuário consegue ativar, cancelar ou trocar assinatura sem backend.

### WEB-001 — Corrigir afirmações e placeholders públicos

- **Prioridade:** P0
- **Ação:** revisar telefones fictícios, datas fixas, © 2025 e alegações não comprovadas de criptografia, backup e conformidade.
- **Aceite:** todos os contatos/URLs funcionam e cada afirmação pode ser comprovada.

### Marco M0 — Contenção aprovada

- testes manuais de exposição anônima aprovados;
- nenhum fluxo simulado liberando benefício;
- registro das correções e migrations revisado.

## 5. Fase 1 — Estabilização e engenharia básica

### MOB-001 — Zerar erros TypeScript Mobile

- **Prioridade:** P0
- **Ação:** corrigir os 17 erros detectados em `ErrorUtils`, anamnese e produtos.
- **Aceite:** `bun run typecheck` termina com código 0.

### BE-001 — Corrigir ambiente de typecheck do backend

- **Prioridade:** P0
- **Ação:** garantir TypeScript disponível e compatível no ambiente do backend.
- **Aceite:** `bun run typecheck` termina com código 0 em instalação limpa.

### QA-001 — Implantar pirâmide inicial de testes

- **Prioridade:** P0
- **Escopo inicial:** autenticação, autorização/RLS, agenda, clientes, serviços, comandas/caixa e assinatura.
- **Entregáveis:** testes unitários de domínio, integração com banco local/staging e smoke E2E.
- **Aceite:** pipeline executa automaticamente e bloqueia merge em falha.

### DEV-001 — Criar pipeline de qualidade

- **Prioridade:** P1
- **Checks:** instalação limpa, typecheck, lint, testes, build Web e build Mobile de validação.
- **Aceite:** todos os checks são reproduzíveis e documentados.
- **Execução em 19/07/2026:** pipeline local reproduzível em `bun run quality`; 8 contratos aprovados, typechecks aprovados, lints sem erros, build Web aprovado e export Android aprovado (2.967 módulos). Workflows `.github/workflows/quality.yml` e `.github/workflows/production-qa.yml` validados como YAML.

### DB-001 — Consolidar schema e migrations

- **Prioridade:** P0
- **Ação:** transformar diferenças de `supabase-setup.sql` em migrations incrementais; inventariar tabelas usadas pelo código.
- **Aceite:** banco vazio é criado somente pelas migrations e suporta todos os testes.

### OBS-001 — Tratamento global de erros

- **Prioridade:** P1
- **Ação:** error boundary, logs estruturados, correlation ID, monitoramento de erros e mensagens acionáveis.
- **Aceite:** falhas críticas aparecem em painel sem expor PII ou secrets.

### Marco M1 — Base estável

- Mobile, Web e backend com typecheck verde;
- builds de validação verdes;
- migrations reproduzíveis;
- testes mínimos e pipeline ativos;
- zero P0 conhecido de segurança.

## 6. Fase 2 — Arquitetura e domínio central

### ARC-001 — Definir contratos de aplicação

- **Prioridade:** P0
- **Módulos:** identidade/tenant, agenda, clientes, catálogo, equipe/permissões, estoque, comandas/caixa, anamnese, assinatura e notificações.
- **Entregável:** schemas versionados de entrada/saída e matriz de autorização.
- **Aceite:** Mobile e Web usam o mesmo contrato por capacidade compartilhada.

### ARC-002 — Criar monólito modular backend

- **Prioridade:** P0
- **Ação:** organizar serviços de aplicação e repositórios; impedir UI de conhecer transições críticas do banco.
- **Aceite:** regras críticas são testáveis sem renderizar interface.

### AUTH-001 — Centralizar autorização

- **Prioridade:** P0
- **Ação:** modelar owner/admin/employee e permissões; aplicar tanto no serviço quanto na RLS.
- **Aceite:** esconder botão não é requisito de segurança; chamadas adulteradas também são negadas.

### DB-002 — Fortalecer modelo multi-tenant

- **Prioridade:** P0
- **Ação:** revisar `WITH CHECK`, multiunidade, constraints, cascatas e índices por `establishment_id`.
- **Aceite:** suíte RLS cobre owner, employee, admin e público para cada tabela.

### DOM-001 — Tornar agenda transacional

- **Prioridade:** P0
- **Ação:** detecção server-side de conflito, timezone explícito, idempotência e proteção contra concorrência.
- **Aceite:** duas reservas simultâneas não ocupam o mesmo recurso/horário indevidamente.

### DOM-002 — Tornar estoque, caixa e comandas transacionais

- **Prioridade:** P0
- **Ação:** garantir atomicidade, decimal monetário, auditoria e idempotência.
- **Aceite:** falha parcial nunca deixa estoque, comanda e financeiro inconsistentes.

### CODE-001 — Decompor arquivos gigantes

- **Prioridade:** P1
- **Ordem:** agenda Mobile, comandas Mobile, clientes Mobile, agenda Web, configurações e telas acima de 700 linhas.
- **Aceite:** UI, estado, validação e serviços separados; cobertura de regressão mantida.

### Marco M2 — Núcleo centralizado

- operações críticas usam application services comuns;
- RLS e autorização aprovadas;
- agenda/estoque/caixa resistentes à concorrência;
- não surgem novas regras duplicadas nos clientes.

## 7. Fase 3 — Assinaturas e monetização

### PROD-001 — Aprovar catálogo comercial oficial

- **Prioridade:** P0
- **Decisões:** planos, preços, trial, benefícios, limites, usuários/profissionais, cupons, upgrade/downgrade, cancelamento e grace period.
- **Aceite:** documento aprovado por Produto/Comercial e versão registrada no backend.

### SUB-001 — Criar domínio e schema de assinaturas

- **Prioridade:** P0
- **Tabelas:** subscriptions, plan_versions, entitlements, changes, invoices, payments, refunds, gateway mappings, coupons e webhook inbox.
- **Aceite:** matriz de transição coberta por testes.

### SUB-002 — Implementar entitlements canônicos

- **Prioridade:** P0
- **Endpoint:** retorna status, datas, plano, limites, uso e benefícios resolvidos.
- **Aceite:** nenhuma interface decide direito de acesso localmente.

### PAY-001 — Criar interface de gateways

- **Prioridade:** P0
- **Operações:** checkout, status, cancelamento, alteração, reembolso e webhook.
- **Aceite:** regra de negócio não importa SDK/tipos específicos do Mercado Pago.

### PAY-002 — Integrar Mercado Pago

- **Prioridade:** P0
- **Dependência:** conta/credenciais e PAY-001.
- **Escopo:** checkout, recorrência, webhook verificado, idempotência, approved/pending/rejected/cancelled/refunded e renovação.
- **Aceite:** matriz completa passa em sandbox; retorno do browser nunca libera plano sozinho.

### SUB-003 — Trial server-side

- **Prioridade:** P0
- **Ação:** trial único, datas server-side, expiração automática e avisos idempotentes.
- **Aceite:** limpar armazenamento ou alterar relógio local não cria/estende trial.

### SUB-004 — Sincronizar interfaces após pagamento

- **Prioridade:** P1
- **Ação:** realtime ou polling controlado, deep link de retorno e estados de confirmação.
- **Aceite:** plano é liberado automaticamente após webhook sem reiniciar o aplicativo.

### STORE-001 — Decidir billing Apple/Google

- **Prioridade:** P0
- **Responsáveis:** Produto/Jurídico/Mobile
- **Ação:** documentar classificação do serviço e política aplicável por loja/região; implementar IAP/Play Billing quando exigido.
- **Aceite:** parecer e fluxo aprovados antes do release.

### Marco M3 — Monetização operacional

- catálogo único em todas as superfícies;
- checkout e webhook reais;
- lifecycle completo testado;
- histórico financeiro canônico;
- nenhuma ativação local.

## 8. Fase 4 — Paridade, UX/UI e acessibilidade

### PAR-001 — Criar matriz de paridade

- **Prioridade:** P0
- **Colunas:** módulo, capacidade, contrato, permissão, Mobile, Web, teste e status.
- **Aceite:** 100% das capacidades críticas verdes antes do release.

### PAR-002 — Unificar regras e validações

- **Prioridade:** P0
- **Escopo:** agenda, clientes, serviços, equipe, caixa, comandas, estoque, relatórios, configurações e assinatura.
- **Aceite:** mesmos dados de entrada produzem mesmo resultado nas duas plataformas.

### UX-001 — Auditoria de jornadas críticas

- **Prioridade:** P1
- **Jornadas:** cadastro/onboarding, primeiro serviço, primeiro profissional, primeiro agendamento, atendimento/comanda, fechamento, assinatura e exclusão.
- **Método:** Nielsen + teste com usuários reais do segmento.
- **Aceite:** nenhum bloqueador de usabilidade; métricas de conclusão registradas.

### DS-001 — Consolidar Design System

- **Prioridade:** P1
- **Entregáveis:** tokens semânticos, componentes, estados, formulários, feedback, tipografia, espaçamento e documentação.
- **Aceite:** componentes críticos não mantêm variantes arbitrárias por tela.

### A11Y-001 — Acessibilidade Mobile

- **Prioridade:** P0/P1
- **Ação:** labels/roles/hints/state, alvos, ordem, texto escalável, TalkBack/VoiceOver, reduced motion e alternativas a gestos.
- **Aceite:** fluxos críticos concluídos por leitor de tela sem assistência.

### A11Y-002 — Acessibilidade Web

- **Prioridade:** P1
- **Ação:** semântica, teclado, foco/modal, ARIA somente quando necessário, contraste e mensagens de erro.
- **Aceite:** WCAG 2.2 AA nos fluxos críticos e auditoria automatizada sem violações sérias.

### Marco M4 — Experiência coerente

- matriz de paridade crítica 100%;
- catálogo e estados idênticos;
- jornadas críticas aprovadas;
- leitor de tela/teclado aprovados.

## 9. Fase 5 — Performance, escalabilidade e LGPD

### PERF-001 — Instrumentar performance

- **Prioridade:** P1
- **Métricas:** Web Vitals, API p50/p95/p99, Mobile cold start, renderização, memória, bateria e tamanho de bundle.
- **Aceite:** dashboard e budgets definidos.

### PERF-002 — Otimizar dados e interface

- **Prioridade:** P1
- **Ação:** paginação, virtualização, query keys, índices, cache, imagens e relatórios server-side.
- **Aceite:** metas documentadas atingidas no p75/p95.

### SCALE-001 — Testes de carga

- **Prioridade:** P1
- **Cenários:** login, agenda pública, dashboard, reservas concorrentes, notificações e webhooks.
- **Aceite:** volume-alvo de 1.000 empresas passa com margem e sem quebra de isolamento.

### SCALE-002 — Operação resiliente

- **Prioridade:** P1
- **Ação:** filas/retries, outbox, dead letter, pooling, backups/PITR, restauração e runbooks.
- **Aceite:** falhas simuladas recuperam sem duplicidade/perda.

### LGPD-001 — Inventário e governança

- **Prioridade:** P0/P1
- **Entregável:** dado, titular, finalidade, base legal, retenção, operador, compartilhamento, transferência e descarte.
- **Aceite:** Política de Privacidade reflete o comportamento real.

### LGPD-002 — Direitos dos titulares

- **Prioridade:** P0
- **Ação:** acesso, correção, exportação, revogação e exclusão/anonimização verificável.
- **Aceite:** solicitações têm autenticação, protocolo, prazo, auditoria e evidência de conclusão.

### LGPD-003 — Dados sensíveis e incidentes

- **Prioridade:** P0/P1
- **Escopo:** anamnese, fotos, documentos, segregação, retenção e resposta a incidentes.
- **Aceite:** revisão jurídica/técnica aprovada e exercício de incidente executado.

### Marco M5 — Produção controlada

- SLOs e alertas ativos;
- carga-alvo aprovada;
- backup/restauração testados;
- inventário e direitos LGPD operacionais.

## 10. Fase 6 — Preparação e publicação

### IOS-001 — Completar configuração Apple

- ícones, splash, permission strings, privacy manifest, push, Universal Links, signing e metadados;
- conta demo e instruções de review;
- testes iPhone/iPad e acessibilidade;
- exclusão e billing conformes.

### AND-001 — Completar configuração Google

- target API, AAB, signing, App Links, push e permissões mínimas;
- Data Safety, content rating e URL web de exclusão;
- testes Android/tablets, memória, bateria e acessibilidade;
- billing conforme decisão STORE-001.

### QA-002 — Regressão e beta fechado

- **Cenários obrigatórios:** autenticação, onboarding, agenda, cliente, serviço, equipe/permissão, comanda, caixa, estoque, anamnese, assinatura, offline/erro e exclusão.
- **Aceite:** zero P0/P1, crash-free ≥99,5% no beta e métricas dentro dos budgets.

### REL-001 — Release Candidate

- congelamento de escopo;
- migrations e rollback ensaiados;
- suporte e runbooks ativos;
- store assets e políticas aprovados;
- aprovação formal do checklist final.

### Marco M6 — Go-live

Publicar gradualmente, monitorar erros, conversão e suporte e manter possibilidade de rollback. O marco somente é liberado após assinatura de Tech Lead, Produto, QA e Privacidade.

## 11. Backlog pós-lançamento

| ID | Iniciativa | Prioridade inicial |
|---|---|---|
| GROW-001 | Analytics de ativação, retenção, conversão e churn | P1 |
| GROW-002 | Automação WhatsApp | P1 |
| GROW-003 | Comissões, pagamentos integrados e nota fiscal | P1/P2 |
| GROW-004 | Fidelidade, recorrência e campanhas | P2 |
| GROW-005 | IA com métricas de resultado e limites | P2 |
| SCALE-003 | Capacidade para 10 mil empresas | P2 |
| SCALE-004 | Estratégia para 100 mil empresas | P3 baseada em demanda |

## 12. Quadro resumido de dependências

```text
SEC-001/002/003 + MOB-001 + BE-001
              ↓
          Marco M0/M1
              ↓
ARC-001/002 + AUTH-001 + DB-002 + DOM-001/002
              ↓
          Marco M2
              ↓
PROD-001 → SUB-001/002 → PAY-001 → PAY-002 → SUB-004
              ↓
          Marco M3
              ↓
PAR-001/002 + UX + Design System + Acessibilidade
              ↓
          Marco M4
              ↓
Performance + Carga + Operação + LGPD
              ↓
          Marco M5
              ↓
Apple + Google + Regressão + Beta → Release Candidate
```

## 13. Definição de pronto para cada tarefa

Uma tarefa somente pode ser marcada como concluída quando:

- código e migration foram revisados;
- typecheck, lint, testes e build aplicáveis passam;
- critérios de aceite foram demonstrados;
- logs e mensagens não expõem PII/secrets;
- documentação/contrato foram atualizados;
- Mobile e Web foram avaliados quando a capacidade é compartilhada;
- não foi introduzido fallback mock em produção;
- existe evidência anexável: teste, captura, log sanitizado ou relatório.

## 14. Checklist de aprovação final

- [ ] Zero exposição pública de PII
- [ ] Zero P0/P1 aberto
- [ ] Mobile, Web e backend verdes
- [ ] Migrations reproduzíveis e restauração testada
- [ ] RLS/autorização cobertas por testes
- [ ] Paridade crítica 100%
- [ ] Monetização real e reconciliável
- [ ] Exclusão e direitos LGPD funcionais
- [ ] Acessibilidade crítica aprovada
- [ ] Performance e carga dentro dos SLOs
- [ ] Apple e Google sem pendências de configuração/política
- [ ] Beta fechado aprovado
- [ ] Suporte, monitoramento e rollback prontos

## 15. Primeira sequência prática

Para iniciar a execução sem dispersão:

1. **SEC-001** — revogar função administrativa pública;
2. **SEC-002** — retirar leitura pública de clientes;
3. **MOB-001** — corrigir os 17 erros Mobile;
4. **BE-001** — restaurar typecheck backend;
5. **DB-001** — consolidar migrations;
6. **QA-001** — testes de RLS e smoke flows;
7. **ARC-001/AUTH-001** — contratos e autorização;
8. **DOM-001/DOM-002** — transações críticas;
9. **PROD-001/SUB-001** — catálogo e domínio de assinatura;
10. seguir os marcos M2 a M6 sem pular gates.
