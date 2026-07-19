# Auditoria de Monetização, Assinaturas e Publicação — AppBello

**Data da auditoria:** 18/07/2026  
**Escopo:** código-fonte disponível em `mobile/`, `Portal-site/`, `backend/`, `supabase/` e `supabase-setup.sql`.  
**Método:** auditoria estática de código, esquema, rotas e configurações. Não houve acesso a ambiente de produção, painel Mercado Pago, App Store Connect, Play Console, métricas, logs reais nem testes físicos. Itens dependentes desses ambientes estão marcados como **não comprovados**.

## Resumo executivo

O AppBello **ainda não possui uma arquitetura real de assinaturas e pagamentos pronta para produção**. Há telas de trial, planos, bloqueio de recursos, avisos e administração, mas grande parte é protótipo de interface. A regra obrigatória de centralizar a lógica comercial no backend não é atendida.

Os achados mais graves são:

1. O Mobile mantém assinatura, preços, trial, cancelamento, upgrade e histórico no `AsyncStorage`/Zustand e consegue ativar um plano sem pagamento.
2. O Web App redefine planos, preços, benefícios, trial e desconto no cliente; o CTA abre WhatsApp, não um checkout.
3. Não existem módulo de domínio de assinaturas, adapter de gateway, integração Mercado Pago, webhooks, ledger de pagamentos ou histórico de alterações no backend.
4. O banco usa `establishments.subscription_plan` como campo solto, sem status completo, vigência, versionamento, proteção de transições ou trilha de auditoria.
5. Trial tem durações conflitantes: 30 dias no Mobile/Web, 14 dias nas configurações/rotinas de notificação e 30 dias na documentação administrativa.
6. A exclusão de conta exibida no Mobile e Web não executa exclusão nem registra solicitação no backend.
7. A configuração de publicação está incompleta, especialmente iOS, privacidade, compras digitais, metadados e validações de loja.

**Decisão de go-live:** **NÃO APROVADO** para cobrança real ou publicação nas lojas no estado auditado.

## Notas

| Área | Nota | Fundamentação resumida |
|---|---:|---|
| Arquitetura de monetização | **2,0/10** | Existem UI e consultas parciais, mas não existe domínio central, gateway nem processamento real. |
| Paridade Mobile × Web App | **4,0/10** | Os módulos principais existem nas duas plataformas, mas assinatura, preços, trial, benefícios e vários comportamentos não são equivalentes. |
| Preparação Apple App Store | **3,0/10** | Fluxos básicos existem, porém exclusão é fictícia, configuração iOS é mínima e a estratégia de pagamento pode causar rejeição. |
| Preparação Google Play | **3,5/10** | Há projeto Android gerado, mas billing, declarações, permissões, testes e política de pagamento não estão comprovados. |
| Estratégia geral de monetização | **2,5/10** | A proposta comercial é compreensível, mas há preços conflitantes e o funil termina em simulação/WhatsApp. |

## 1. Arquitetura atual

### Componentes encontrados

- **Banco/Supabase:** `establishments.subscription_plan`, `trial_started_at` e `referral_count`. Não foram encontradas tabelas funcionais de subscriptions, invoices, payments, payment events, plan changes, coupons ou gateway customers nas migrations aplicadas.
- **Mobile:** `subscription-store.ts` contém planos, preços, trial de 30 dias, ativação, expiração, cancelamento e vigência mensal. O estado é persistido localmente.
- **Mobile feature flags:** `use-plan-features.ts` consulta diretamente `establishments` e `plans` no Supabase. Em trial, libera tudo; durante carregamento também adota comportamento fail-open.
- **Web App:** consulta diretamente `subscription_plan`; contém outra lista local de planos, preços e benefícios; calcula trial e desconto no browser.
- **Backend:** contém health check, upload, IA e recuperação de senha. Não há módulo de assinatura/pagamento.
- **Site/Admin:** há landing page de preços, páginas legais e telas administrativas. Várias áreas administrativas são UI/proposta e não correspondem a APIs de domínio implementadas.

### Fontes de verdade concorrentes

