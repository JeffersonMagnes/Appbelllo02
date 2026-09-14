# AppBello — redesign visual

Status: concluído no escopo de UI/UX. [Comparativo antes/depois](index.html).

## O que mudou

- Landing: hero centrado no produto, prévia com componente real da agenda, quatro capturas WebP, FAQ, links funcionais, narrativa comercial e CTA final. Números e depoimentos sem fonte no projeto e links sem destino foram substituídos por benefícios e orientações verificáveis.
- Identidade: Outfit, roxo AppBello e tons complementares preservados; tipografia, contraste, campos, cards, tabelas, botões e superfícies padronizados. Fonte carregada uma única vez.
- Navegação: menus do site e dos painéis com drawer no mobile, foco por teclado e identificação da página atual. Títulos internos visíveis no celular.
- Agenda: cores de status com contraste, correção de classes ausentes do Tailwind, células reutilizáveis, compromissos acessíveis por teclado, semana/mês com rolagem e visão anual legível no mobile.
- Modais da agenda: base Radix existente, foco contido, Escape, retorno de foco, limite de altura e rolagem.
- Financeiro: resumo compacto, valores com alinhamento numérico, período personalizado e histórico responsivos. Clientes e estoque: busca identificada, estados selecionados e tabela com rolagem acessível.
- Login, cadastro e páginas por segmento: composição, marca e imagens responsivas. Catálogo público: nomes e preços separados das imagens, sem duplicação no placeholder.
- Performance: sem novas dependências; imagens de produto WebP e preview social reduzido de ~6,4 MB para ~76 KB. Banners originais preservados como fontes, fora do carregamento da landing/login.

## Cobertura

56 rotas mapeadas; 55 telas renderizadas. `/agendar/[slug]` é um redirecionamento para o perfil público e não tem interface própria.

- Dashboard: 19 telas × 5 larguras = 95 capturas, sem erros de execução ou overflow da página.
- Outras telas: 36 × 5 larguras = 180 capturas em harness isolado.
- Páginas públicas no Next isolado: 33 capturas, estilos carregados, sem imagens quebradas nem overflow.
- Landing: 1440, 1280, 768, 390, 375 e 430 px.
- Onboarding: cinco etapas existentes e conclusão, renderizadas com estado local; nenhuma conta criada.
- Interações: 14 verificações aprovadas (menus, tabs, FAQ, senha, filtros, modais, teclado, tabela e reduced motion).
- Revisão adicional: 25 capturas de agenda, clientes, financeiro, estoque e catálogo.

## Validação técnica

- Typecheck: aprovado.
- Lint: aprovado, sem erros; 51 avisos do projeto. Hooks de dados não foram alterados para silenciá-los.
- Build de produção: aprovado em cópia temporária isolada.
- `git diff --check`: aprovado.
- Comparação por AST: corpos não visuais de login, cadastro, clientes, financeiro, produtos e perfil público permaneceram iguais.

## Limites da validação

Telas privadas e perfis públicos parametrizados foram renderizados com dados fictícios. Não houve criação de conta, gravações, cobranças ou validação ponta a ponta de sessões reais. As alterações preexistentes da frente Trial/Billing foram preservadas.

O Next instalado contém um shim de telemetria que exporta `TelemetryShim` em vez de `Telemetry`. Para rodar preview/build foi usado um adaptador temporário via `NODE_OPTIONS`, fora do produto. O build exigiu permissão para a porta IPC local do Next. Uma rodada no servidor compartilhado perdeu CSS/JS; seus resultados foram descartados e a verificação pública foi repetida em preview isolado.

As evidências JSON nesta pasta detalham os cenários; as imagens de demonstração também documentam sua origem em `public/product/README.md`.
