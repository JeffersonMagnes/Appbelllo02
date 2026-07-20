# Auditoria de Jornadas Críticas — UX/UI (UX-001) — AppBello

**Data:** 20/07/2026
**Branch:** `agent-b/ux-001-auditoria-jornadas`
**Autor:** Agente B (Claude)
**Método:** leitura estática do código em `mobile/src` e `Portal-site`. **Nenhum teste com usuário real, dispositivo físico, leitor de tela (VoiceOver/TalkBack) ou navegação por teclado ao vivo foi executado.** Toda observação de acessibilidade é "validação estática" (presença/ausência de atributo no código), não "teste físico aprovado". Onde a conclusão dependeria de um teste humano, a linha está marcada `não comprovado`.
**Referência complementar:** `MATRIZ_PARIDADE_MOBILE_WEB.md` (PAR-001, aprovada pelo Codex) — os gaps de paridade citados lá que também afetam UX são referenciados aqui por módulo, sem repetir a evidência completa.

---

## Como ler esta auditoria

### Heurísticas de Nielsen (10, nomeadas por número para referência rápida)

1. Visibilidade do status do sistema
2. Correspondência entre o sistema e o mundo real
3. Controle e liberdade do usuário
4. Consistência e padrões
5. Prevenção de erros
6. Reconhecimento em vez de memorização
7. Flexibilidade e eficiência de uso
8. Estética e design minimalista
9. Ajudar o usuário a reconhecer, diagnosticar e se recuperar de erros
10. Ajuda e documentação

### Escala de severidade (Nielsen, 0–4)

- **0** — não é um problema de usabilidade.
- **1** — problema cosmético; corrigir se houver tempo sobrando.
- **2** — problema menor; baixa prioridade.
- **3** — problema importante; alta prioridade de correção.
- **4** — catástrofe de usabilidade; correção obrigatória antes do release.

A severidade atribuída a cada jornada reflete o **pior achado comprovado por código** dentro dela, não uma média.

### Nenhum código foi alterado nesta tarefa

Esta é uma auditoria de leitura. As "correções recomendadas" abaixo são para orientar `PAR-002`/`A11Y-001`/`A11Y-002`, não foram aplicadas aqui.

---

## Resumo executivo

| # | Jornada | Severidade | Achado dominante |
|---|---|:-:|---|
| 1 | Cadastro e onboarding | **3** | Duas etapas mortas (inalcançáveis) em cada plataforma; Mobile mostra tela de sucesso mesmo quando o cadastro do primeiro profissional falha silenciosamente no backend |
| 2 | Primeiro serviço | **3** | Mobile exibe dados fictícios (mock) como se fossem reais durante o carregamento; busca não-funcional sem nenhum indício visual |
| 3 | Primeiro profissional | **3** | Botão de upload de avatar no Web não é acessível por teclado; salvar com nome vazio falha silenciosamente no Web |
| 4 | Primeiro agendamento | **3** | Mobile não trava o botão de confirmar durante o envio — duplo toque pode criar agendamento duplicado |
| 5 | Atendimento e comanda | **4** | Erro ao adicionar item/criar comanda é só `console.log`/`console.error` nas duas plataformas — usuário não sabe se a ação funcionou |
| 6 | Fechamento e caixa | **4** | Mobile mostra "Pagamento registrado!" e recibo **antes/independente** da confirmação real do backend; caixa (abertura/sangria/fechamento) descarta erros sem nenhum log nas duas plataformas, sem trava contra duplo toque |
| 7 | Assinatura sem gateway ativo | **2** | Fluxo é um beco sem saída por definição, mas a mensagem é clara e honesta nas duas plataformas |
| 8 | Recuperação de acesso | **3** | Login de funcionário no Mobile não tem nenhum rate limit e vaza informação de enumeração de conta; Web não informa por quanto tempo o bloqueio dura |
| 9 | Exportação/exclusão de dados | **4** | As duas plataformas afirmam formalmente que a exclusão é "irreversível" e citada pela LGPD, mas não fazem nenhuma chamada real de backend — usuário recebe uma promessa legal falsa |

**Nenhuma das nove jornadas teve "teste com usuário real aprovado"** — todas as conclusões de acessibilidade e usabilidade vêm de leitura de código. Isso deve ser tratado como `não comprovado` até `A11Y-001`/`A11Y-002` executarem validação com leitor de tela/teclado físico.

---

## Jornada 1: Cadastro e onboarding

### Passos — Mobile
1. App abre em `/onboarding` (slideshow) se `!hasSeenOnboarding` (`mobile/src/app/_layout.tsx:284-294`); "Pular"/"Começar" sempre leva a `/login` (`onboarding/index.tsx:62-65`).
2. `login.tsx:106-108` "Criar conta" → `/register` (não `/onboarding/step-1`).
3. `register.tsx` — formulário único (nome/email/senha/confirmação), `handleRegister` (`:21-47`) chama `signUpOwner()`, sucesso → `router.replace('/(tabs)')` (`:38`).
4. Dentro de `(tabs)`, `SetupProgressBanner` (renderizado em `(tabs)/index.tsx:365`) oferece os passos reais de configuração: `/onboarding/step-2` (negócio) → `step-3` (endereço) → `step-4` (marca) → `step-5` (horários) → **pula para** `step-7` (profissional, `step-5.tsx:71-75`) → `step-8` (conclusão).
5. `step-7.tsx` insere o primeiro funcionário/serviços direto no Supabase (`:86-124`); sucesso → `step-8.tsx` tela "Tudo pronto!" (`:105-110`).

### Passos — Web
1. `login/page.tsx:132-137` "Criar conta grátis" → `/cadastro`.
2. Wizard único de 7 passos em `cadastro/page.tsx`: 1 conta+termos (`:182-215`) → 2 negócio (`:217-229`) → 3 endereço com CEP automático (`:231-239`) → 4 marca (`:241-260`) → 5 horários (`:262-275`) → **pula para** passo 7 (conclusão, `:315-357`), nunca exibindo o passo 6 (profissional).
3. "Ir para o Dashboard" → `/dashboard` (`:347`).

