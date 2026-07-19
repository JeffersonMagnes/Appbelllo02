# Auditoria Geral do Produto — AppBello

**Data:** 18/07/2026  
**Escopo:** Mobile, Web App, Site, Portal Administrativo, backend e Supabase.  
**Complemento especializado:** consultar também `AUDITORIA_MONETIZACAO.md`.  
**Método:** revisão estática do repositório, inventário funcional, inspeção de banco/configurações e execução dos typechecks disponíveis. Não houve acesso ao Supabase de produção, consoles das lojas, Mercado Pago, analytics, dispositivos físicos ou teste de carga. Afirmações comerciais externas foram verificadas em páginas públicas na data acima.

## 1. Identidade do projeto

O AppBello é um SaaS multiempresa para negócios de beleza e bem-estar — salões, barbearias, clínicas de estética e studios. A proposta combina agenda, clientes, equipe, serviços, produtos/estoque, comandas, caixa/financeiro, relatórios, anamnese, agendamento público, comunicação e assistência por IA.

Há três superfícies principais:

- **Mobile:** Expo/React Native, voltado à operação cotidiana e administração;
- **Web App/Site:** Next.js, contendo landing page, dashboard, páginas públicas e portal administrativo;
- **Backend/dados:** Supabase é o backend predominante; o serviço Hono é pequeno e usado para IA, upload e recuperação de senha.

## 2. Objetivos e critérios da auditoria

Esta auditoria verifica:

1. funcionamento estrutural e coerência das três superfícies;
2. paridade de capacidade e resultado entre Mobile e Web;
3. qualidade de UX/UI, acessibilidade e Design System;
4. arquitetura, dados, autenticação, RLS e segurança;
5. qualidade de código, testes, performance e escalabilidade;
6. regras operacionais e comerciais do SaaS;
7. preparação Apple, Google e LGPD;
8. posição competitiva, riscos, roadmap e critérios objetivos de aprovação.

**Regra de avaliação:** uma tela pronta não equivale a funcionalidade pronta. Para aprovação, a operação precisa persistir corretamente, respeitar autorização, tratar erro/concorrência e produzir o mesmo resultado nas plataformas aplicáveis.

## 3. Resumo executivo

O AppBello tem **ampla cobertura visual e funcional**, com produto mais avançado na interface do que no núcleo operacional. A base demonstra boa visão de mercado e já cobre grande parte da jornada de um estabelecimento. Entretanto, o produto não está pronto para publicação ampla ou operação comercial crítica devido a segurança no banco, ausência de testes, erros no Mobile, dados simulados, paridade incompleta, acessibilidade muito baixa e regras distribuídas nos clientes.

### Notas gerais

| Dimensão | Nota |
|---|---:|
| Cobertura funcional | **7,0/10** |
| UX/UI visual | **6,5/10** |
| Acessibilidade | **2,0/10** |
| Paridade Mobile × Web | **5,0/10** geral; **4,0/10** em monetização |
| Arquitetura | **4,0/10** |
| Supabase e segurança de dados | **3,0/10** |
| Qualidade/manutenibilidade do código | **4,5/10** |
| Performance comprovada | **3,5/10** |
| Escalabilidade comprovada | **3,5/10** |
| Validação comercial SaaS | **6,0/10** |
| LGPD | **3,5/10** |
| Preparação Apple | **3,0/10** |
| Preparação Google | **3,5/10** |
| **Nota geral atual** | **4,4/10** |

Essa nota é de **prontidão verificável**, não de potencial. O potencial do produto, após correções P0/P1, é significativamente maior.

### Decisão

- **Uso interno/demo controlada:** aprovado com ressalvas.
- **Beta fechado com dados não sensíveis:** aprovado somente após corrigir os P0 de segurança e build.
- **Produção com clientes pagantes/dados reais:** não aprovado.
- **Submissão às lojas:** não aprovada no estado atual.

## 4. Inventário e auditoria do Mobile

Foram encontrados 125 arquivos TypeScript/TSX em `mobile/src`, com cerca de 50 rotas. O aplicativo cobre dashboard, agenda, serviços/pacotes, clientes, equipe, financeiro, caixa, comandas, produtos, pedidos, relatórios, anamnese, configurações, onboarding, agendamento público, autenticação, assinatura e IA.

