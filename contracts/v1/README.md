# Contrato de aplicação Appbello v1

Este diretório é a fonte canônica do vocabulário compartilhado entre Web, Mobile e servidor. A versão `1.x` aceita apenas mudanças retrocompatíveis; remoções, renomeações ou alterações semânticas exigem uma nova versão principal.

## Regras invariantes

- O contexto da empresa vem da sessão autenticada; o cliente nunca escolhe livremente `establishmentId` em operações privadas.
- Toda consulta privada é limitada à própria empresa. Acesso de funcionário também respeita atribuição e permissão.
- `anonymous` acessa somente catálogo público ativo e o fluxo transacional de agendamento.
- Preço final, estoque, trial, assinatura e benefícios são calculados ou confirmados no servidor.
- Agendamento e fechamento de comanda usam operações transacionais e idempotentes.
- Anamnese é dado sensível: acesso mínimo, rastreável e sem exposição em logs.
- Erros HTTP utilizam o envelope `ApiError`; listas novas utilizam `Page<T>`.

## Módulos e autoridade

| Módulo | Fonte de verdade | Escopo mínimo | Observação |
|---|---|---|---|
| identity | Supabase Auth + sessão assinada | usuário/empresa | PIN nunca retorna ao cliente |
| agenda | appointments + RPC transacional | empresa/funcionário | conflito decidido no banco |
| clients | clients | empresa | PII não é pública |
| catalog | services/products/packages | empresa ou público ativo | preço vem do servidor |
| team | employees/roles | empresa | gestão só owner/admin |
| inventory | products/stock movements | empresa | baixa atômica com venda |
| comandas | comandas/items/transactions | empresa/funcionário | total recalculado no servidor |
| anamnesis | templates/responses | empresa/atribuição | dado sensível auditável |
| subscriptions | subscriptions/entitlements | empresa | UI não concede acesso |
| notifications | notifications/outbox | empresa | processamento idempotente |

## Compatibilidade atual

As permissões legadas devem ser adaptadas na borda até a migração completa:

| Legada | Canônica |
|---|---|
| `viewAgenda` | `agenda.read` |
| `editAgenda` | `agenda.write` |
| `viewClients` | `clients.read` |
| `editClients` | `clients.write` |
| `viewFinancial` | `financial.read` |
| `viewReports` | `reports.read` |
| `viewProducts` | `inventory.read` |
| `viewComandas` | `comandas.read` |

Qualquer capacidade compartilhada nova deve primeiro entrar neste contrato, depois receber implementação e teste equivalentes no Web e Mobile. A matriz detalhada e executável está em `application-contract.ts`.