### Heurísticas de Nielsen afetadas
- **H1 (Visibilidade do status)** — violada: Mobile mostra "Tudo pronto!" mesmo quando o insert de profissional/serviços falhou (ver Bloqueios).
- **H4 (Consistência)** — violada: os dois wizards pulam uma etapa (Mobile pula step-6 "Metas e Taxas"; Web pula step-6 "Primeiro Profissional") mas por motivos e em pontos diferentes — a experiência de "quantos passos faltam" diverge entre plataformas para o mesmo conceito.
- **H5 (Prevenção de erros)** — violada: nenhuma das duas plataformas valida se o estabelecimento foi de fato criado (`estId` vazio) antes de prosseguir para os passos seguintes.
- **H9 (Recuperação de erros)** — violada: Mobile silencia o erro do insert do primeiro profissional (`step-7.tsx:116-118`, `catch (_) {}`); usuário não tem como saber que precisa recriar o profissional depois.

### Bloqueios, inconsistências e mensagens de erro
- **Mobile `onboarding/step-1.tsx` é código morto** — nenhuma rota real leva a ele; o checkbox de termos ali (`:175-218`) nunca é visto por um usuário de verdade. O cadastro real (`register.tsx`) não tem termos nem senha mínima.
- **Mobile `onboarding/step-6.tsx` é código morto** — não está em `SETUP_STEPS` (`setup-store.ts:15-56`) e `step-5.tsx:74` pula direto para `step-7`.
- **Mobile: falha silenciosa crítica** — `step-7.tsx:92-119`, se o insert de `employees`/`services` falhar, o `catch` está vazio com o comentário `// Salva localmente mesmo se Supabase falhar`; a tela de sucesso (`step-8.tsx`) aparece do mesmo jeito.
- **Web `handleStep6` é código morto** — validação e insert completos para o primeiro profissional (`cadastro/page.tsx:277-298`) existem mas nenhum JSX/rota jamais define `step===6`; `handleStep5` pula direto para `setStep(7)`.
- Mensagens de erro do Web são visíveis e consistentes (`cadastro/page.tsx:64` banner vermelho); mensagens do Mobile idem (`register.tsx:88-92`, `step-1.tsx:38-58`). Nenhuma das duas é silenciosa nos passos que de fato existem, exceto o item acima.

### Acessibilidade observável no código
- **Mobile**: zero `accessibilityLabel/Role/Hint/State` em todos os arquivos da jornada (grep exaustivo, confirmado). Elementos sem rótulo: toggle mostrar/ocultar senha, botões de voltar (ícone, 40×40pt — abaixo do alvo mínimo de 44pt), checkbox de termos (sem `accessibilityRole="checkbox"`/`accessibilityState`), cartões de tipo de negócio, swatches de cor, pills de dia de funcionamento.
- **Web**: passos 1–3 associam `<Label htmlFor>`/`<Input id>` corretamente; passos 4–5 perdem esse padrão (botões de cor/dia/duração sem `aria-pressed`). `login/page.tsx` não associa nenhum label a input (regressão em relação ao próprio `cadastro/page.tsx`). Botões de mostrar/ocultar senha sem `aria-label` nas duas telas. Swatches de cor 36×36px e pills 32–36px, abaixo do alvo mínimo de 44px.
- `não comprovado`: comportamento real com VoiceOver/TalkBack/NVDA e navegação por teclado.

### Severidade: **3**
Justificativa: não impede o cadastro básico (H1/H5/H9 falham, mas o "acidente" — primeiro profissional nunca criado — é silencioso e descoberto só depois, quando o dono percebe que não tem funcionário cadastrado). Não é catastrófico porque o dono ainda consegue completar o cadastro e usar o app.

### Correção recomendada
- Remover `onboarding/step-1.tsx` e `step-6.tsx` (Mobile) e `handleStep6`/passo 6 morto (Web), ou reconectá-los ao fluxo real — não deixar código morto que sugere uma capacidade inexistente.
- Mobile: tratar erro real no insert de `step-7.tsx` (mostrar alerta, não avançar silenciosamente para "sucesso").
- Unificar em qual etapa (se alguma) o primeiro profissional é criado durante o onboarding nas duas plataformas.
- Adicionar `accessibilityLabel`/`aria-label` nos controles icon-only listados acima; aumentar alvos de toque para ≥44pt/44px.

### Critério de aceite verificável
- Nenhuma rota do onboarding é código morto (toda tela declarada em `SETUP_STEPS`/`step` é alcançável por navegação real, verificável por grep de chamadas de rota).
- Uma falha no insert de profissional/serviços durante o onboarding produz uma mensagem visível ao usuário, não uma tela de sucesso.
- 100% dos botões icon-only da jornada têm `accessibilityLabel`/`aria-label` (grep verificável).

---

## Jornada 2: Primeiro serviço

### Passos — Mobile
1. `(tabs)/services.tsx:230-246` botão "+" abre modal de criação.
2. Preenche nome/descrição/preço/duração/categoria/foto (`:471-585`).
3. `handleAddService` (`:100-136`): sucesso → `Alert.alert('Serviço criado!', ...)` (`:128`); falha → `Alert.alert('Erro', e?.message || '...')` (`:134`).

### Passos — Web
1. `dashboard/servicos/page.tsx:190` "Novo serviço" → `openNewSvc` → modal (`:285-345`).
2. Preenche campos, clica "Salvar" → `handleSaveSvc` (`:82-107`).

### Heurísticas de Nielsen afetadas
- **H2 (Correspondência com o mundo real)** — violada no Mobile: a lista mostra `mockServices` (dados fictícios, "Corte Masculino" etc.) como se já existissem, para um estabelecimento genuinamente vazio.
- **H1 (Visibilidade do status)** — violada no Mobile: não há indicador de carregamento algum; dado fictício é indistinguível de dado real.
- **H5 (Prevenção de erros)** — violada no Web: `handleSaveSvc:83` `if (!name || !price || !duration) return;` sem nenhuma mensagem — o clique simplesmente não faz nada.
- **H6 (Reconhecimento)** — violada no Mobile: a busca (`services.tsx:286-292`) é um `Pressable` com placeholder "Buscar serviço..." **sem `onPress`** — parece funcional, não faz nada.