### Pontos fortes

- cobertura funcional ampla e coerente com o segmento;
- navegação baseada em Expo Router e estado remoto parcialmente organizado em React Query;
- experiência visual rica, feedback háptico, skeletons e componentes reutilizáveis;
- fluxos de login, cadastro, recuperação e onboarding;
- links públicos, deep link básico, notificações e uso de recursos nativos;
- RLS no Supabase oferece uma camada inicial de isolamento por empresa.

### Problemas comprovados

- `bun run typecheck` falha com **17 erros**, incluindo `ErrorUtils`, tipo `never` em anamnese e parâmetro nulo em produtos;
- não há testes automatizados reais encontrados;
- existem fallbacks para mock quando Supabase/tenant não está disponível, o que pode ocultar falha de configuração;
- login de profissional possui modo demo/simulado;
- assinatura, cobrança e parte do histórico são locais/simulados;
- arquivos excessivamente grandes: agenda com 1.966 linhas, comandas com 1.613, clientes com 1.271 e vários acima de 700;
- não foi encontrada instrumentação de crash/erro em produção;
- exclusão de conta apenas mostra sucesso e encerra sessão.

### Resultado Mobile

**Não aprovado para release.** Primeiro corrigir compilação, segurança, dados simulados, acessibilidade, exclusão e fluxos críticos.

## 5. Auditoria do Web App

Foram encontrados 159 arquivos TypeScript/TSX entre app, componentes e bibliotecas. O dashboard cobre os principais módulos do Mobile e o typecheck passa.

### Pontos fortes

- boa amplitude de módulos e páginas públicas;
- middleware protege dashboard e consulta tabela de administradores para a área admin;
- rotas server-side existem para entidades centrais;
- páginas legais, cadastro com aceite, landing segmentada e agendamento público;
- componentes Radix e Tailwind oferecem uma base melhor para acessibilidade que componentes totalmente artesanais.

### Problemas

- versão antiga do Next.js 13.5.1 e dependências desatualizadas devem passar por atualização controlada;
- grande volume de acesso direto ao Supabase, fragmentando regras entre páginas, hooks, API routes e Mobile;
- telas grandes: agenda com 1.255 linhas e páginas públicas/configurações acima de 790;
- dados demonstrativos aparecem como notificações, pagamento e conteúdo administrativo;
- exclusão de conta não executa operação real;
- contratação por WhatsApp e catálogo comercial divergente;
- ausência de testes unitários, integração e E2E;
- não foi comprovada proteção CSRF/rate limiting/abuse protection nos fluxos públicos.

### Resultado Web App

**Aprovado apenas para homologação**, depois de corrigir riscos de banco e dados simulados. O typecheck verde é positivo, mas insuficiente para produção.

## 6. Auditoria do Site

### Cobertura encontrada

- landing page com benefícios, segmentos, preços e CTA;
- páginas específicas para salão, barbearia, clínica e studios;
- Termos de Uso e Política de Privacidade;
- login, cadastro e recuperação;
- páginas públicas de agendamento/anamnese/catálogo.

### Riscos e oportunidades

- preços e benefícios divergem do Mobile;
- rodapé ainda exibe © 2025;
- afirmações como “criptografia de ponta a ponta”, “backup automático” e “totalmente em conformidade com LGPD” não foram comprovadas pelo código; devem ser demonstráveis ou removidas;
- não há checkout real nem jornada completa mensurável;
- FAQ pública geral e central de confiança/segurança não estão consolidadas;
- SEO técnico, Core Web Vitals, analytics de conversão, sitemap e testes de produção não foram comprovados;
- placeholders e canais fictícios precisam ser retirados antes da publicação.

## 7. Paridade obrigatória Mobile × Web

### Cobertura nominal

Ambos possuem agenda, clientes, serviços, equipe, financeiro, caixa, comandas, produtos, pedidos, relatórios, anamnese, link público, configurações, indicação, IA e assinatura.

### Paridade real