| Informação | Mobile | Web App/Site | Backend/Banco | Resultado |
|---|---|---|---|---|
| Trial | 30 dias locais | 30 dias na assinatura | 14 dias em `app_settings`/notificações | Inconsistente |
| Starter | R$ 79/mês, até 2 profissionais | R$ 49/mês, até 5 profissionais | Plano configurável, sem endpoint público único | Inconsistente |
| Pro | R$ 149/mês, até 10 profissionais | R$ 99/mês, profissionais ilimitados | Não governa todas as interfaces | Inconsistente |
| Premium | R$ 249/mês no Mobile | Ausente no Web App | Não comprovado | Inconsistente |
| Status | Zustand local | `subscription_plan` direto | Campo simples no estabelecimento | Sem estado canônico |
| Pagamentos | Histórico gerado artificialmente | Métodos/histórico demonstrativos | Ausente | Fictício |

**Conclusão:** há forte acoplamento entre interface e regra comercial, classificado como **dívida técnica crítica (P0)**.

## 2. Fluxo do Trial

### Fluxo implementado

1. O banco define `trial_started_at DEFAULT NOW()` no estabelecimento.
2. O Mobile sincroniza apenas a data inicial e dias extras; se o estado local estiver `none`, também inicia trial localmente.
3. Mobile e Web calculam dias restantes no dispositivo/browser.
4. Rotinas Web/Netlify calculam avisos de 3 e 1 dia usando configuração que tende a 14 dias.
5. O Mobile redireciona ao paywall quando o cálculo local retorna zero.

### Validação

| Requisito | Estado | Evidência/risco |
|---|---|---|
| Ativação automática | Parcial | Default do banco existe, mas também ocorre localmente. |
| Início e fim corretos | Reprovado | Duração conflitante e cálculo dependente do relógio do cliente. |
| Avisos antes do fim | Parcial | Há rotinas para 3 e 1 dia, mas execução agendada, entrega e idempotência não foram comprovadas. |
| Dias restantes | Parcial | UI existe, mas há texto fixo `Comece em 1/set/2026` no Web App. |
| Conversão | Reprovado | Mobile simula; Web abre WhatsApp. |
| Encerramento automático | Reprovado | Não existe job/transição canônica no servidor; apenas redirecionamento local. |
| Múltiplos trials | Reprovado | Persistência local pode ser limpa; não há política/constraint de elegibilidade robusta por identidade/empresa. |

### Fluxo recomendado

O backend deve criar uma única assinatura `trialing` por empresa, com `trial_started_at` e `trial_ends_at` imutáveis, política explícita de elegibilidade e transição server-side para `expired`. Clientes recebem `days_remaining` já calculado pelo servidor; nunca calculam direitos a partir do relógio local.

## 3. Fluxo da Assinatura

### Estado atual

- Mobile: após atraso artificial de 1,5 s, chama `activateSubscription`, cria vencimento de um mês local e libera acesso.
- Upgrade/downgrade e cancelamento alteram apenas Zustand/AsyncStorage.
- Histórico Mobile é produzido em memória com três cobranças inventadas.
- Web App: `handleUpgrade` abre uma conversa com número placeholder no WhatsApp.
- Não há renovação, inadimplência, reativação, reembolso, prorrata ou histórico real.

### Cobertura dos requisitos

| Capacidade | Situação |
|---|---|
| Ativação | Simulada, insegura |
| Renovação automática | Ausente |
| Cancelamento ao fim do período | Apenas local; sem efeito financeiro |
| Upgrade/downgrade | Apenas local; sem prorrata ou cobrança |
| Expiração automática | Apenas cálculo local do trial |
| Suspensão por inadimplência | Ausente; só há string usada por notificações |
| Reativação | Ausente |
| Histórico de pagamentos | Fictício/ausente |
| Histórico de plano | Ausente |
| Cupons | UI/admin ou referral inseguro; sem validação transacional no servidor |
| Benefícios e limites | Parcial, consultados diretamente; sem enforcement central comprovado |

## 4. Fluxo Mercado Pago e arquitetura de gateways

### Resultado da auditoria

Não foi encontrada integração Mercado Pago operacional. São ausentes:

- credenciais e cliente server-side;
- criação de preferência/assinatura;
- customer e external reference;
- endpoint de webhook;
- validação de assinatura/origem;
- idempotência e deduplicação;
- consulta do evento à API do provedor;
- processamento de approved, rejected, pending, cancelled, refunded e renewal;
- reconciliação periódica;
- logs/auditoria e dead-letter/retry;
- sandbox e testes automatizados.

Logo, todos os itens Mercado Pago estão **reprovados ou não implementados**.

