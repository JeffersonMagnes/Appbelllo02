# Instruções para o Claude — Agente B do AppBello

## Sua função

Você é o **Agente B**, responsável por paridade Mobile/Web, UX, Design System, acessibilidade, decomposição segura de telas, documentação LGPD e preparação das configurações das lojas.

O Codex é o **Agente A e validador final**. Ele trabalha simultaneamente em banco, RLS, backend, APIs, arquitetura, observabilidade, performance, escala e integrações. Suas entregas serão revisadas pelo Codex antes de entrar em `main` ou produção.

Leia antes de alterar código:

1. `PLANO_EXECUCAO_2_AGENTES.md`;
2. `PLANO_DESENVOLVIMENTO_APPBELLO.md`;
3. `AUDITORIA_GERAL_APPBELLO.md`;
4. `AUDITORIA_MONETIZACAO.md`;
5. qualquer `CLAUDE.md` ou `AGENTS.md` aplicável ao diretório trabalhado.

## Estado já concluído — não refazer

- SEC-001/002/003 e segurança de notificações;
- SEC-004 no código, sem publicar nova versão Mobile;
- AUTH-001 em produção com sessão HttpOnly e APIs de funcionário;
- DOM-001 em produção: agenda transacional, conflito, bloqueio, fuso e idempotência;
- DOM-002 em produção: comandas, estoque e fechamento financeiro atômicos;
- CI/CD GitHub → Netlify;
- domínio próprio configurado; HTTPS ainda pode depender da emissão do certificado;
- Mercado Pago não será integrado agora;
- aplicativo Mobile não será enviado às lojas agora.

Não reverta, duplique nem substitua essas implementações.

## Regras obrigatórias

### Isolamento obrigatório entre agentes

Codex e Claude trabalham simultaneamente no mesmo repositório. Uma simples troca de branch no mesmo diretório altera o workspace para os dois agentes. Por isso:

- o diretório `/Volumes/Documents/Appbello` é reservado ao Claude;
- o Claude deve permanecer na branch `agent-b/par-001-matriz-paridade` enquanto executa `PAR-001`;
- o Codex trabalha em outro Git worktree, atualmente `/private/tmp/appbello-codex-main`, na branch `main`;
- não execute `git switch main`, `git checkout main`, `git worktree add/remove`, `git reset` ou alteração forçada de branch;
- antes de editar, confirme `git branch --show-current`; se não começar com `agent-b/`, pare e avise;
- não faça merge em `main`; entregue apenas o hash do commit da sua branch;
- para uma nova tarefa, aguarde o Codex indicar se deve continuar na branch atual ou criar outra branch/worktree.

1. Trabalhe somente na branch própria já preparada. Para `PAR-001`, use `agent-b/par-001-matriz-paridade`; não a recrie e não troque para `main`.
2. Não sincronize ou faça merge de `origin/main` enquanto houver arquivos não commitados. Se uma atualização for necessária, peça primeiro a coordenação do Codex.
3. Não altere nem aplique:
   - `supabase/migrations/**`;
   - `Portal-site/app/api/**`;
   - `Portal-site/lib/server/**`;
   - segredos, `.env`, Netlify ou Supabase de produção;
   - workflows de deploy sem aprovação do Codex.
4. Não execute migrations, deploys, publicação Mobile, Mercado Pago ou alterações em produção.
5. Não crie regras de negócio locais diferentes entre Mobile e Web.
6. Não introduza mocks silenciosos, números comerciais inventados, pagamentos fictícios ou alegações sem comprovação.
7. Preserve mudanças existentes que não pertencem à sua tarefa.
8. Faça commits pequenos por ID de tarefa, por exemplo:
   ```text
   docs: add PAR-001 parity matrix
   refactor: split mobile appointments screen
   fix: improve keyboard accessibility on web dialogs
   ```
9. Ao concluir uma tarefa, pare e entregue evidências para revisão. Não misture várias tarefas grandes em um único diff.

## Ordem das suas tarefas

### 1. PAR-001 — matriz obrigatória de paridade

Crie `MATRIZ_PARIDADE_MOBILE_WEB.md` com uma linha para cada capacidade destes módulos:

- autenticação e recuperação;
- onboarding e configuração da empresa;
- dashboard;
- agenda e bloqueios;
- clientes;
- serviços e pacotes;
- equipe, papéis e permissões;
- produtos e estoque;
- comandas, caixa e transações;
- relatórios;
- anamnese e dados sensíveis;
- configurações;
- assinatura, trial e entitlements;
- notificações;
- link público, catálogo, pedidos e agendamento.

Colunas obrigatórias:

| Módulo | Capacidade | Contrato/regra | Permissão | Mobile | Web | Backend/RPC | Teste existente | Status | Gap | Prioridade |

Use somente evidência encontrada no código. Status permitidos: `paritário`, `parcial`, `ausente Mobile`, `ausente Web`, `divergente`, `não comprovado`.

Aceite:

- todas as capacidades compartilhadas inventariadas;
- cada conclusão aponta arquivos/funções que a sustentam;
- lista final de gaps P0/P1/P2;
- nenhum código funcional alterado nesta tarefa.

### 2. UX-001 — auditoria das jornadas críticas

Crie `AUDITORIA_JORNADAS_UX.md` avaliando:

- cadastro e onboarding;
- primeiro serviço;
- primeiro profissional;
- primeiro agendamento;
- atendimento e comanda;
- fechamento e caixa;
- assinatura sem gateway ativo;
- recuperação de acesso;
- exportação/exclusão de dados.

Para cada jornada registre:

- passos Mobile e Web;
- heurísticas de Nielsen afetadas;
- bloqueios, inconsistências e mensagens de erro;
- acessibilidade observável no código;
- severidade 0–4;
- correção recomendada;
- critério de aceite verificável.

Não declare “teste com usuário aprovado” sem teste real. Marque evidências humanas ainda necessárias como `não comprovado`.

### 3. CODE-001 — decomposição de arquivos gigantes

Execute em entregas separadas, nesta ordem:

1. `mobile/src/app/(tabs)/appointments.tsx`;
2. `mobile/src/app/admin/comandas.tsx`;
3. tela principal de clientes Mobile;
4. `Portal-site/app/dashboard/agenda/page.tsx`;
5. telas de configurações acima de 700 linhas.

Objetivo:

- extrair componentes visuais, modais, hooks de estado e utilitários;
- manter regras de banco/RPC intactas;
- não alterar comportamento, rotas, textos comerciais ou contratos;
- evitar componentes artificiais que apenas movem linhas sem criar responsabilidade clara.

Após cada arquivo:

- execute typecheck e lint do projeto afetado;
- informe tamanho antes/depois;
- liste componentes extraídos;
- registre qualquer comportamento que não pôde ser comprovado.

### 4. DS-001 — Design System

Primeiro faça inventário; depois proponha mudanças incrementais.

Entregáveis:

- `DESIGN_SYSTEM_APPBELLO.md`;
- mapa dos tokens atuais de cor, tipografia, espaçamento, raio e sombra;
- componentes equivalentes/divergentes em Mobile e Web;
- estados obrigatórios: default, hover/pressed, focus, disabled, loading, error, success e empty;
- plano de migração sem reescrever todas as telas de uma vez.

Pode corrigir componentes compartilhados somente depois de documentar impacto e executar regressão nas telas consumidoras.

### 5. A11Y-001 — acessibilidade Mobile

Priorize autenticação, onboarding, agenda, clientes, comandas e configurações.

Verifique e corrija:

- `accessibilityLabel`, role, hint e state;
- botões somente com ícone;
- alvos mínimos de toque;
- ordem de leitura e foco em modais;
- texto escalável sem corte crítico;
- alternativas para gestos;
- contraste e redução de movimento;
- mensagens de erro anunciáveis.

Não afirme aprovação de VoiceOver/TalkBack sem dispositivo. Diferencie `validação estática concluída` de `teste físico pendente`.

### 6. A11Y-002 — acessibilidade Web

Priorize login, cadastro, agenda, clientes, comandas e modais.

Verifique e corrija:

- navegação completa por teclado;
- foco visível e retorno de foco;
- foco preso corretamente em diálogos;
- labels de campos e mensagens associadas;
- semântica HTML antes de ARIA;
- contraste;
- landmarks e títulos;
- estados de loading/erro anunciáveis.

Execute auditoria automatizada disponível e registre limitações. Não declare WCAG 2.2 AA integral sem testes manuais.

### 7. PAR-002 — correção dos gaps de paridade

Somente comece após o Codex aprovar `PAR-001` e após os contratos `ARC-001/SUB-002` estarem disponíveis.

- trabalhe pela prioridade da matriz;
- uma capacidade por commit;
- interfaces devem consumir o mesmo backend/RPC;
- se a correção exigir nova regra, migration ou API, documente e devolva ao Codex em vez de implementar localmente.

### 8. LGPD-001 e LGPD-003 — documentação e interface

Crie:

- inventário de dados por tabela/campo funcional;
- titular, finalidade, base legal sugerida, retenção, compartilhamento e descarte;
- inventário específico de anamnese, fotos e documentos;
- gaps entre Política de Privacidade e comportamento real;
- fluxo visual esperado para solicitações e incidentes.

Não ofereça conclusão jurídica. Marque decisões que exigem advogado/DPO.

### 9. IOS-001 e AND-001 — somente preparação

Somente após autorização explícita e decisão STORE-001.

- auditar configuração, permissões, ícones, splash, deep/app links e manifests;
- preparar checklists e arquivos locais;
- não gerar release para distribuição;
- não enviar para App Store Connect ou Play Console.

## Comandos mínimos de validação

Execute conforme o escopo:

```bash
cd Portal-site
bun run typecheck
bun run lint
bun test tests/contracts

cd ../mobile
bun run typecheck
bun run lint
```

Para alterações amplas no Portal, execute também `npm run build`. Não trate warnings existentes como regressões novas; reporte a diferença antes/depois.

## Formato obrigatório de entrega ao Codex

Use este formato ao terminar cada tarefa:

```markdown
## Entrega: ID — título

Branch: agent-b/...
Commit: ...

### Resultado
- ...

### Arquivos alterados
- caminho — motivo

### Evidências
- comando — resultado

### Paridade Mobile/Web
- impacto em cada superfície

### Riscos e pendências
- ...

### Não alterado
- banco/migrations/APIs/produção
```

Não faça merge em `main`. Entregue a branch/commit ao Codex, que revisará o diff, executará os gates e decidirá a integração.

## Primeira solicitação para executar agora

Comece exclusivamente por `PAR-001`.

1. Confirme que já está na branch `agent-b/par-001-matriz-paridade`; não execute troca de branch.
2. Leia Mobile, Portal Web, backend, migrations e testes apenas para inventário.
3. Crie `MATRIZ_PARIDADE_MOBILE_WEB.md`.
4. Não altere código funcional.
5. Execute uma verificação de links/caminhos citados no documento.
6. Faça commit `docs: add PAR-001 mobile web parity matrix`.
7. Entregue o relatório no formato obrigatório e aguarde validação do Codex antes de iniciar `UX-001`.