| Área | Situação |
|---|---|
| Agenda/agendamentos | Parcial: ambas existem, implementações distintas e sem testes contratuais |
| Clientes | Parcial: CRUD existe; comportamento, validações e anamnese não comprovados como equivalentes |
| Serviços/pacotes | Parcial: cobertura presente, regras duplicadas |
| Equipe/permissões | Parcial: modelos e login de profissional não são comprovadamente equivalentes |
| Caixa/financeiro/comandas | Parcial: interfaces amplas, regras distribuídas e risco de concorrência |
| Produtos/estoque/pedidos | Parcial: módulos existem; consistência transacional não comprovada |
| Relatórios | Parcial: cálculos ocorrem também no cliente e podem divergir |
| Configurações | Parcial: organização de telas diferente e fonte de dados fragmentada |
| Assinatura/trial | Reprovada; consultar relatório especializado |
| Erros/offline/loading | Reprovada por falta de contrato e teste comum |
| Acessibilidade | Reprovada nas duas plataformas, especialmente Mobile |

**Nota: 5,0/10.** O mapa de funcionalidades é semelhante, mas não existe garantia de mesmo resultado. Paridade exige endpoints/application services comuns, schemas versionados, decisões de permissão server-side e testes executados nas duas interfaces.

## 8. UX/UI, Nielsen, Design System e acessibilidade

### Heurísticas de Nielsen

| Heurística | Avaliação |
|---|---|
| Visibilidade do status | Boa em carregamentos e feedback visual; inconsistente em operações simuladas |
| Correspondência com o mundo real | Boa linguagem do setor; datas em formato técnico `AAAA-MM-DD` prejudicam usuários |
| Controle e liberdade | Existem confirmações, mas cancelamento/exclusão podem prometer algo não executado |
| Consistência | Reprovada em preços, planos, trial, componentes e mensagens entre plataformas |
| Prevenção de erros | Parcial; validação ocorre frequentemente apenas no cliente |
| Reconhecimento em vez de memória | Boa navegação por módulos e ícones, porém telas densas e muito extensas |
| Eficiência | Boa amplitude; falta busca/atalhos consistentes e fluxos podem exigir muitas telas |
| Estética/minimalismo | Visual polido, mas algumas telas concentram informação e ações demais |
| Recuperação de erros | Fragmentada; ausência de tratamento global e códigos acionáveis |
| Ajuda/documentação | Tutoriais e suporte existem; contatos placeholder comprometem confiança |

### Design System

Há tokens de cor/tema e componentes `ui`, mas estilos inline extensivos no Mobile e variações locais no Web reduzem consistência. Faltam documentação, catálogo de componentes, tokens semânticos unificados, estados obrigatórios e testes visuais.

### Acessibilidade

O resultado é crítico:

- foram encontrados **493 `Pressable`** no Mobile;
- nenhum arquivo Mobile apresentou `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` ou `accessibilityState` na busca auditada;
- apenas 11 arquivos Web apresentaram `aria-*`/`role`, diante de 308 botões encontrados;
- não há evidência de teste VoiceOver/TalkBack, navegação por teclado, foco, redução de movimento, Dynamic Type ou contraste automatizado.

Prioridade P0/P1: rotular controles, garantir alvo mínimo, ordem de foco, teclado, foco em modais, contraste, texto escalável, alternativa a gestos/hápticos e respeito a reduced motion.

## 9. Arquitetura e qualidade de código

### Arquitetura atual

O Supabase funciona como banco, autenticação e API direta. Mobile e Web acessam tabelas diretamente em muitos pontos; o Web adiciona algumas API routes e o Hono forma um terceiro caminho. Foram encontrados **89 arquivos** com chamadas `.from(...)` nas superfícies auditadas.

Isso gera três camadas de regra concorrentes:

```text
Mobile -> Supabase direto
Web -> Supabase direto e Next API -> Supabase
Mobile -> Hono para casos específicos
```

### SOLID, Clean Code e DRY