### Arquitetura-alvo desacoplada

```text
Mobile / Web App / Site
        |
        | GET /v1/entitlements
        | POST /v1/checkout-sessions
        v
Subscription Application Service
  ├── TrialPolicy
  ├── PlanCatalog
  ├── EntitlementService
  ├── SubscriptionLifecycle
  ├── CouponService
  └── BillingLedger
        |
        v
PaymentGateway (interface)
  ├── MercadoPagoAdapter
  ├── StripeAdapter
  ├── AppleAdapter
  └── GoogleAdapter
        |
        v
Webhook Inbox -> verificação -> idempotência -> eventos de domínio -> assinatura/benefícios
```

Interface mínima sugerida: `createCheckout`, `cancel`, `refund`, `changePlan`, `fetchSubscription` e `verifyWebhook`. Objetos do domínio não devem conter IDs ou status específicos do Mercado Pago.

### Modelo de dados mínimo

- `plans` e `plan_versions`;
- `plan_entitlements` e limites;
- `subscriptions` com status, período, trial e cancelamento;
- `subscription_changes`;
- `gateway_customers` e `gateway_subscriptions`;
- `payment_attempts`, `invoices`, `refunds`;
- `webhook_inbox` com chave única `(gateway, event_id)`;
- `coupons` e `coupon_redemptions` com constraints;
- `entitlement_snapshots` ou resolução server-side cacheável;
- `audit_log`.

As alterações devem ocorrer em transações e todas as tabelas multi-tenant devem carregar `establishment_id`, índices adequados e RLS defensiva. O cliente não pode atualizar campos de assinatura.

## 5. Fluxos por plataforma

### Mobile

**Pontos positivos:** telas de trial/paywall/billing; mensagens de fim de trial; feature gate; deep link básico; login, cadastro e recuperação de senha; links legais; push implementado parcialmente.

**Reprovações:**

- regras e catálogo comercial no bundle;
- assinatura mutável offline via AsyncStorage;
- pagamento simulado e liberação imediata;
- cancelamento/upgrade sem backend;
- histórico artificial;
- feature gate retorna permitido durante loading/erro e trial;
- proteção aparece concentrada em UI; não protege operações/dados no servidor;
- não há atualização pós-webhook/realtime/polling de uma fonte canônica;
- RevenueCat está nas dependências, mas não foi encontrada integração de compra/restore/entitlements no código-fonte auditado.

### Web App

Replica lógica, preços, desconto e cálculo de trial. A contratação por WhatsApp não atende ao fluxo requerido. Há consulta direta ao banco e ausência de um contrato único de entitlements. Métodos de pagamento e parte do histórico são demonstrativos.

### Site

Há landing page, seção de preços, Termos e Política de Privacidade. Há FAQs em páginas segmentadas e uma tela administrativa de conteúdo, mas não foi confirmada uma FAQ pública geral alimentada por backend. Não há página/rota de checkout Mercado Pago nem confirmação real. Preços do site divergem do Mobile.

### Página web de assinatura

Visualmente compara planos, benefícios e CTA e aparenta ser responsiva. Entretanto, segurança, checkout, confirmação e mensagens do gateway não existem. Exibir cartão `•••• 1234`, chave PIX e histórico demonstrativos como se fossem reais reduz confiança e pode induzir o usuário a erro.

## 5A. Paridade obrigatória entre Mobile e Web App

### Veredicto

**Paridade reprovada no estado atual — 4,0/10.** Há boa cobertura dos mesmos módulos de negócio, mas não há equivalência comercial nem uma única fonte de verdade. “Ter uma tela com o mesmo nome” não garante paridade: dados, regras, permissões, estados, mensagens e resultado das operações também precisam ser iguais.

### Matriz de paridade de monetização