### Bloqueios, inconsistências e mensagens de erro
- **Mobile: dados fictícios exibidos como reais** — `const { data: services = mockServices } = useServices(...)` (`services.tsx:40`) descarta `isLoading`; durante o carregamento real (que para um estabelecimento novo retorna vazio), a tela mostra o array mock inteiro sem aviso.
- **Mobile: busca inoperante** — nenhum handler de toque no campo de busca.
- **Mobile: erro de fetch indistinguível de "vazio"** — `use-services.ts:22` `if (error || !data) return [];`.
- **Web: falha silenciosa de validação** — `handleSaveSvc:83`, sem mensagem nem `disabled` correspondente no botão.
- **Web: erro de insert/update descartado** — `await (supabase as any).from('services').insert(...)` (`:104`), resultado nunca checado.

### Acessibilidade observável no código
- **Mobile**: zero atributos de acessibilidade em `services.tsx` (grep confirmado). Botão "+" 44×44pt (adequado), mas botões de fechar modal 36×36pt (abaixo do mínimo). Chips de duração/categoria e itens de lista sem rótulo.
- **Web**: zero `htmlFor`/`id`/`aria-*` no arquivo inteiro (grep confirmado). Toggle Ativo/Inativo sem `aria-pressed`. Botão "Novo serviço" 40px de altura (abaixo de 44px).
- `não comprovado`: teste físico com leitor de tela.

### Severidade: **3**
Justificativa: dados fictícios apresentados como reais em um fluxo de "primeira vez" é enganoso e pode levar o dono a acreditar que o catálogo já está populado; busca inoperante prejudica eficiência (H7). Não chega a 4 porque não há perda de dados nem dinheiro envolvido diretamente.

### Correção recomendada
- Mobile: remover o fallback `mockServices` do estado exibido ao usuário real (usar `isLoading` para mostrar skeleton, e lista vazia real quando não há serviços) e implementar `onPress` na busca ou remover o campo.
- Web: adicionar mensagem visível na validação de campos obrigatórios e verificar `{ error }` do insert/update, mostrando feedback ao usuário.

### Critério de aceite verificável
- Um estabelecimento recém-criado nunca mostra `mockServices`/serviços fictícios na tela "Serviços" do Mobile.
- Toda tentativa de salvar serviço com campo obrigatório vazio produz uma mensagem visível no Web (não um no-op).
- Toda falha de insert/update de serviço é visível ao usuário em ambas as plataformas.

---

## Jornada 3: Primeiro profissional

### Passos — Mobile
1. `admin/employees.tsx:303-312` "+" → modal (`:474-683`).
2. Preenche nome (obrigatório)/email/telefone/papel/especialidade/comissão.
3. Botão "Criar" **desabilitado** enquanto `!name.trim() || saving` (`:667`) — protege contra o caso de nome vazio.
4. `handleCreateEmployee` (`:241-265`): falha → `Alert.alert('Erro', ...)` (`:261`).

### Passos — Web
1. `dashboard/equipe/page.tsx:156-158` "Novo funcionário" → modal (`:286-348`).
2. Preenche os mesmos campos + PIN.
3. Botão "Salvar" **não** é desabilitado por nome vazio (só por `saving`, `:342`).
4. `handleSave` (`:91-118`): `if (!form.name.trim()) return;` (`:92`) sem nenhuma mensagem.

### Heurísticas de Nielsen afetadas
- **H5 (Prevenção de erros)** — Mobile previne (botão desabilitado); Web não — divergência direta de comportamento para a mesma regra.
- **H9 (Recuperação de erros)** — Web: `handleSavePerms` (`:127-134`) não verifica o resultado do update — uma falha ao salvar permissões parece ter sucesso.
- **H3 (Controle e liberdade)** — Web: upload de avatar via `<div onClick>` (`:294-307`) não é focável por teclado — um usuário que navega só por teclado não consegue nem tentar essa ação.

### Bloqueios, inconsistências e mensagens de erro
- **Web: clique em "Salvar" com nome vazio não faz absolutamente nada** — sem mensagem, sem `required` no input, sem `disabled` correspondente (`equipe/page.tsx:92,342`).
- **Web: `handleSavePerms` não trata erro** — atualização otimista do estado local ocorre independentemente do resultado real do Supabase (`:127-134`).
- Mobile: fluxo mais robusto de todas as jornadas — loading, empty state, `Alert.alert` em todo caminho de erro (delete, edit, avatar).
- Bug cosmético Mobile: `'Nenhum funcionário ainda.\nAdicione o primeiro!'` (`employees.tsx:350`) — `\n` provavelmente não quebra linha em `Text` do React Native.

### Acessibilidade observável no código
- **Mobile**: zero atributos de acessibilidade (grep confirmado); botões de cabeçalho 40×40pt; botões de fechar modal 36×36pt; nenhum `accessibilityState={{expanded}}` nos itens expansíveis; `Switch` sem `accessibilityLabel` customizado.
- **Web**: zero `htmlFor`/`id`/`aria-*` (grep confirmado). **Gap real de teclado**: gatilhos de upload de avatar são `<div onClick>` sem `role="button"`/`tabIndex` — inacessíveis por teclado. Switches de permissão sem `role="switch"`/`aria-checked`. Botão "Novo funcionário" 40px; switches de permissão 20px de altura.
- `não comprovado`: teste físico.

### Severidade: **3**
Justificativa: a falha silenciosa de validação no Web e a total inacessibilidade por teclado do upload de avatar são problemas importantes de prevenção/recuperação de erro e de acesso — mas não bloqueiam o fluxo alternativo (o usuário pode preencher o nome corretamente, e pode pular o avatar).

### Correção recomendada
- Web: desabilitar "Salvar" (ou mostrar mensagem) quando `name` está vazio, replicando a proteção já existente no Mobile.
- Web: trocar `<div onClick>` do avatar por `<button type="button">` real, ou adicionar `role="button" tabIndex={0}` + handler de teclado.
- Web: verificar `{ error }` em `handleSavePerms` e mostrar feedback em caso de falha.
- Corrigir a quebra de linha do texto de estado vazio no Mobile.

### Critério de aceite verificável
- Tentar salvar funcionário sem nome produz feedback visível idêntico (mensagem ou bloqueio) nas duas plataformas.
- O upload de avatar no Web é operável via `Tab`+`Enter`/`Space` sem mouse.
- Uma falha de update de permissões no Web é visível ao usuário.

---

## Jornada 4: Primeiro agendamento