- **SRP:** violado por páginas de 700–1.966 linhas misturando UI, query, regra, formatação e mutação.
- **Open/Closed e Dependency Inversion:** fracos; domínio depende diretamente do Supabase e UI conhece schema.
- **DRY:** regras de planos, trial, relatórios e validações aparecem duplicadas.
- **Interface Segregation:** componentes/telas concentram muitos estados e responsabilidades.
- **Clean Code:** nomes são geralmente compreensíveis, mas `any`, mocks, lógica inline e arquivos gigantes aumentam risco.
- **Testabilidade:** muito baixa devido ao acoplamento e ausência de testes.

### Arquitetura recomendada

Adotar monólito modular inicialmente:

```text
Interfaces (Mobile/Web/Site)
        -> API/BFF autenticada
            -> módulos de aplicação
               Agenda | Clientes | Catálogo | Estoque | Caixa
               Equipe | Anamnese | Assinaturas | Notificações
            -> repositórios/adapters
            -> Supabase e serviços externos
```

Clientes podem usar realtime/queries para leitura não sensível quando apropriado, mas regras e mutações críticas devem passar por serviços transacionais comuns.

## 10. Supabase: autenticação, RLS e banco

### Achados críticos

1. `get_admin_establishments()` é `SECURITY DEFINER`, ignora RLS, retorna dados de todos os estabelecimentos e foi concedida a `anon, authenticated`. Isso pode expor nome, e-mail, telefone e endereço. **Revogar imediatamente de `anon` e usuários comuns.**
2. `clients_public_select` permite leitura pública de clientes de qualquer estabelecimento ativo para “checar duplicata”. Isso pode expor PII de clientes. Substituir por RPC restrita que retorna somente existência/resultado mínimo, com rate limit.
3. `establishments_public_select` usa `select *` potencial via API e a linha contém campos comerciais/privados. Criar view pública com whitelist de colunas.
4. Políticas `FOR ALL USING` frequentemente não declaram `WITH CHECK` explicitamente e dependem de função que escolhe `limit 1`, inadequada para multiunidade.
5. Proprietário pode atualizar toda a linha do estabelecimento, inclusive futuros campos de assinatura; separar estado comercial em tabela protegida.
6. Migrations não representam integralmente `supabase-setup.sql`; ambientes novos podem divergir.
7. Tabelas referenciadas no código (`plans`, `admin_users` e outras) não aparecem de forma completa nas migrations auditadas.

### Autenticação

Supabase Auth e middleware existem. Porém faltam evidências de MFA para administradores, política forte de senha uniforme (há mínimo de 6 e 8 em fluxos distintos), proteção contra enumeração/brute force, rotação de sessão, auditoria de login e recuperação segura testada.

### Banco

O modelo multi-tenant é uma boa base, mas precisa de constraints de domínio, índices compostos, idempotência, transações para caixa/estoque/comandas, versionamento de schema e testes automatizados de RLS com papéis owner/employee/public/admin.

## 11. Segurança

### P0

- revogar função administrativa exposta;
- remover leitura pública de clientes;
- revisar todas as RPCs `SECURITY DEFINER`, grants e views públicas;
- retirar service-role de qualquer caminho cliente e validar que APIs admin autorizam papel, não apenas sessão;
- implementar exclusão real e trilha de auditoria;
- eliminar mutações comerciais e permissões confiadas ao cliente.

### P1

- rate limiting/CAPTCHA/anti-spam para agendamento, cadastro, anamnese e pedidos públicos;
- validação Zod compartilhada no servidor;
- headers CSP/HSTS/referrer/permissions e revisão CORS;
- gestão de secrets e rotação;
- logs sem PII, alertas e auditoria de ações sensíveis;
- upload com allowlist de MIME, tamanho, nome, scanning e autorização;
- análise de dependências/SAST e plano de atualização;
- segurança específica para anamnese, fotos e dados potencialmente sensíveis.

## 12. Performance

Não há benchmark executado, APM ou Web Vitals disponíveis. A nota, portanto, mede preparação, não velocidade real.

Riscos encontrados:

- telas monolíticas e grandes aumentam renderização/re-render e bundle;
- consultas e cálculos diretos podem produzir N+1 e transferência excessiva;
- listas precisam paginação/virtualização consistente;
- imagens remotas e uploads precisam otimização/caching;
- relatórios calculados no cliente não escalam com histórico;
- ausência de testes de performance e budgets;
- fallback mock pode mascarar indisponibilidade em vez de degradar de modo seguro.

Metas sugeridas: Web LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1 no p75; Mobile cold start e interações medidos por classe de aparelho; APIs p95 <500 ms para CRUD normal; listas sempre paginadas; crash-free sessions ≥99,5% no beta e ≥99,9% após estabilização.

## 13. Escalabilidade

| Escala | Avaliação |
|---:|---|
| 100 empresas | Viável após P0, com monitoramento básico |
| 1.000 | Exige índices, paginação, jobs idempotentes e observabilidade |
| 10.000 | Exige consolidar backend, filas, pooling, cache, reconciliação e testes de carga |
| 100.000 | Não comprovado; requer plano de capacidade, particionamento/arquivamento e SRE maduro |

O maior gargalo não é React Native ou Next.js; é a falta de fronteira de domínio, regras distribuídas, segurança pública permissiva e ausência de medidas reais.

## 14. Benchmark competitivo

Benchmark público, sem conta paga ou teste hands-on:

| Capacidade | AppBello atual | Referência de mercado |
|---|---|---|
| Agenda e agendamento online | Boa cobertura | Padrão básico do setor |
| Financeiro/caixa/estoque | Cobertura ampla, confiabilidade a validar | Trinks destaca financeiro, estoque, pagamentos e mais de 130 relatórios |
| CRM/relacionamento | Clientes, top clientes e indicação | Concorrentes destacam recorrência, fidelidade e marketing automatizado |
| Anamnese/estética | Diferencial promissor | Belle posiciona anamnese, CRM, WhatsApp, marketing e IA juntos |
| Pagamentos/comissões/NF | Incompleto | Trinks integra pagamentos, comissões e nota fiscal |
| IA | Presente e diferenciadora | Belle também anuncia IA; diferenciação depende de resultado mensurável |
| Multi-plataforma | Mobile + Web fortes em amplitude | Vantagem potencial, condicionada à paridade real |
| Confiança/maturidade | Baixa hoje | Concorrentes comunicam treinamento, integrações e operação consolidada |

Fontes: [Trinks para salões](https://negocios.trinks.com/negocios/saloes-de-beleza/), [soluções Trinks](https://negocios.trinks.com/solucoes/), [Belle Software](https://www.bellesoftware.com.br/) e [AppBeleza](https://appbeleza.com.br/).

### Posicionamento recomendado

Evitar competir somente por “agenda completa”. O melhor espaço observado é: **gestão simples, mobile-first e realmente integrada para pequenos e médios negócios**, com anamnese, automação e IA prática. Antes de ampliar features, fechar confiabilidade operacional, WhatsApp, pagamentos/comissões, relatórios acionáveis e onboarding rápido.

## 15. Regras de negócio

### Validadas parcialmente

- isolamento por estabelecimento;
- disponibilidade de agenda e bloqueios;
- CRUD de serviços, clientes, profissionais e produtos;
- comandas, caixa e transações;
- anamnese e agendamento público;
- permissões de funcionários;
- trial, planos e feature gates.

### Riscos

- regras estão nos clientes e podem divergir;
- concorrência de agenda, estoque e fechamento de caixa não possui garantia transacional comprovada;
- timezone, virada de dia, DST, recorrência, cancelamento e conflito precisam de testes;
- dinheiro deve usar decimal e arredondamento definido, nunca cálculo casual no cliente;
- permissões precisam ser aplicadas no banco/API, não apenas esconder botões;
- exclusão/anonimização precisa preservar obrigações fiscais sem manter dados indevidos;
- não há suíte de cenários de negócio como especificação executável.

## 16. Validação comercial SaaS

### Pontos fortes

- problema e público-alvo são compreensíveis;
- proposta reúne operação diária em um produto;
- segmentos têm páginas dedicadas;
- onboarding guiado e trial podem reduzir barreira;
- Mobile + Web é uma proposta atraente.

### Problemas

- preços/planos divergentes reduzem confiança;
- CTAs e contatos placeholder quebram conversão;
- produto promete capacidades não comprovadas;
- checkout e ciclo de assinatura ainda não existem;
- não há evidência de analytics do funil, ativação, retenção, churn e conversão;
- amplitude excessiva antes da confiabilidade pode elevar suporte e churn.

Métricas mínimas: cadastro concluído, tempo até primeiro serviço/profissional/agendamento, ativação em 24 h/7 dias, WAU por empresa, agendamentos por empresa, conversão do trial, churn, inadimplência, adoção por módulo e tickets por conta.

## 17. Apple App Store

### Bloqueadores

- build Mobile com erros TypeScript;
- exclusão de conta não funcional;
- estratégia de pagamento ainda indefinida;
- placeholders e funcionalidades simuladas;
- configuração iOS, ícones, splash, permission strings, privacy manifest, push e Universal Links não comprovados;
- acessibilidade e testes iPhone/iPad ausentes;
- conta demo e instruções de review não preparadas.

A Apple exige que apps com criação de conta ofereçam exclusão dentro do app e que funcionalidades digitais desbloqueadas usem In-App Purchase quando a regra aplicável assim determinar. Também exige binário completo, URLs funcionais e remoção de conteúdo temporário. Fonte oficial: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), atualizada em 08/06/2026.