| Requisito | Mobile | Web App | Paridade |
|---|---|---|---|
| Fonte do plano atual | Zustand local e consulta parcial ao Supabase | `establishments.subscription_plan` direto | **Não** |
| Trial | 30 dias calculados localmente | 30 dias calculados no browser | Parcial; backend/notificações usam 14 |
| Starter | R$ 79; até 2 profissionais | R$ 49; até 5 profissionais | **Não** |
| Pro | R$ 149; até 10 profissionais | R$ 99; profissionais ilimitados | **Não** |
| Premium | Disponível por R$ 249 | Não aparece | **Não** |
| Benefícios | Lista local + hook de features | Outra lista local + outro hook | **Não** |
| Assinar | Simula processamento e ativa localmente | Abre WhatsApp | **Não** |
| Upgrade/downgrade | Altera estado local | Sem ciclo financeiro equivalente | **Não** |
| Cancelamento | Limpa estado local | Fluxo real não comprovado | **Não** |
| Histórico financeiro | Registros gerados artificialmente | UI sem ledger canônico | **Não** |
| Cupom/indicação | Zustand/regra local | Metadata e alteração direta no Supabase | **Não** |
| Expiração/bloqueio | Redirecionamento local ao paywall | Bloqueio equivalente não comprovado | **Não** |
| Atualização após pagamento | Inexistente | Inexistente | Ambos ausentes, não operacional |
| Exclusão de conta | Mensagem e logout | Mensagem e logout | Visualmente semelhante, funcionalmente ausente |

### Paridade funcional dos módulos

Os dois clientes possuem cobertura nominal de agenda, clientes, serviços, equipe, financeiro, caixa, comandas, produtos, pedidos, relatórios, anamnese, link de agendamento, configurações, indicação e assistente. Porém, esta auditoria não considera essa cobertura como paridade comprovada porque:

- as implementações usam hooks/stores e fluxos separados;
- não há suíte de testes contratual executada contra Mobile e Web;
- estados de vazio, loading, erro, offline e permissão podem divergir;
- não foi demonstrado que toda mutação chega ao mesmo serviço backend;
- permissões e feature gates não possuem uma decisão server-side única;
- algumas capacidades são próprias do dispositivo, devendo ter equivalência de resultado, e não necessariamente interface idêntica.

### Definição obrigatória de paridade

Para cada funcionalidade compartilhada, Mobile e Web devem ter:

1. o mesmo endpoint ou application service;
2. o mesmo schema de entrada e saída;
3. as mesmas regras, limites, status e permissões;
4. os mesmos resultados para sucesso, erro e conflito;
5. atualização consistente depois de qualquer mutação;
6. testes de contrato e uma matriz de aceite comum.

A interface pode adaptar navegação e layout ao dispositivo. Paridade não exige telas visualmente idênticas; exige **mesma capacidade e mesmo resultado comercial**.

### Critério de aceite recomendado

Criar uma matriz rastreável por módulo com as colunas `capacidade`, `endpoint`, `permissão`, `Mobile`, `Web`, `teste` e `status`. A paridade só será aprovada quando todos os itens críticos estiverem verdes em ambas as plataformas e nenhuma regra comercial permanecer nos clientes.

## 6. Publicação Apple App Store

### Estado por requisito

| Item | Estado |
|---|---|
| Login/cadastro/recuperação | Implementados no código; teste real pendente |
| Exclusão de conta no app | **Reprovado:** apenas mensagem e logout |
| Privacidade/Termos | Páginas e links existem; revisão jurídica e disponibilidade pública pendentes |
| Consentimento LGPD | Aceite Web existe; trilha/versionamento e equivalência Mobile não comprovados |
| Erros/offline | Tratamento fragmentado; estratégia global/offline não comprovada |
| Permissões | Uso de câmera, fotos, contatos e push; descrições iOS/configuração não comprovadas |
| Deep links | Scheme e listener existem; Universal Links/Associated Domains não comprovados |
| Push | Código existe; credenciais, entitlement e entrega iOS não comprovados |
| Splash/ícones | Configuração explícita completa não encontrada em `app.json` |
| iPhone/iPad | `supportsTablet: true`, porém testes de layout não executados |
| Performance/estabilidade | Sem testes, crash reporting, métricas ou evidência de QA |

### Riscos de rejeição Apple

1. **Crítico:** venda/desbloqueio de funcionalidades digitais por checkout web/Mercado Pago dentro do app pode conflitar com as regras de In-App Purchase. A classificação do serviço e storefronts precisa ser decidida com revisão jurídica/política atual; se for conteúdo/feature digital consumido no app, implementar StoreKit/IAP. Não incluir CTA externo no binário sem validação da regra aplicável.
2. **Crítico:** exclusão iniciada no app não elimina a conta nem produz solicitação verificável.
3. **Alto:** sem ícones/splash/metadados/descrições de uso e privacy manifest comprovados.
4. **Alto:** `supportsTablet` amplia a matriz de revisão sem evidência de responsividade.
5. **Alto:** ausência de restore purchases e gestão de assinatura se IAP for adotado.
6. **Médio:** links de suporte/WhatsApp têm números placeholder.