### Passos — Mobile
1. Toque em "Agendar" na agenda → `router.push('/booking')` (`(tabs)/appointments.tsx:553` e outros).
2. Wizard de 4 passos em `booking.tsx`: Serviço → Profissional → Data/Hora → Confirmar.
3. "Confirmar Agendamento" (`:677`) → `handleConfirm` (`:201-241`) → insert direto em `appointments` (sem RPC).
4. Sucesso → `/booking-success`; falha → `Alert.alert('Erro ao salvar', ...)` (`:236`).

### Passos — Web
1. "Novo" na agenda (`agenda/page.tsx:614`) → modal (`:778-858`).
2. Preenche cliente/serviço/profissional/data/hora.
3. "Agendar", **desabilitado** enquanto `savingApt || !service_id || !date || !time` (`:850`), com spinner.
4. `handleCreateApt` (`:324-355`): falha → `alert('Erro ao criar agendamento: ' + error.message)` (`:345`).

### Heurísticas de Nielsen afetadas
- **H5 (Prevenção de erros)** — violada no Mobile: o botão final não trava durante o envio (`createAppointment.isPending` nunca referenciado em `booking.tsx`), permitindo duplo toque.
- **H1 (Visibilidade do status)** — Mobile não mostra nenhum indicador de "enviando" no botão de confirmação (só na criação inline de cliente).
- Web cumpre H5/H1 corretamente neste fluxo (botão desabilitado + spinner).

### Bloqueios, inconsistências e mensagens de erro
- **Mobile: risco real de agendamento duplicado** — nenhuma trava de `isPending` no CTA final e nenhuma chave de idempotência no insert direto (diferente do agendamento público, que usa RPC idempotente).
- **Mobile: criação de cliente inline sem tratamento** — mensagens existem (`Alert.alert`), então não é silenciosa, mas soma-se ao volume de passos sem proteção de duplo envio.
- **Web: criação de cliente inline sem nenhuma mensagem de erro** (`handleCreateInlineClient`, `:309-321`) — erro é destruturado mas nunca checado.
- Mensagem de erro do agendamento em si é visível nas duas plataformas (`Alert.alert` no Mobile, `alert()` nativo no Web) — o Web usa `alert()` do navegador, inconsistente com o resto da UI baseada em componentes.

### Acessibilidade observável no código
- **Mobile**: zero atributos de acessibilidade em `booking.tsx` (grep confirmado). Círculos de progresso do wizard comunicam estado só por cor. Cartões de seleção (serviço/profissional/horário) sem `accessibilityState={{selected}}`.
- **Web**: zero `aria-*`/`role=`/foco programático em `agenda/page.tsx`. Modal sem `role="dialog"`/`aria-modal`, sem foco preso, sem retorno de foco ao fechar. `<Label>` sem `htmlFor` correspondente.
- `não comprovado`: teste físico.

### Severidade: **3**
Justificativa: o risco de agendamento duplicado no Mobile por ausência de trava de duplo toque é um problema de integridade de dado real, mas não catastrófico (o trigger de conflito no banco ainda impede sobreposição de horário — o duplo toque criaria no máximo uma tentativa rejeitada ou, se os horários forem levemente diferentes, um registro espúrio, não uma falha total).

### Correção recomendada
- Mobile: desabilitar o CTA "Confirmar Agendamento" durante `createAppointment.isPending` e mostrar spinner, replicando o padrão já usado no Web.
- Web: tratar e exibir erro de `handleCreateInlineClient`.
- Web: substituir `alert()` nativo por um componente de erro consistente com o resto da UI.
- Adicionar `role="dialog"`/`aria-modal`/foco preso ao modal de agendamento do Web.

### Critério de aceite verificável
- Duplo toque no botão de confirmar agendamento no Mobile não produz duas chamadas de mutação (verificável por teste de UI/mock).
- Toda falha de criação de cliente inline (Web) produz uma mensagem visível.

---

## Jornada 5: Atendimento e comanda

### Passos — Mobile
1. "+" → `NewComandaModal` → seleciona cliente → `handleCriarComanda` (`:1233-1249`) → insert direto em `comandas` (**sem** a RPC idempotente `create_comanda_with_items`).
2. "Adicionar" item → `AddItemModal` → `handleAddItem` (`:1295-1313`) → insert direto em `comanda_items`, quantidade **fixa em 1** (sem seletor de quantidade na UI).

### Passos — Web
1. "+ Nova" → modal → seleciona/cria cliente + itens → "Criar comanda" → `handleCreateComanda` (`:121-142`) → `rpc('create_comanda_with_items', {p_idempotency_key})`.
2. Itens só podem ser definidos na criação — **não existe** ação de adicionar item a uma comanda já aberta no Web (gap de paridade já registrado em PAR-001).

### Heurísticas de Nielsen afetadas
- **H1 (Visibilidade do status) — violação grave nas duas plataformas**: erro ao criar comanda/adicionar item é só `console.log`/`console.error`; o usuário não recebe nenhum sinal.
- **H9 (Recuperação de erros) — violação grave**: sem mensagem, o usuário não sabe que precisa tentar de novo, nem por quê falhou.
- **H5 (Prevenção de erros)** — Mobile: nenhuma trava (`isPending`) nos `Pressable`s de criar comanda/adicionar item — duplo toque é possível.