**Resultado:** não aprovado para submissão.

## 18. Google Play

### Bloqueadores

- exclusão real dentro do app e recurso web de solicitação não existem;
- billing/política de pagamentos ainda não decididos;
- Data Safety não pode ser preenchido com segurança enquanto fluxos e retenção não forem mapeados;
- erros Mobile, ausência de testes, acessibilidade e placeholders;
- AAB/release signing, target API, App Links, push, permissões e ficha da loja não comprovados;
- testes em tablets, resoluções, memória, bateria, ANR e crashes ausentes.

O Google exige caminho no app e recurso web para exclusão quando o app permite criação de conta. Fonte oficial: [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).

**Resultado:** não aprovado para submissão.

## 19. LGPD

### Positivo

- páginas de Termos e Privacidade existem;
- cadastro Web exige aceite;
- existe canal de privacidade declarado;
- interface oferece solicitação de exclusão.

### Lacunas

- exclusão é apenas visual;
- não há registro versionado de consentimento/termos;
- inventário de dados, finalidade, base legal, retenção, operadores e transferências não foi encontrado;
- não há fluxo comprovado para acesso, correção, portabilidade, oposição/revogação e resposta ao titular;
- anamnese pode conter dados sensíveis e requer controles reforçados;
- afirmações públicas de criptografia/conformidade não estão sustentadas por evidência técnica;
- faltam RIPD quando aplicável, plano de incidentes, encarregado/processo e descarte verificável.

A ANPD esclarece que o controlador responde pelo atendimento aos direitos dos titulares. Fonte: [Titular de Dados — ANPD](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1).

**Resultado:** conformidade não comprovada; revisão jurídica é necessária além das correções técnicas.

## 20. Relatórios obrigatórios

Entregues:

- `AUDITORIA_MONETIZACAO.md` — monetização, pagamentos e publicação;
- `AUDITORIA_GERAL_APPBELLO.md` — auditoria geral consolidada.

Artefatos recomendados na execução do roadmap:

- `MATRIZ_PARIDADE.md`;
- `MODELO_AMEACAS.md`;
- `INVENTARIO_LGPD.md`;
- `CHECKLIST_RELEASE_IOS.md` e `CHECKLIST_RELEASE_ANDROID.md`;
- relatório de RLS automatizado;
- relatório de acessibilidade;
- resultados de carga e performance;
- matriz de regras de negócio e testes de aceite.

## 21. Roadmap automático de correções

### Fase 0 — contenção (1–3 dias)

1. Revogar `get_admin_establishments` de `anon`/usuários comuns.
2. Remover `clients_public_select` e criar consulta pública mínima e segura.
3. Tirar do ar afirmações não comprovadas, placeholders e ativações simuladas.
4. Corrigir os 17 erros TypeScript do Mobile.
5. Fixar catálogo/trial oficial durante a centralização.