## 7. Publicação Google Play

### Estado por requisito

- Projeto Android e package `com.appbello.app` existem.
- Orientação está fixada em portrait; suporte/responsividade em tablets não foi comprovado.
- Câmera, mídia, contatos e notificações exigem revisão de necessidade mínima, justificativas e Data Safety.
- Deep links customizados existem; App Links verificados não foram comprovados.
- Push está no código, mas configuração e entrega real não foram comprovadas.
- Performance, memória, bateria, ANR/crashes e testes de dispositivos não foram medidos.
- Política de Privacidade existe, mas URL de produção, Data Safety, retenção e exclusão precisam refletir o comportamento real.
- Não foram comprovados AAB assinado, target API exigida no momento do envio, Play App Signing, ficha da loja, content rating, acesso para revisão e trilhas de teste.

### Riscos de reprovação Google

1. **Crítico:** desbloqueio de funcionalidade digital por pagamento externo pode exigir Google Play Billing, conforme classificação e política vigente.
2. **Crítico:** exclusão declarada mas não executada, incluindo ausência de URL web funcional de exclusão comprovada.
3. **Alto:** declarações de Data Safety podem divergir do uso efetivo de contatos, câmera, fotos, notificações e dados de saúde/anamnese.
4. **Alto:** permissões e artefatos/metadados de release não auditáveis/completos.
5. **Médio:** ausência de evidência de testes em tablets, resoluções, memória e bateria.

## 8. Segurança e integridade comercial

- O proprietário possui política `FOR ALL` sobre `establishments`; como a assinatura vive nessa linha, é necessário impedir explicitamente que clientes alterem `subscription_plan`, datas ou status. RLS por linha não oferece segurança por coluna.
- A aplicação de indicação consulta slug e incrementa contador diretamente no browser, vulnerável a repetição, concorrência e abuso.
- O feature gate é fail-open no carregamento e não substitui autorização server-side.
- Confiar em preço/cupom/plano enviados pelo cliente permitiria adulteração; o backend deve resolver tudo por IDs/versionamentos server-side.
- Webhooks precisam ser a confirmação primária, nunca o retorno do navegador.
- Dados de anamnese elevam a sensibilidade do produto e exigem controles, retenção, auditoria e declarações de privacidade coerentes.

## 9. Escalabilidade

| Escala | Avaliação atual | Gargalo principal |
|---:|---|---|
| 100 empresas | Aplicação funcional pode operar, monetização não confiável | Processo manual/simulado e inconsistência de estado |
| 1.000 empresas | Não recomendada | Sem ledger, idempotência, reconciliação, observabilidade ou suporte operacional |
| 10.000 empresas | Não suportada de forma segura | Consultas diretas, jobs que varrem empresas, ausência de filas e índices/domínio maduros |
| 100.000 empresas | Não suportada | Arquitetura operacional, dados, pagamentos e SRE insuficientes |

Para escalar: webhook inbox durável, fila/retry, outbox, jobs paginados, índices por tenant/status/data, connection pooling, cache de entitlements, rate limiting, métricas de funil e pagamento, alertas, reconciliação, backups/PITR, testes de carga e runbooks. Não é necessário microserviço imediato: um **monólito modular** bem isolado é suficiente inicialmente.

## 10. Validação comercial

| Pergunta | Resposta |
|---|---|
| O produto é entendido rapidamente? | **Parcialmente.** Segmento e benefícios são visíveis, mas diferenças de catálogo prejudicam a compreensão. |
| Trial incentiva conversão? | **Parcialmente.** Há contagem e CTAs, porém duração conflitante e ausência de checkout quebram o funil. |
| Momento da assinatura é adequado? | A oferta durante e ao fim do trial faz sentido, mas o bloqueio deve preservar acesso a dados/faturamento e oferecer grace period controlado. |
| Planos estão claros? | **Não.** Preços, quantidades e número de planos divergem por plataforma. |
| Contratação gera confiança? | **Não.** WhatsApp, placeholders e dados de pagamento fictícios reduzem credibilidade. |
| Há atritos? | Sim: troca de canal, nenhuma confirmação real, status não sincronizado e mensagens inconsistentes. |