### Bloqueios, inconsistências e mensagens de erro
- **Mobile: erro ao adicionar item é 100% silencioso** — `console.log('[Comanda] Erro ao adicionar item:', e)` (`comandas.tsx:1311`), sem `Alert`, sem toast (apesar de `useToast` existir e ser usado em outro arquivo do próprio Mobile).
- **Web: erro ao criar comanda é 100% silencioso para o usuário** — `console.error('create comanda failed', error); setSaving(false); return;` (`comandas/page.tsx:134`) — modal permanece aberto, botão reabilita, nenhuma explicação.
- **Web: chave de idempotência não é limpa em caso de falha real** (`createKey.current` só zera no sucesso, `:135`) — novas tentativas após uma rejeição de regra de negócio (ex.: estoque insuficiente) reusam a mesma chave e continuarão falhando do mesmo jeito, sem o usuário nunca entender por quê.
- **Mobile bypassa a RPC atômica na criação** — abre comanda com insert direto, sem idempotência (gap já registrado em PAR-001, item P0 #6), reforçando aqui o impacto em UX: falha parcial (comanda criada, item não) é possível e silenciosa.

### Acessibilidade observável no código
- **Mobile**: zero atributos de acessibilidade nas 1617 linhas de `comandas.tsx` (grep confirmado). Seletor de forma de pagamento, botões de remover parcela (28×28px), botões de fechar modal (32–34px) — todos abaixo do alvo mínimo de 44pt, nenhum com `hitSlop`.
- **Web**: zero `aria-*`/`role=`/foco programático. Combobox de cliente sem `role="combobox"`/`aria-expanded`/lista `role="listbox"` — fecha por `onBlur`+`setTimeout`, um padrão hostil a teclado/AT. Modal sem `role="dialog"`.
- `não comprovado`: teste físico.

### Severidade: **4**
Justificativa: falha silenciosa em uma operação que mexe com estoque e comanda (dinheiro/inventário) é uma catástrofe de usabilidade — o funcionário não tem como saber se a ação realmente aconteceu, pode reportar ao cliente um item que não foi de fato lançado, e não há UI de log/histórico para auditar depois. Combinado com a ausência de trava de duplo toque no Mobile, o risco de estado inconsistente (comanda duplicada, item perdido) é real e comprovado por código.

### Correção recomendada
- Mostrar erro visível (toast/`Alert`) em toda falha de `create_comanda_with_items`/`close_comanda`/`addComandaItem` nas duas plataformas — nunca apenas `console.log`/`console.error`.
- Mobile: migrar criação de comanda para `create_comanda_with_items` (já usada no Web), eliminando o insert direto sem idempotência.
- Web: adicionar a capacidade de adicionar item a comanda já aberta (gap de paridade).
- Limpar a chave de idempotência também em caso de falha definitiva (não apenas sucesso), ou comunicar ao usuário que o retry usará a mesma chave.
- Adicionar trava de `isPending` nos `Pressable`s de criar comanda/adicionar item no Mobile.

### Critério de aceite verificável
- Uma falha simulada de `create_comanda_with_items`/`addComandaItem` produz uma mensagem visível ao usuário nas duas plataformas (verificável por teste de UI com mock de erro).
- Duplo toque em "criar comanda"/"adicionar item" no Mobile não produz duas mutações.

---

## Jornada 6: Fechamento e caixa

### Passos — Mobile (pagamento de comanda)
1. "Pagar" → `PaymentModal` → seleciona forma(s) de pagamento, preenche valor(es) → "Confirmar pagamento" habilitado só quando `remaining === 0` (`:144,478-481`).
2. `handleConfirm` **local ao modal** (`:168-190`) mostra tela de sucesso "Pagamento registrado!" **imediatamente**, antes de qualquer chamada de rede.
3. Só depois de 1300ms, `onConfirm` dispara `handleConfirmarPagamento` (pai, `:1256-1282`), que fecha o modal de pagamento e **então** chama `close_comanda` via RPC.
4. Erro do RPC: `console.log('[Comanda] Erro ao fechar pagamento:', e)` (`:1271-1273`) — **só log**.
5. 400ms depois, o `ReceiptModal` (recibo) abre **incondicionalmente**, sucesso ou falha do RPC.

### Passos — Mobile (caixa)
1. "Abrir Caixa"/"Fechar Caixa"/"Reforço"/"Sangria" → modais simples de valor.
2. `handleOpenRegister`/`handleCloseRegister`/`handleAddMovement` chamam `createTransaction.mutate(...)` — **`.mutate()`, não aguardado** — e **imediatamente**, sem esperar resposta, atualizam `registerStatus` e fecham o modal.
3. **Nenhum tratamento de erro existe** — nem `Alert`, nem `console.log` (confirmado: `useCreateTransaction` não tem `onError`, e não há `QueryCache`/`MutationCache` global no app).

### Passos — Web (pagamento de comanda)
1. "Cobrar agora" → modal de pagamento → "Confirmar" **desabilitado** enquanto `saving || payRemaining > 0.01` (`:468`), com spinner.
2. `handlePay` (`:180-199`) → `rpc('close_comanda', ...)`.
3. Erro: `console.error('close comanda failed', error); setSaving(false); return;` (`:192`) — **sem mensagem ao usuário**, mas ao menos **não** mostra recibo falso (retorna antes de montar `receiptData`).

### Passos — Web (caixa)
1. "Abrir Caixa"/"Fechar Caixa"/"Entrada"/"Sangria" → modais → `handleOpenRegister`/`handleCloseRegister`/`handleAddMovement`.
2. `await (...).from('transactions').insert({...})` — **o retorno `{ error }` nunca é sequer desestruturado** — nem log, nem mensagem.

### Heurísticas de Nielsen afetadas
- **H1 (Visibilidade do status) — violação catastrófica no Mobile**: a UI declara sucesso ("Pagamento registrado!") **antes** de saber se o backend confirmou. Isso é uma inversão do princípio "o sistema deve sempre manter o usuário informado sobre o que está acontecendo, através de feedback apropriado dentro de um tempo razoável" — aqui o feedback antecede o próprio evento.
- **H9 (Recuperação de erros) — violação catastrófica nas duas plataformas para o caixa**: nenhum caminho de erro existe para abrir/fechar caixa e lançar sangria/reforço.
- **H5 (Prevenção de erros)** — Mobile: nenhuma trava de duplo toque no fechamento de caixa (nem `isPending`, nem idempotência) — diferente do fechamento de comanda, que ao menos tem chave de idempotência no RPC.

### Bloqueios, inconsistências e mensagens de erro (achado mais grave da auditoria)
- **Mobile: tela de sucesso e recibo aparecem independentemente do resultado real do `close_comanda`.** Um funcionário pode entregar um recibo impresso/compartilhado de um pagamento que o servidor rejeitou (ex.: incompatibilidade de valores, falha de rede) — a comanda continuaria "aberta" na próxima atualização de lista, contradizendo o que acabou de ser mostrado.
- **Mobile: caixa não tem absolutamente nenhum tratamento de erro** — nem visual, nem log. Um "Fechar Caixa" que falha (ex.: RLS, rede) deixa a UI dizendo "Fechado" enquanto o banco nunca recebeu o registro; a próxima leitura real (`useEffect` que deriva `registerStatus` das transações, `:80-93`) pode reverter silenciosamente o estado, sem explicação ao usuário.
- **Mobile: duplo toque em "Confirmar Fechamento" pode criar múltiplos lançamentos de fechamento** — sem trava de `isPending`, sem idempotência (diferente de `close_comanda`, que tem).
- **Web: mesma ausência total de tratamento de erro no caixa** — pior que o Mobile nesse ponto específico, pois nem um `console.error` existe; o erro do Supabase é descartado silenciosamente.
- **Web: `close_comanda` também falha silenciosamente para o usuário** (só `console.error`), mas ao menos não finge sucesso — comportamento inconsistente com o Mobile na mesma operação.

### Acessibilidade observável no código
- **Mobile**: zero atributos de acessibilidade em `comandas.tsx` (`PaymentModal`) e `cash-register.tsx` (grep confirmado nas 679 linhas). Botões de forma de pagamento sem `accessibilityRole="radio"`/estado selecionado; nenhum CTA de caixa tem `accessibilityHint` avisando a consequência (ex.: "fecha o caixa do dia").
- **Web**: zero `aria-*`/`role=` em `caixa/page.tsx` e no modal de pagamento de `comandas/page.tsx`. Ícones de status (cadeado/carteira) puramente decorativos, sem `aria-live` avisando mudança de estado do caixa.
- `não comprovado`: teste físico.

### Severidade: **4**
Justificativa: esta é a jornada mais grave da auditoria. Falso-sucesso na UI (Mobile) e ausência total de tratamento de erro em operações financeiras (caixa, nas duas plataformas) são catástrofes de usabilidade com impacto financeiro direto — dinheiro pode ser considerado "fechado"/"recebido" pela equipe sem que o registro exista no backend, sem qualquer sinal de alerta.

### Correção recomendada — prioridade máxima
- Mobile: **não** mostrar "Pagamento registrado!"/abrir o recibo antes de confirmar que `close_comanda` retornou sucesso; se falhar, mostrar erro e manter a comanda como aberta na UI.
- Mobile e Web: adicionar tratamento de erro real (mensagem visível) em `handleOpenRegister`/`handleCloseRegister`/`handleAddMovement` — hoje nenhuma das duas plataformas informa o usuário de uma falha nessas três operações.
- Mobile: trocar `createTransaction.mutate()` (fire-and-forget) por `mutateAsync` aguardado, só atualizando `registerStatus`/fechando o modal após confirmação.
- Adicionar trava de `isPending` e, idealmente, chave de idempotência nas operações de caixa, hoje sem nenhuma proteção contra duplo envio.

### Critério de aceite verificável
- Uma falha simulada de `close_comanda` nunca resulta em tela de sucesso/recibo no Mobile (teste automatizado com mock de erro).
- Uma falha simulada de insert de `transactions` (abertura/fechamento/sangria/reforço) produz mensagem visível ao usuário nas duas plataformas.
- Duplo toque em "Confirmar Fechamento" (caixa) não produz dois lançamentos (teste automatizado).

---

## Jornada 7: Assinatura sem gateway ativo

### Passos — Mobile
1. Paywall/billing mostram planos; CTA já rotulado **"Pagamento em implantação"** (`paywall.tsx:683`).
2. Toque → `Alert.alert('Pagamento em implantação', 'Nenhuma assinatura foi ativada e nenhuma cobrança foi realizada...')` (`:122-127`).
3. "Mudar de plano"/"Cancelar assinatura" em `billing.tsx` também só mostram `Alert` equivalentes, sem ação real.

### Passos — Web
1. `dashboard/assinatura/page.tsx` mostra planos; CTA "Assinar {plano}" (rótulo normal, não avisa antes do clique).
2. Clique → `handleUpgrade` define `commercialNotice`, renderizado em banner `role="status"` **acima** dos cartões de plano (`:134,180-184`) — pode estar fora da área visível se os cartões estiverem abaixo da dobra.

### Heurísticas de Nielsen afetadas
- **H2 (Correspondência com o mundo real)** — cumprida: a mensagem é honesta e não promete algo que não existe.
- **H1 (Visibilidade do status)** — parcialmente violada no Web: o feedback do clique aparece em um banner que pode estar fora da viewport no momento do clique, sem `scrollIntoView`/foco programático levando o usuário até ele.
- **H10 (Ajuda e documentação)** — parcialmente violada: não há captura de interesse (lista de espera) nem link de contato direto perto do CTA no Mobile (o Web tem um e-mail de suporte no rodapé da página, `:333-335`).

### Bloqueios, inconsistências e mensagens de erro
- Beco sem saída **por definição do produto** (Mercado Pago não integrado agora, decisão documentada) — não é um bug, é um limite conhecido.
- Mensagens verbatim confirmadas idênticas em espírito nas duas plataformas: "nenhuma cobrança foi realizada", "em implantação".
- Seção de indicação/cupom no Web está morta por `{false && ...}` (`page.tsx:243`) — funcionalidade parcialmente construída e escondida, não removida.

### Acessibilidade observável no código
- **Mobile**: zero atributos de acessibilidade nos cartões de plano/CTA (grep confirmado).
- **Web**: `commercialNotice` usa `role="status"` corretamente (boa prática); mas sem mover o foco até o banner no clique. Botões de "Assinar" têm 44px de altura (adequado).
- `não comprovado`: teste físico.

### Severidade: **2**
Justificativa: é um bloqueio estrutural conhecido e comunicado com clareza; o único problema real de usabilidade é a posição do feedback no Web e a ausência de acessibilidade básica nos cartões, ambos corrigíveis sem redesenho.

### Correção recomendada
- Web: mover o foco (ou rolar a tela) até o banner de aviso comercial após o clique em "Assinar".
- Mobile/Web: adicionar `accessibilityRole`/`aria-*` nos cartões de plano.
- Decidir (Produto) se a seção de cupom/indicação escondida no Web deve ser removida ou reativada — não deixá-la como código morto indefinidamente.

### Critério de aceite verificável
- Ao clicar em "Assinar" no Web, o aviso comercial é visível na viewport sem rolagem manual adicional (verificável manualmente/por teste de UI).

---

## Jornada 8: Recuperação de acesso

### Passos — Mobile (senha)
1. `reset-password.tsx` → email → `handleReset` chama `resetPasswordForEmail` com deep link.
2. `new-password.tsx` aguarda evento `PASSWORD_RECOVERY` (timeout de 5s → "Link expirado", com botão "Solicitar novo link").
3. Nova senha (mín. 8) → sucesso.

### Passos — Mobile (PIN de funcionário)
1. `employee-login.tsx` → email do dono + PIN.
2. `handleLogin` faz 3 consultas sequenciais sem `supabase.auth`, **sem nenhum rate limit**.
3. Mensagens diferenciadas por etapa de falha (ver abaixo — vazamento de enumeração).

### Passos — Web (senha)
1. `recuperar-senha/page.tsx` → mesmo padrão, redirecionando por `/auth/callback`.
2. `nova-senha/page.tsx` — mesmo padrão de timeout/expirado/sucesso, com redirecionamento automático de 3s ao login.

### Passos — Web (PIN de funcionário)
1. `employee-login/page.tsx` → `POST /api/employee/session`.
2. Servidor aplica rate limit de **8 tentativas/15 min por IP** (`route.ts:9-17`) antes de qualquer consulta.
3. Toda falha (dono não encontrado, estabelecimento não encontrado, PIN errado) retorna a **mesma** mensagem genérica — sem enumeração.

### Heurísticas de Nielsen afetadas
- **H9 (Recuperação de erros)** — cumprida razoavelmente nas duas plataformas para o fluxo de senha (mensagens específicas, caminho de recuperação claro no link expirado).
- **H2/segurança** — violada no Mobile (PIN): mensagens diferentes para "estabelecimento não encontrado" vs. "PIN inválido" (`employee-login.tsx:69,83,99`) permitem a um atacante descobrir se um e-mail de dono existe, algo que o Web evita deliberadamente.
- **H1 (Visibilidade do status)** — violada no Web (PIN): ao ser bloqueado por rate limit, a mensagem "Muitas tentativas. Aguarde alguns minutos." não informa por quanto tempo, e o mesmo balão vermelho é usado tanto para "PIN errado" quanto para "bloqueado" — o usuário pode achar que só errou de novo e continuar tentando, prolongando a própria espera sem perceber.
- **H5 (Prevenção de erros)** — violada no Mobile (PIN): sem rate limit algum, nada impede tentativas ilimitadas.

### Bloqueios, inconsistências e mensagens de erro
- **Mobile PIN: zero rate limit, zero cooldown** — confirmado por leitura completa de `employee-login.tsx` (consultas diretas à tabela, sem qualquer contador/throttle). Contrasta diretamente com o limitador do Web.
- **Mobile PIN: vazamento de enumeração** — mensagens distintas por etapa de falha permitem inferir se um e-mail de dono é válido.
- **Web PIN: mensagem de bloqueio sem prazo e sem diferenciação visual do erro comum** — "Muitas tentativas. Aguarde alguns minutos." (`route.ts:49`) vs. "E-mail ou PIN inválido." (`route.ts:73,80,89`) aparecem no mesmo componente de erro, sem nenhuma pista adicional (ex.: contagem regressiva).
- Nenhuma das duas plataformas oferece um caminho de "esqueci meu PIN" — a única saída é "Sou gestor/dono" (Mobile) ou nada (Web), delegando implicitamente ao dono resolver fora do app.
- Mensagens de senha (reset/nova senha) são claras e consistentes nas duas plataformas, com um caminho de recuperação real para link expirado.

### Acessibilidade observável no código
- **Mobile**: zero atributos de acessibilidade em `reset-password.tsx`, `new-password.tsx`, `employee-login.tsx` (grep confirmado). Banners de erro sem `accessibilityRole="alert"`/`accessibilityLiveRegion` — leitor de tela não é avisado automaticamente. Toggle de mostrar/ocultar senha sem rótulo.
- **Web**: banners de erro sem `role="alert"`. `<Label>` sem `htmlFor` correspondente em `recuperar-senha`/`nova-senha`/`employee-login`. Botões usam `focus-visible:ring-2` (indicador de foco por teclado presente — ponto positivo ausente no Mobile por natureza da plataforma). Emoji `⚠️` no banner de erro do login de funcionário sem `aria-hidden="true"`.
- `não comprovado`: teste físico, incluindo o comportamento real do limitador de tentativas sob carga.

### Severidade: **3**
Justificativa: a ausência total de rate limit e o vazamento de enumeração no login de funcionário do Mobile são um problema de segurança com impacto direto em usabilidade/confiança (facilita ataques de força bruta e reconhecimento de contas), mas não impede o uso legítimo do produto.

### Correção recomendada
- Mobile: aplicar rate limit equivalente ao do Web no login de PIN (idealmente movendo o fluxo para o mesmo endpoint server-side já usado pelo Web, eliminando a duplicação de lógica).
- Mobile: unificar a mensagem de erro do PIN para não diferenciar "estabelecimento não encontrado" de "PIN inválido".
- Web: mostrar tempo restante estimado no bloqueio de rate limit e diferenciar visualmente "PIN errado" de "bloqueado temporariamente".
- Adicionar `role="alert"`/`accessibilityRole="alert"` nos banners de erro das duas plataformas.

### Critério de aceite verificável
- Login de PIN no Mobile passa a ser bloqueado após N tentativas na mesma janela de tempo usada pelo Web (verificável por teste automatizado).
- Mensagens de erro de PIN no Mobile não diferem entre "conta não encontrada" e "PIN errado" (verificável por leitura de código/teste).

---

## Jornada 9: Exportação/exclusão de dados (LGPD)

### Passos — Mobile
1. `profile.tsx` → "Excluir Conta" (`:504-506`) → `ConfirmModal` com aviso "Esta ação não pode ser desfeita" (`:768-772`).
2. Confirma → modal fecha, toast de sucesso "Sua solicitação de exclusão foi enviada. Seus dados serão removidos em até 30 dias conforme a LGPD." (`:775`), 3s depois logout automático.
3. **Nenhuma chamada de backend existe neste handler** — a conta permanece intacta.
4. Não existe nenhuma opção de **exportação** de dados no Mobile.

### Passos — Web
1. `configuracoes/page.tsx` → "Zona de Perigo" → "Excluir minha conta" → modal com título "Esta ação é irreversível" e texto citando a LGPD e prazo de 30 dias (`:713-716`).
2. Confirma → `setDeletingAccount(true)` → **sem nenhuma chamada de rede** (comentário no código: `// Mark account for deletion — actual deletion handled server-side`, mas nada é chamado) → `setDeleteSuccess(true)`.
3. Tela de sucesso; único botão é "Sair da conta" (logout).
4. Também não existe opção de exportação de dados no Web.

### Heurísticas de Nielsen afetadas
- **H2 (Correspondência com o mundo real) — violação catastrófica nas duas plataformas**: o texto afirma formalmente uma ação legal, irreversível e referenciada à LGPD, que **não ocorre**. Isso não é apenas um problema de usabilidade — é uma alegação factualmente falsa ao usuário sobre o exercício de um direito legal.
- **H9 (Recuperação de erros)** — inaplicável/inversa: não há erro possível porque não há operação real; a "falha" está em relatar sucesso indevidamente.
- **H3 (Controle e liberdade)** — a ausência de qualquer capacidade de exportação de dados nas duas plataformas viola o direito de portabilidade que a própria mensagem de exclusão invoca.

### Bloqueios, inconsistências e mensagens de erro
- **As duas plataformas prometem exclusão real "em até 30 dias conforme a LGPD" e não iniciam processo algum.** Isso é o achado de maior risco legal/reputacional de toda a auditoria — mais grave que um bug de UX comum, pois constitui uma comunicação formal ao titular de dados sobre o exercício de um direito que não é honrada.
- **Confirmação de exclusão é de apenas dois toques/cliques** (abrir modal + confirmar) para uma ação apresentada como irreversível — nem Mobile nem Web pedem confirmação adicional (senha, frase digitada), o que é inconsistente com a gravidade declarada da ação (ainda que, na prática, nada aconteça).
- **Nenhuma exportação de dados existe em nenhuma das duas plataformas** — metade do escopo LGPD desta jornada (exportação) está completamente ausente, não apenas malfeita.
- Web tem tratamento de erro melhor estruturado (spinner "Processando...", `catch` vazio com comentário `// Handle silently`) mas isso só reforça que mesmo uma falha real seria escondida do usuário.

### Acessibilidade observável no código
- **Mobile**: `MenuItem` de exclusão é `Pressable` sem `accessibilityRole`/`accessibilityLabel` — o único sinal de que é uma ação destrutiva é a cor (visual apenas). `ConfirmModal` sem `accessibilityViewIsModal`/rótulos explícitos nos botões. Toast sem `accessibilityLiveRegion`/`role="alert"` e desaparece em 2500ms — um usuário de leitor de tela pode não ser avisado a tempo.
- **Web**: modal é um `<div>` sem `role="dialog"`/`role="alertdialog"`, sem `aria-modal`, **sem foco preso e sem gerenciamento de foco inicial** — usuário de teclado pode tabular para fora do modal enquanto ele está visualmente bloqueando a tela. Sem `Escape` para fechar. Botão de abrir o fluxo tem 40px de altura (abaixo do mínimo recomendado para uma ação destrutiva, que idealmente deveria ser mais difícil de acionar por engano, não mais fácil).
- `não comprovado`: teste físico com leitor de tela e teclado.

### Severidade: **4**
Justificativa: catástrofe de usabilidade e de confiança — o sistema faz uma declaração legal formal e específica (prazo de 30 dias, base na LGPD) sobre uma ação que não executa de forma alguma, nas duas plataformas. Isso é agravado pela ausência total de exportação de dados. Este é o achado de maior risco não-técnico de toda a auditoria e bloqueia diretamente `LGPD-002`.

### Correção recomendada
- **Prioridade imediata**: até que a exclusão real exista no backend, alterar a cópia para não afirmar um prazo legal específico nem "irreversível" — ex.: "Envie sua solicitação; nossa equipe entrará em contato para confirmar o processo de exclusão" — evitando a alegação factualmente falsa enquanto o backend não existe.
- Implementar (fora do escopo desta tarefa, cabe a `LGPD-002`) um endpoint real de solicitação de exclusão/exportação com protocolo, prazo e trilha de auditoria.
- Adicionar `role="dialog"`/`aria-modal`/foco preso/`Escape` ao modal de exclusão do Web; `accessibilityViewIsModal` no Mobile.
- Adicionar confirmação de segundo fator (ex.: digitar "EXCLUIR") proporcional à gravidade comunicada, uma vez que a exclusão real seja implementada.

### Critério de aceite verificável
- Nenhuma tela do produto afirma um prazo legal de exclusão específico sem que exista uma chamada de backend correspondente (verificável por grep/revisão de código a cada release até `LGPD-002` ser entregue).
- Após `LGPD-002`, uma solicitação de exclusão real é rastreável por protocolo consultável pelo usuário.

---

## Consolidação — o que ainda exige teste humano (`não comprovado`)

Todas as observações de acessibilidade nesta auditoria vêm de leitura estática de código (presença/ausência de atributo). Nenhuma das afirmações abaixo foi verificada com um teste físico e **não deve ser tratada como aprovação**:

- Comportamento real com VoiceOver (iOS) e TalkBack (Android) em qualquer uma das 9 jornadas.
- Navegação completa por teclado e ordem de foco real no Web (a ausência de `role="dialog"`/foco preso foi confirmada por código; o comportamento resultante em leitor de tela real não foi).
- Escalonamento de texto (Dynamic Type/tamanho de fonte do sistema) em nenhuma tela.
- Contraste de cor medido (nenhuma ferramenta de contraste foi executada; apenas ausência/presença de classes Tailwind foi observada).
- Comportamento do rate limit de login de funcionário do Web sob concorrência real (a lógica é `Map` em memória por instância de servidor, o que pode se comportar de forma diferente em produção serverless/multi-instância — sinalizado como risco de infraestrutura, não testado).
- Qualquer alegação de "teste de usabilidade com usuário real aprovado" — **nenhum foi realizado**. Todas as severidades desta auditoria são estimativas baseadas em heurísticas de especialista (Nielsen), não em dados de usuário.

## Verificação de caminhos citados

Todos os caminhos de arquivo citados neste documento foram conferidos com `test -e` contra o estado atual do working tree em `agent-b/ux-001-auditoria-jornadas`. Nenhum caminho quebrado encontrado.

## Aceite desta entrega (UX-001)

- [x] Nove jornadas do escopo avaliadas com passos Mobile e Web, heurísticas de Nielsen, bloqueios/inconsistências/mensagens de erro, acessibilidade observável no código, severidade 0–4, correção recomendada e critério de aceite verificável.
- [x] Nenhuma afirmação de "teste com usuário aprovado" foi feita; evidências humanas pendentes estão listadas explicitamente.
- [x] Nenhum código funcional foi alterado nesta tarefa — apenas este documento foi criado.