### Fase 1 — fundação (1–2 semanas)

1. Consolidar migrations e testar criação limpa do banco.
2. Criar testes automatizados de RLS e autorização.
3. Definir contratos backend comuns para operações críticas.
4. Implementar exclusão real e inventário LGPD.
5. Adicionar observabilidade e tratamento global de erros.
6. Iniciar acessibilidade de autenticação, navegação, agenda e formulários críticos.

### Fase 2 — confiabilidade e paridade (2–4 semanas)

1. Extrair regras de páginas gigantes para módulos testáveis.
2. Criar testes de contrato Mobile/Web e matriz de paridade.
3. Transacionar agenda, estoque, caixa e comandas no servidor.
4. Implementar assinatura/gateway conforme roadmap especializado.
5. Remover mocks de caminhos produtivos.
6. Paginar listas e otimizar queries/índices.

### Fase 3 — release (1–3 semanas)

1. Completar acessibilidade e QA de dispositivos.
2. Executar E2E dos fluxos críticos e testes de carga.
3. Fechar política de privacidade, Data Safety e metadados.
4. Preparar builds, contas demo, review notes e suporte.
5. Beta fechado, monitoramento e correção de crashes.

### Fase 4 — crescimento contínuo

1. Analytics de ativação/retenção/conversão.
2. Benchmark periódico e entrevistas com clientes.
3. WhatsApp, pagamentos/comissões/NF conforme estratégia.
4. Experimentos comerciais com catálogo versionado.
5. Planejamento de capacidade para 10 mil e 100 mil empresas baseado em medição.

## 22. Critérios de aprovação do produto

### Segurança e dados

- zero exposição pública de PII em testes automatizados;
- todas as RPCs `SECURITY DEFINER` com autorização e grants mínimos;
- RLS testada para owner, employee, public e admin;
- secrets protegidos, rate limits e auditoria em ações sensíveis;
- exclusão e direitos LGPD operacionais.

### Qualidade

- Mobile, Web e backend passam typecheck/build/lint;
- zero P0/P1 aberto;
- testes unitários e integração para regras críticas;
- E2E verde para cadastro, login, agenda, cliente, serviço, comanda/caixa, assinatura e exclusão;
- taxa de crash/erro dentro dos SLOs definidos.

### Paridade

- matriz de capacidades críticas 100% aprovada;
- mesmas regras/validações/permissões via contratos comuns;
- nenhum preço, limite ou permissão comercial definido no cliente;
- mesmos resultados de erro, conflito e sucesso.

### UX e acessibilidade

- WCAG 2.2 AA como meta Web e equivalência nativa;
- VoiceOver/TalkBack e teclado aprovados nos fluxos críticos;
- contraste, foco, texto escalável e reduced motion validados;
- teste de usabilidade com usuários do segmento sem bloqueadores.

### Performance e escala

- budgets Web/API/Mobile medidos e aprovados;
- testes de carga no volume-alvo com margem;
- paginação, índices, filas/retries e observabilidade operacionais;
- backups/restauração e runbooks testados.

### Lojas e comercial

- checklists Apple/Google completos, URLs públicas funcionais e sem placeholders;
- estratégia de billing compatível com cada loja;
- catálogo único e checkout real testado;
- suporte, termos, privacidade, Data Safety e review account prontos;
- beta fechado sem bloqueador por pelo menos um ciclo definido pela equipe.

## 23. Veredicto final

O AppBello já possui uma **base de produto convincente**, principalmente em amplitude funcional e apresentação. O problema central não é falta de telas: é a distância entre interface e garantia operacional. Segurança do Supabase, regras duplicadas, ausência de testes, acessibilidade e fluxos simulados precisam ser resolvidos antes de tratar o produto como pronto.

A ordem correta é: **conter exposições, estabilizar build, consolidar regras/backend, provar paridade, testar, adequar privacidade e somente então publicar**. Com os P0 e P1 concluídos e os critérios acima medidos, a nota deve ser reavaliada com evidências de ambiente, dispositivos e carga.