Recomenda-se um catálogo único, tabela comparativa simples, checkout hospedado seguro quando permitido, estados claros de pending/approved/rejected, retorno ao app por deep link e atualização automática pelo backend.

## 11. Riscos e plano priorizado

Estimativas consideram uma equipe familiarizada com TypeScript, Supabase e integrações de pagamento; não incluem tempo de aprovação das lojas ou jurídico.

| Prioridade | Melhoria | Esforço estimado | Critério de aceite |
|---|---|---:|---|
| P0 | Criar módulo backend de assinatura e entitlements | 2–4 semanas | Clientes só leem DTO canônico; transições e limites testados no servidor |
| P0 | Criar schema/ledger/migrations e bloquear mutação pelo cliente | 1–2 semanas | RLS e RPC/API impedem alteração comercial não autorizada; auditoria preservada |
| P0 | Remover ativação/cancelamento/histórico fictícios do Mobile/Web | 3–5 dias | Nenhuma UI libera plano sem resposta canônica do backend |
| P0 | Integrar Mercado Pago por adapter, checkout e webhook idempotente | 2–4 semanas | Todos os estados/reembolso/renovação testados em sandbox e reconciliados |
| P0 | Decidir estratégia Apple/Google Billing antes do release | 3–7 dias de análise + implementação | Parecer documentado por plataforma; fluxo compatível com política atual |
| P0 | Implementar exclusão real de conta | 3–7 dias | Solicitação autenticada, confirmação, prazo, anonimização/exclusão, auditoria e feedback |
| P1 | Unificar trial em 30 dias no servidor | 3–5 dias | Datas server-side, uma elegibilidade, expiração automática e avisos idempotentes |
| P1 | Unificar catálogo, preços, cupons e benefícios | 4–8 dias | Mobile/Web/Site exibem mesma versão retornada pela API |
| P1 | Sincronização pós-pagamento | 3–6 dias | Webhook atualiza; clientes recebem realtime/polling e liberam sem reiniciar |
| P1 | Implementar ciclo completo (upgrade, downgrade, cancelamento, grace, reativação, refund) | 2–3 semanas | Matriz de transições e prorrata coberta por testes |
| P1 | Corrigir autorização de benefícios no backend | 1–2 semanas | Operações protegidas mesmo com cliente adulterado/offline |
| P1 | Preparar configurações e privacidade iOS/Android | 1–2 semanas | Ícones, splash, permission strings, manifests, links, push e store declarations validados |
| P1 | QA de publicação e dispositivos | 1–2 semanas | Testes iPhone/iPad/Android/tablet, offline, crash, memória e acessibilidade aprovados |
| P2 | Observabilidade, reconciliação e runbooks | 1–2 semanas | Dashboards/alertas, replay seguro e reconciliação diária operacionais |
| P2 | Otimizar conversão e analytics | 1–2 semanas | Eventos de funil, abandono, conversão e experimentos sem duplicação |
| P2 | Testes de carga e capacidade | 1 semana inicial | SLO e resultados documentados para 1k/10k tenants; plano para 100k |

## 12. Sequência recomendada de execução

1. Congelar catálogo e remover qualquer liberação local/fictícia.
2. Definir política comercial única e estratégia de cobrança por plataforma.
3. Implementar schema e monólito modular de subscriptions/entitlements.
4. Proteger banco e operações com autorização server-side.
5. Integrar Mercado Pago via adapter e webhook idempotente.
6. Migrar Mobile, Web App e Site para os mesmos endpoints.
7. Implementar lifecycle, notificações, reconciliação e exclusão real.
8. Executar QA de pagamentos, segurança, carga e publicação.
9. Submeter primeiro a testes fechados; liberar gradualmente com métricas e rollback.

## 13. Veredicto final

O projeto demonstra intenção de produto e já possui boa parte da apresentação necessária, mas **as telas hoje representam capacidades que o backend não oferece**. Monetização não deve ser lançada até que a fonte de verdade seja transferida integralmente para o backend e o pagamento seja confirmado por eventos verificáveis e idempotentes.

A arquitetura recomendada preserva a exigência central: Mobile, Web App e Site apenas exibem catálogo e consultam entitlements; regras de trial, preços, cupons, limites, estados e gateways permanecem no domínio backend. Assim, Mercado Pago pode ser substituído ou coexistir com Stripe, Apple e Google sem reescrever as interfaces ou as regras comerciais.
