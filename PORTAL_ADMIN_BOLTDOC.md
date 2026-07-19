# Portal Administrativo Web — AppBello
## Documento de Especificação para bolt.new

---

## VISÃO GERAL

Criar um **portal web administrativo completo** para a plataforma AppBello — um SaaS para salões de beleza, clínicas estéticas e barbearias. O portal deve ser acessível em desktop e mobile, com design moderno, limpo e profissional.

**URL base do portal:** `admin.appbello.com.br`

---

## STACK TECNOLÓGICA

```
- Framework: Next.js 14 (App Router)
- Linguagem: TypeScript
- Estilização: Tailwind CSS + shadcn/ui
- Banco de Dados: Supabase (PostgreSQL)
- Autenticação: Supabase Auth
- Gráficos: Recharts
- Tabelas: TanStack Table
- Formulários: React Hook Form + Zod
- Estado: Zustand
- Ícones: Lucide React
- Notificações: Sonner (toast)
- Upload: Supabase Storage
```

---

## PALETA DE CORES E DESIGN

```
Cor primária:   #5333ED  (roxo/índigo — identidade da marca)
Cor secundária: #0BBDB6  (teal/verde-água)
Sucesso:        #10B981
Aviso:          #F59E0B
Erro:           #EF4444
Info:           #3B82F6

Fundo principal:    #F8F9FC  (cinza muito claro)
Fundo cards:        #FFFFFF
Sidebar:            #1E1B4B  (roxo escuro)
Sidebar texto:      #FFFFFF
Texto principal:    #111827
Texto secundário:   #6B7280
Bordas:             #E5E7EB
```

**Tipografia:** Inter (Google Fonts)
**Border radius:** 12px para cards, 8px para inputs
**Sombra padrão:** `shadow-sm` nos cards, `shadow-lg` em modais

---

## LAYOUT GLOBAL

### Sidebar (Navegação lateral — desktop)
- Logo AppBello no topo
- Links de navegação agrupados por categoria com ícones
- Avatar + nome do admin logado na base
- Indicador de status do sistema (online/offline)
- Botão de logout

### Topbar
- Breadcrumb da página atual
- Campo de busca global
- Ícone de notificações com badge de contagem
- Avatar do admin com menu dropdown

### Responsivo
- Mobile: navegação via bottom bar ou hamburger menu
- Tablet: sidebar colapsável com ícones apenas

---

## PÁGINAS E MÓDULOS

---

### 1. DASHBOARD PRINCIPAL (`/dashboard`)

**Cards KPI — Linha 1:**
- Total de Estabelecimentos Ativos
- Total de Usuários Cadastrados
- Receita Mensal (MRR)
- Novos cadastros hoje

**Cards KPI — Linha 2:**
- Trials Ativos
- Trials Expirando (próximos 7 dias)
- Taxa de Conversão Trial → Pago
- Churn Rate mensal

**Gráficos:**
- Gráfico de linha: Crescimento de usuários (últimos 12 meses)
- Gráfico de barras: Receita por mês (últimos 6 meses)
- Gráfico de pizza: Distribuição de planos (Starter / Pro / Premium)
- Gráfico de área: Novos cadastros por semana

**Tabelas:**
- Últimos 10 cadastros com status (trial/ativo/expirado)
- Alertas: trials expirando em 3 dias (ação rápida: enviar email)

**Atividade Recente:**
- Feed em tempo real: novos cadastros, upgrades de plano, cancelamentos, pagamentos

---

### 2. GESTÃO DE USUÁRIOS (`/usuarios`)

#### 2.1 Lista de Usuários (`/usuarios`)

**Filtros e Busca:**
- Busca por nome, email, telefone, estabelecimento
- Filtro por status: Todos / Trial / Ativo / Expirado / Cancelado / Bloqueado
- Filtro por plano: Starter / Pro / Premium / Sem plano
- Filtro por data de cadastro (range de datas)
- Filtro por estado/cidade

**Tabela de Usuários — Colunas:**
- Avatar + Nome do responsável
- Nome do estabelecimento
- Email + Telefone
- Plano atual (badge colorido)
- Status (badge: trial/ativo/expirado/bloqueado)
- Data de cadastro
- Dias restantes no trial (barra de progresso se em trial)
- Último acesso
- Ações: Ver detalhes / Editar / Bloquear / Enviar email / Excluir

**Exportação:** Botão para exportar CSV

#### 2.2 Detalhes do Usuário (`/usuarios/[id]`)

**Seção: Informações do Estabelecimento**
- Logo do estabelecimento
- Nome, tipo (salão/clínica/barbearia), telefone, WhatsApp, Instagram
- Endereço completo
- Data de cadastro, último acesso

**Seção: Plano e Assinatura**
- Plano atual com badge
- Status da assinatura
- Data de início e vencimento
- Histórico de planos (linha do tempo)
- Botão: Alterar plano manualmente
- Botão: Estender trial (+X dias)
- Botão: Cancelar assinatura
- Histórico de pagamentos (tabela: data, valor, método, status)

**Seção: Estatísticas de Uso**
- Total de profissionais cadastrados
- Total de clientes cadastrados
- Total de agendamentos realizados
- Total de produtos cadastrados
- Total de transações financeiras
- Uso médio semanal (gráfico mini)

**Seção: Funcionários/Colaboradores**
- Lista de funcionários do estabelecimento com roles

**Seção: Código de Referral**
- Código único gerado
- Quantas indicações realizou
- Desconto aplicado

**Seção: Logs e Atividade**
- Histórico de ações do usuário (últimos 30 registros)

**Ações Administrativas:**
- Botão: Resetar senha
- Botão: Enviar notificação push
- Botão: Enviar email personalizado
- Botão: Bloquear conta
- Botão: Excluir conta (com confirmação)
- Botão: Logar como este usuário (impersonation para suporte)

#### 2.3 Adicionar Usuário Manualmente (`/usuarios/novo`)
- Formulário completo com todos os dados do estabelecimento
- Seleção de plano inicial
- Definir dias de trial manualmente
- Enviar email de boas-vindas (toggle)

---

### 3. GESTÃO DE PLANOS E FINANCEIRO (`/planos`)

#### 3.1 Configuração de Planos (`/planos/configuracao`)

**Tabela de Planos — 3 Cards editáveis:**

**Card: Plano Starter**
- Nome do plano (editável)
- Preço mensal (R$) — campo editável
- Preço anual (R$) — campo editável
- Desconto anual % — calculado automaticamente
- Cor do badge — seletor de cor
- Lista de recursos incluídos (adicionar/remover/reordenar)
- Limite de profissionais — campo numérico
- Limite de clientes — campo numérico (-1 para ilimitado)
- Toggle: Plano ativo/inativo
- Toggle: Destaque ("Mais Popular")
- Botão: Salvar alterações

**Card: Plano Pro**
- Mesmos campos do Starter

**Card: Plano Premium**
- Mesmos campos do Starter
- Campo adicional: "Preço personalizado" (toggle para exibir "Consulte")

**Configurações Globais de Trial:**
- Dias de trial padrão (campo numérico, padrão: 30)
- Mensagem de expiração de trial (texto editável)
- Toggle: Ativar/desativar período de trial

**Configurações de Referral:**
- Desconto por indicação (%)
- Máximo de descontos por usuário
- Toggle: Programa de referral ativo

#### 3.2 Visão Financeira (`/planos/financeiro`)

**Resumo do período (seletor: mês atual / trimestre / ano):**
- MRR (Receita Recorrente Mensal)
- ARR (Receita Recorrente Anual)
- Receita total do período
- Reembolsos/estornos
- Receita líquida

**Gráficos:**
- Gráfico de linha: MRR evolução mensal (12 meses)
- Gráfico de barras: Receita por plano
- Gráfico de área: Novos vs Churn vs Expansão (MRR movement)

**Tabela de Transações:**
- Colunas: Data / Usuário / Estabelecimento / Plano / Valor / Método / Status
- Filtros: Status (pago/pendente/cancelado), Plano, Período
- Exportar CSV

**Métricas de Churn:**
- Churn rate mensal (%)
- Usuários cancelados no mês
- Motivos de cancelamento (gráfico de pizza se registrado)

#### 3.3 Cupons e Descontos (`/planos/cupons`)

**Tabela de Cupons:**
- Colunas: Código / Desconto / Tipo (%) / Usos / Limite / Validade / Status / Ações

**Criar Cupom:**
- Modal com campos:
  - Código (gerador automático ou manual)
  - Tipo: percentual ou valor fixo
  - Valor do desconto
  - Limite de usos totais
  - Limite de usos por usuário
  - Data de validade
  - Planos aplicáveis (multi-select)
  - Descrição interna
  - Toggle: ativo/inativo

---

### 4. GESTÃO DE ANÚNCIOS — OFERTAS DE PARCEIROS (`/parceiros`)

> Esta seção controla os anúncios exibidos no carrossel "Ofertas de Parceiros" e "Produtos Selecionados para Você" dentro do aplicativo mobile.

#### 4.1 Dashboard de Anúncios (`/parceiros`)

**Cards KPI:**
- Total de anúncios ativos
- Total de impressões (semana)
- Total de cliques (semana)
- CTR médio (%)

**Gráficos:**
- Gráfico de barras: Impressões por anúncio (top 10)
- Gráfico de linha: Cliques ao longo do tempo (7 dias)

**Tabela de Anúncios Ativos:**
- Prévia da imagem (thumbnail)
- Título do anúncio
- Parceiro/Empresa
- Categoria
- Período de exibição
- Impressões / Cliques / CTR
- Status (ativo/pausado/expirado/rascunho)
- Ações: Editar / Pausar / Duplicar / Excluir

#### 4.2 Criar/Editar Anúncio (`/parceiros/novo` ou `/parceiros/[id]/editar`)

**Formulário completo em steps:**

**Step 1: Informações do Parceiro**
- Nome da empresa/parceiro
- Logo do parceiro (upload)
- Categoria do parceiro:
  - Produtos capilares
  - Cosméticos e maquiagem
  - Equipamentos profissionais
  - Cursos e treinamentos
  - Softwares e ferramentas
  - Seguros e benefícios
  - Financeiro e crédito
  - Outros
- Site do parceiro (URL)
- Contato comercial (nome + email)

**Step 2: Criação do Anúncio**
- Tipo de anúncio:
  - **Banner Carrossel** (exibido no carrossel "Ofertas de Parceiros" na home)
  - **Card Produto** (exibido na seção "Produtos Selecionados para Você")
  - **Banner Full** (tela cheia em momentos específicos)
- Título do anúncio (máx. 60 caracteres)
- Subtítulo/descrição curta (máx. 120 caracteres)
- Imagem principal (upload — dimensões recomendadas exibidas por tipo)
- Cor de fundo do card (seletor de cor)
- Cor do texto (seletor de cor)
- Badge/etiqueta (ex: "10% OFF", "NOVO", "EXCLUSIVO", "FRETE GRÁTIS")
- Cor do badge
- Botão CTA (texto do botão: ex. "Ver oferta", "Comprar agora", "Saiba mais")
- URL de destino (link do parceiro ou deep link no app)
- Toggle: Abrir no app ou no navegador externo

**Step 3: Segmentação**
- Público-alvo:
  - Todos os usuários
  - Somente plano Starter
  - Somente plano Pro
  - Somente plano Premium
  - Planos selecionados (multi-select)
- Segmentação por tipo de estabelecimento:
  - Todos
  - Salões de beleza
  - Clínicas estéticas
  - Barbearias
  - Seleção múltipla
- Segmentação geográfica (estado — multi-select ou "Todo o Brasil")
- Segmentação por fase:
  - Todos
  - Somente usuários em trial
  - Somente usuários pagantes
  - Usuários com trial expirando (< 7 dias)

**Step 4: Período e Prioridade**
- Data de início
- Data de término (ou sem data de término)
- Prioridade de exibição (1-10, quanto maior mais frequente)
- Frequência máxima: mostrar no máximo X vezes por dia por usuário
- Posição no carrossel (ordem, drag-and-drop)

**Step 5: Revisão e Publicação**
- Preview do anúncio como aparecerá no app (mockup do card/banner)
- Resumo de todas as configurações
- Status inicial: Rascunho / Ativo / Agendado
- Botão: Salvar como rascunho
- Botão: Publicar agora

#### 4.3 Gestão de Parceiros (`/parceiros/empresas`)

**Tabela de Parceiros Cadastrados:**
- Logo + Nome da empresa
- Categoria
- Total de anúncios (ativos/total)
- Total de impressões acumuladas
- Total de cliques acumulados
- Status do contrato (ativo/inativo)
- Ações: Ver anúncios / Editar / Desativar

**Cadastrar Novo Parceiro:**
- Modal com campos: nome, logo, categoria, site, contato, observações

#### 4.4 Relatórios de Anúncios (`/parceiros/relatorios`)

**Filtros:**
- Período (últimos 7/30/90 dias ou range personalizado)
- Parceiro específico
- Tipo de anúncio
- Status

**Métricas por anúncio:**
- Impressões totais
- Cliques únicos
- CTR (%)
- Usuários alcançados
- Breakdown por plano (Starter/Pro/Premium)
- Gráfico de performance ao longo do tempo

---

### 5. PRODUTOS SELECIONADOS PARA VOCÊ (`/produtos-selecionados`)

> Seção dedicada para curar e gerenciar os produtos/serviços recomendados que aparecem na seção "Produtos Selecionados para Você" no app.

#### 5.1 Lista de Produtos Curados

**Grid de cards com:**
- Imagem do produto
- Nome do produto
- Empresa/marca
- Categoria
- Preço (ou "A consultar")
- Badge de destaque (Novo / Recomendado / Mais vendido / Oferta)
- Toggle: Ativo/Inativo
- Ordem de exibição
- Ações: Editar / Remover / Duplicar

**Filtros:**
- Por categoria
- Por status (ativo/inativo)
- Por tipo de destaque

#### 5.2 Adicionar/Editar Produto Selecionado

**Formulário:**
- Imagem do produto (upload, múltiplas imagens)
- Nome do produto
- Descrição (editor de texto rico, máx. 500 caracteres)
- Empresa/marca (vincular a parceiro cadastrado ou digitar livremente)
- Categoria:
  - Produtos para cabelo
  - Skincare e estética
  - Maquiagem
  - Equipamentos
  - Cursos e capacitação
  - Tecnologia para salão
  - Uniformes e acessórios
  - Outros
- Preço original (R$)
- Preço com desconto (R$) — exibe automaticamente % de desconto
- Toggle: Exibir preço ou "Consultar"
- Link de compra/redirecionamento
- Badge especial: Novo / Recomendado / Mais Vendido / Exclusivo AppBello / Oferta Relâmpago
- Período de destaque (datas inicio/fim para badge "Oferta Relâmpago")
- Segmentação por plano (igual ao módulo de anúncios)
- Posição no grid (ordem)
- Toggle: Produto ativo

---

### 6. NOTIFICAÇÕES E COMUNICAÇÃO (`/notificacoes`)

#### 6.1 Envio de Notificações Push (`/notificacoes/push`)

**Criar notificação:**
- Título (máx. 50 caracteres)
- Mensagem (máx. 150 caracteres)
- Imagem opcional (upload)
- Ação ao clicar:
  - Abrir home do app
  - Abrir módulo específico (agenda/financeiro/assinatura/etc.)
  - Abrir URL externa
- Segmentação:
  - Todos os usuários
  - Por plano
  - Por status (trial/ativo/expirando)
  - Usuário específico (busca por email)
  - Por tipo de estabelecimento
- Agendamento: Enviar agora ou agendar data/hora
- Preview da notificação (mockup de push notification)
- Histórico de notificações enviadas (tabela com métricas: entregues/abertas/taxa)

#### 6.2 Campanhas de Email (`/notificacoes/email`)

**Templates de email pré-configurados:**
- Boas-vindas (novo cadastro)
- Trial expirando (7 dias, 3 dias, 1 dia)
- Trial expirado — convite para assinar
- Pagamento confirmado
- Pagamento falhou
- Novo plano ativado
- Email personalizado (editor livre)

**Para cada template:**
- Editor de assunto
- Editor HTML + preview
- Toggle: ativo/inativo (envio automático)
- Histórico de envios

#### 6.3 Central de Mensagens (`/notificacoes/mensagens`)
- Inbox de mensagens recebidas via app (suporte)
- Responder mensagens
- Marcar como resolvido
- Atribuir a colaborador do time

---

### 7. CONTEÚDO E CONFIGURAÇÕES DO APP (`/configuracoes-app`)

#### 7.1 Configurações Gerais

**Aparência do App:**
- Logo principal do AppBello (upload)
- Cor primária (seletor hex)
- Cor secundária (seletor hex)
- Preview em tempo real das cores no mockup do app

**Textos e Mensagens:**
- Texto da tela de boas-vindas
- Texto de descrição dos planos
- Texto de expiração de trial
- Mensagem de sucesso no agendamento
- Termos de uso (editor de texto)
- Política de privacidade (editor de texto)

**Recursos Globais:**
- Toggle: Módulo de anamnese ativo
- Toggle: Módulo de IA (assistente) ativo
- Toggle: Programa de referral ativo
- Toggle: Módulo de estoque/produtos ativo
- Toggle: Módulo financeiro ativo
- Toggle: Módulo de comandas ativo
- Toggle: Booking público ativo

#### 7.2 Configurações do Assistente IA (`/configuracoes-app/ia`)

- Modelo de IA padrão (Claude Opus / Sonnet / Haiku)
- Prompt do sistema (editor)
- Sugestões de perguntas rápidas (adicionar/remover/reordenar)
- Toggle: IA ativo para Starter / Pro / Premium (por plano)
- Logs de conversas (últimas 100 — anônimas)

#### 7.3 Onboarding (`/configuracoes-app/onboarding`)
- Editar textos de cada step do onboarding (steps 1-7)
- Ativar/desativar steps opcionais
- Preview de cada step

---

### 8. ANALYTICS E RELATÓRIOS (`/analytics`)

#### 8.1 Overview (`/analytics`)

**Métricas principais:**
- DAU (Daily Active Users)
- WAU (Weekly Active Users)
- MAU (Monthly Active Users)
- Session duration médio
- Telas mais acessadas (top 10)
- Features mais utilizadas

**Gráficos:**
- Retention curve (D1, D7, D30)
- Funil: Cadastro → Trial ativo → Plano pago
- Heatmap de horários de acesso

#### 8.2 Relatório de Estabelecimentos (`/analytics/estabelecimentos`)
- Rankings: estabelecimentos com mais agendamentos
- Rankings: estabelecimentos com mais clientes
- Rankings: estabelecimentos mais ativos
- Filtro por período e plano

#### 8.3 Relatório de Funcionalidades (`/analytics/funcionalidades`)
- Quais módulos são mais/menos usados
- Taxa de adoção por módulo
- Correlação entre uso de módulo e retenção

---

### 9. GESTÃO DE CONTEÚDO / FAQ (`/conteudo`)

#### 9.1 Central de Ajuda
- Categorias de perguntas frequentes (adicionar/editar/remover)
- Artigos de ajuda (editor de texto rico)
- Ordenação e destaque de artigos
- Toggle: Artigo ativo

#### 9.2 Novidades / Changelog
- Publicar novidades que aparecem no app ("O que há de novo")
- Título, descrição, imagem, versão do app
- Data de publicação
- Toggle: Visível no app

---

### 10. EQUIPE E ADMINISTRADORES (`/equipe`)

**Tabela de Administradores do Portal:**
- Avatar + Nome + Email
- Role: Super Admin / Admin / Suporte / Financeiro / Marketing
- Último acesso
- Status (ativo/inativo)
- Ações: Editar permissões / Desativar

**Convidar Novo Administrador:**
- Email, nome, role
- Permissões granulares por módulo:
  - Usuários: ler / escrever / excluir
  - Planos/Financeiro: ler / escrever
  - Anúncios: ler / escrever / publicar
  - Analytics: ler
  - Configurações: ler / escrever
  - Equipe: ler / escrever

**Log de Auditoria:**
- Todas as ações de administradores
- Filtro por admin, ação, período

---

### 11. CONFIGURAÇÕES DO PORTAL (`/configuracoes`)

- Dados da empresa (AppBello)
- Domínios configurados
- Integrações: Supabase URL + keys
- Configurações de email (SMTP)
- Webhooks (endpoints para notificações de pagamento)
- Chaves de API (gerenciar e revogar)
- Backup de dados (exportar banco completo)

---

## COMPONENTES GLOBAIS

### Sidebar Navigation (itens)
```
Dashboard          → /dashboard
Usuários           → /usuarios
  ├─ Todos usuários
  ├─ Trials ativos
  └─ Expirados
Planos & Financeiro → /planos
  ├─ Configurar planos
  ├─ Financeiro
  └─ Cupons
Anúncios & Parceiros → /parceiros
  ├─ Dashboard anúncios
  ├─ Criar anúncio
  ├─ Empresas parceiras
  └─ Relatórios
Produtos Selecionados → /produtos-selecionados
Notificações       → /notificacoes
  ├─ Push
  ├─ Email
  └─ Mensagens
Analytics          → /analytics
Config. do App     → /configuracoes-app
Conteúdo / FAQ     → /conteudo
Equipe             → /equipe
Configurações      → /configuracoes
```

### Componentes reutilizáveis necessários:
- `<KPICard>` — card de métrica com ícone, valor, variação (%)
- `<DataTable>` — tabela com paginação, busca, filtros e exportação
- `<StatusBadge>` — badge colorido para status
- `<PlanBadge>` — badge para plano (Starter/Pro/Premium)
- `<UserAvatar>` — avatar com fallback em iniciais
- `<ConfirmModal>` — modal de confirmação para ações destrutivas
- `<ImageUpload>` — componente de upload com preview
- `<DateRangePicker>` — seletor de período
- `<RichTextEditor>` — editor de texto rico para emails/conteúdo
- `<AdPreview>` — preview de como o anúncio aparecerá no app
- `<EmptyState>` — estado vazio com ícone e CTA

---

## BANCO DE DADOS — TABELAS ADICIONAIS NECESSÁRIAS

```sql
-- Tabela de anúncios/parceiros
CREATE TABLE partner_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  title VARCHAR(60) NOT NULL,
  subtitle VARCHAR(120),
  image_url TEXT,
  badge_text VARCHAR(20),
  badge_color VARCHAR(7),
  bg_color VARCHAR(7),
  text_color VARCHAR(7),
  cta_text VARCHAR(30),
  destination_url TEXT,
  open_external BOOLEAN DEFAULT false,
  ad_type VARCHAR(20), -- 'carousel', 'product_card', 'full_banner'
  target_plans TEXT[], -- array de planos
  target_establishment_types TEXT[],
  target_states TEXT[],
  target_phase VARCHAR(20), -- 'all', 'trial', 'paying', 'expiring'
  priority INTEGER DEFAULT 5,
  max_daily_shows INTEGER DEFAULT 3,
  display_order INTEGER,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, expired
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de parceiros
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  category VARCHAR(50),
  website TEXT,
  contact_name VARCHAR(100),
  contact_email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de produtos selecionados
CREATE TABLE featured_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  images TEXT[],
  category VARCHAR(50),
  original_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  show_price BOOLEAN DEFAULT true,
  purchase_url TEXT,
  badge VARCHAR(30),
  badge_color VARCHAR(7),
  target_plans TEXT[],
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de administradores do portal
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  role VARCHAR(30), -- 'super_admin', 'admin', 'support', 'financial', 'marketing'
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de notificações push enviadas
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(50),
  message VARCHAR(150),
  image_url TEXT,
  action_type VARCHAR(30),
  action_url TEXT,
  target_segment JSONB,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de log de auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## AUTENTICAÇÃO DO PORTAL

- Login exclusivo via email + senha (sem OAuth)
- Somente emails com role em `admin_users` podem acessar
- Proteção de rotas: middleware Next.js verificando sessão + role
- Sessão expira em 8 horas
- 2FA opcional (TOTP via Google Authenticator)
- Tela de login em `/login` com logo AppBello, campo email/senha, botão entrar
- Esqueci minha senha via email

---

## TELA DE LOGIN DO PORTAL

Design da tela:
- Fundo: gradiente diagonal de #5333ED para #0BBDB6
- Card central branco com sombra grande
- Logo AppBello + "Portal Administrativo"
- Campo: Email
- Campo: Senha (com toggle ver/ocultar)
- Botão: "Entrar" (cor primária, full width)
- Link: "Esqueci minha senha"
- Rodapé: "© 2026 AppBello — Acesso restrito"

---

## OBSERVAÇÕES FINAIS

1. **Responsividade:** O portal deve funcionar em desktop (1280px+), tablet (768px) e mobile (360px). Sidebar vira bottom navigation em mobile.

2. **Performance:** Usar React Query/SWR para cache de dados, paginação server-side em todas as tabelas grandes.

3. **Segurança:** 
   - Todas as rotas protegidas por middleware
   - RLS no Supabase para isolar dados por admin
   - Rate limiting nas APIs
   - Sanitização de inputs
   - Log de todas as ações sensíveis

4. **Internacionalização:** Interface em português do Brasil (pt-BR) por padrão.

5. **Dark mode:** Suporte opcional, toggle no header.

6. **Deploy:** Vercel (Next.js) com variáveis de ambiente do Supabase.

---

## APIs — ESPECIFICAÇÃO DE ENDPOINTS

> Todas as rotas abaixo são Next.js Route Handlers em `app/api/`. Autenticação via cookie de sessão Supabase. Admins verificados na tabela `admin_users` antes de qualquer operação.

---

### AUTENTICAÇÃO DO PORTAL

```
POST   /api/auth/login
       Body: { email, password }
       Response: { session, admin: { id, name, role, permissions } }

POST   /api/auth/logout
       Response: { success: true }

GET    /api/auth/me
       Response: { admin: { id, name, email, role, permissions } }

POST   /api/auth/forgot-password
       Body: { email }
       Response: { message }

POST   /api/auth/reset-password
       Body: { token, new_password }
       Response: { success: true }
```

---

### USUÁRIOS / ESTABELECIMENTOS

```
GET    /api/users
       Query: ?page=1&limit=20&search=&status=&plan=&from=&to=
       Response: { data: User[], total, page, totalPages }

GET    /api/users/:id
       Response: { user, establishment, subscription, stats, employees, referral }

POST   /api/users
       Body: { name, email, password, establishment_name, plan, trial_days }
       Response: { user }

PATCH  /api/users/:id
       Body: Partial<{ name, email, plan, status, trial_days }>
       Response: { user }

DELETE /api/users/:id
       Response: { success: true }

POST   /api/users/:id/block
       Body: { reason? }
       Response: { success: true }

POST   /api/users/:id/unblock
       Response: { success: true }

POST   /api/users/:id/extend-trial
       Body: { days: number }
       Response: { new_trial_end: string }

POST   /api/users/:id/change-plan
       Body: { plan: 'starter' | 'pro' | 'premium', reason? }
       Response: { subscription }

POST   /api/users/:id/reset-password
       Response: { message: 'Email enviado' }

POST   /api/users/:id/send-notification
       Body: { title, message, action_type?, action_url? }
       Response: { success: true }

POST   /api/users/:id/send-email
       Body: { subject, body_html, template_id? }
       Response: { success: true }

POST   /api/users/:id/impersonate
       Response: { impersonation_token, redirect_url }
       Note: Gera token temporário (15min) para acesso de suporte

GET    /api/users/:id/activity
       Query: ?limit=50
       Response: { logs: ActivityLog[] }

GET    /api/users/export
       Query: (mesmos filtros do GET /api/users)
       Response: CSV file (Content-Type: text/csv)
```

---

### PLANOS E ASSINATURAS

```
GET    /api/plans
       Response: { plans: Plan[] }

GET    /api/plans/:id
       Response: { plan }

PUT    /api/plans/:id
       Body: { name, monthly_price, annual_price, features, limits, is_active, is_featured }
       Response: { plan }

GET    /api/plans/trial-config
       Response: { trial_days, expiry_message, referral_discount_pct, referral_active }

PUT    /api/plans/trial-config
       Body: { trial_days, expiry_message, referral_discount_pct, referral_active }
       Response: { config }
```

---

### FINANCEIRO

```
GET    /api/finance/summary
       Query: ?period=month|quarter|year&from=&to=
       Response: { mrr, arr, revenue, refunds, net_revenue, churn_rate }

GET    /api/finance/mrr-history
       Query: ?months=12
       Response: { data: [{ month, mrr, new, churned, expansion }] }

GET    /api/finance/revenue-by-plan
       Query: ?period=
       Response: { data: [{ plan, revenue, count }] }

GET    /api/finance/transactions
       Query: ?page=&limit=&status=&plan=&from=&to=
       Response: { data: Transaction[], total }

GET    /api/finance/transactions/export
       Query: (mesmos filtros)
       Response: CSV file
```

---

### CUPONS

```
GET    /api/coupons
       Query: ?page=&search=&status=
       Response: { data: Coupon[], total }

POST   /api/coupons
       Body: { code, type, value, max_uses, max_uses_per_user, expires_at, applicable_plans, description }
       Response: { coupon }

GET    /api/coupons/:id
       Response: { coupon, usage_count, usage_list }

PUT    /api/coupons/:id
       Body: Partial<Coupon>
       Response: { coupon }

DELETE /api/coupons/:id
       Response: { success: true }

POST   /api/coupons/generate-code
       Response: { code: string }  — gera código aleatório único
```

---

### PARCEIROS

```
GET    /api/partners
       Query: ?page=&search=&status=
       Response: { data: Partner[], total }

POST   /api/partners
       Body: { name, logo_url, category, website, contact_name, contact_email }
       Response: { partner }

GET    /api/partners/:id
       Response: { partner, ads_count, total_impressions, total_clicks }

PUT    /api/partners/:id
       Body: Partial<Partner>
       Response: { partner }

DELETE /api/partners/:id
       Response: { success: true }
```

---

### ANÚNCIOS

```
GET    /api/ads
       Query: ?page=&status=&partner_id=&type=&from=&to=
       Response: { data: Ad[], total }

POST   /api/ads
       Body: {
         partner_id, title, subtitle, image_url,
         badge_text, badge_color, bg_color, text_color,
         cta_text, destination_url, open_external,
         ad_type, target_plans, target_establishment_types,
         target_states, target_phase,
         priority, max_daily_shows, display_order,
         starts_at, ends_at, status
       }
       Response: { ad }

GET    /api/ads/:id
       Response: { ad, impressions_history, clicks_history }

PUT    /api/ads/:id
       Body: Partial<Ad>
       Response: { ad }

DELETE /api/ads/:id
       Response: { success: true }

POST   /api/ads/:id/pause
       Response: { ad }

POST   /api/ads/:id/activate
       Response: { ad }

POST   /api/ads/:id/duplicate
       Response: { ad }  — cria cópia como rascunho

PATCH  /api/ads/reorder
       Body: { ordered_ids: string[] }
       Response: { success: true }

GET    /api/ads/stats
       Query: ?from=&to=&partner_id=
       Response: { total_impressions, total_clicks, ctr, top_ads: Ad[] }
```

---

### PRODUTOS SELECIONADOS

```
GET    /api/featured-products
       Query: ?page=&category=&status=
       Response: { data: FeaturedProduct[], total }

POST   /api/featured-products
       Body: {
         partner_id?, name, description, images,
         category, original_price, sale_price, show_price,
         purchase_url, badge, badge_color,
         target_plans, display_order, is_active,
         starts_at, ends_at
       }
       Response: { product }

GET    /api/featured-products/:id
       Response: { product }

PUT    /api/featured-products/:id
       Body: Partial<FeaturedProduct>
       Response: { product }

DELETE /api/featured-products/:id
       Response: { success: true }

PATCH  /api/featured-products/reorder
       Body: { ordered_ids: string[] }
       Response: { success: true }
```

---

### NOTIFICAÇÕES PUSH

```
GET    /api/notifications/push
       Query: ?page=&from=&to=
       Response: { data: PushNotification[], total }

POST   /api/notifications/push
       Body: {
         title, message, image_url?,
         action_type, action_url?,
         target_segment: { plans?, status?, establishment_types?, states?, user_id? },
         scheduled_at?
       }
       Response: { notification, estimated_recipients }

POST   /api/notifications/push/preview
       Body: { target_segment }
       Response: { count: number }  — pré-visualiza quantos usuários serão atingidos

GET    /api/notifications/push/:id
       Response: { notification, delivered_count, opened_count }

DELETE /api/notifications/push/:id
       Response: { success: true }  — cancela agendamento
```

---

### TEMPLATES DE EMAIL

```
GET    /api/notifications/email/templates
       Response: { templates: EmailTemplate[] }

GET    /api/notifications/email/templates/:id
       Response: { template }

PUT    /api/notifications/email/templates/:id
       Body: { subject, body_html, is_active }
       Response: { template }

POST   /api/notifications/email/send
       Body: { template_id?, subject?, body_html?, target: { user_id?, segment? } }
       Response: { sent_count }

GET    /api/notifications/email/logs
       Query: ?page=&template_id=&from=&to=
       Response: { data: EmailLog[], total }
```

---

### ANALYTICS

```
GET    /api/analytics/overview
       Query: ?period=7d|30d|90d
       Response: { dau, wau, mau, avg_session_duration, top_screens }

GET    /api/analytics/users-growth
       Query: ?months=12
       Response: { data: [{ month, new_users, total_users }] }

GET    /api/analytics/conversion-funnel
       Response: {
         registered, trial_active, converted_to_paid,
         rates: { trial_activation, trial_conversion }
       }

GET    /api/analytics/retention
       Response: { d1, d7, d30 }  — cohort retention rates

GET    /api/analytics/features
       Response: { data: [{ feature, usage_count, unique_users, adoption_rate }] }

GET    /api/analytics/top-establishments
       Query: ?metric=appointments|clients|revenue&limit=20&period=
       Response: { data: Establishment[] }
```

---

### CONFIGURAÇÕES DO APP

```
GET    /api/app-config
       Response: { config: AppConfig }

PUT    /api/app-config
       Body: Partial<AppConfig>  — logo, cores, textos, toggles de features
       Response: { config }

GET    /api/app-config/ai
       Response: { model, system_prompt, quick_prompts, enabled_plans }

PUT    /api/app-config/ai
       Body: { model, system_prompt, quick_prompts, enabled_plans }
       Response: { config }

GET    /api/app-config/onboarding
       Response: { steps: OnboardingStep[] }

PUT    /api/app-config/onboarding/:step_id
       Body: { title, description, is_active }
       Response: { step }
```

---

### CONTEÚDO / FAQ

```
GET    /api/content/faq
       Query: ?category=
       Response: { categories, articles: FaqArticle[] }

POST   /api/content/faq
       Body: { title, body, category, is_active }
       Response: { article }

PUT    /api/content/faq/:id
       Body: Partial<FaqArticle>
       Response: { article }

DELETE /api/content/faq/:id
       Response: { success: true }

GET    /api/content/changelog
       Response: { entries: ChangelogEntry[] }

POST   /api/content/changelog
       Body: { title, description, image_url, version, published_at }
       Response: { entry }

PUT    /api/content/changelog/:id
       Body: Partial<ChangelogEntry>
       Response: { entry }
```

---

### EQUIPE ADMINISTRATIVA

```
GET    /api/team
       Response: { admins: AdminUser[] }

POST   /api/team/invite
       Body: { email, name, role, permissions }
       Response: { admin }  — envia email de convite

GET    /api/team/:id
       Response: { admin }

PUT    /api/team/:id
       Body: { name, role, permissions, is_active }
       Response: { admin }

DELETE /api/team/:id
       Response: { success: true }

GET    /api/team/audit-log
       Query: ?page=&admin_id=&from=&to=
       Response: { data: AuditLog[], total }
```

---

### UPLOAD (compartilhado)

```
POST   /api/upload
       Body: FormData { file, folder? }
       Response: { url, id, filename, size }

DELETE /api/upload/:id
       Response: { success: true }
```

---

### ENDPOINT PÚBLICO — Dados para o App Mobile

> Estes endpoints são consumidos pelo **app mobile** (React Native), não pelo portal. Autenticação via JWT do Supabase do usuário final.

```
GET    /api/mobile/ads
       Headers: Authorization: Bearer <supabase_jwt>
       Query: ?establishment_id=&plan=&type=carousel|product_card
       Response: { ads: Ad[] }
       Note: filtra automaticamente por segmentação, período e max_daily_shows

GET    /api/mobile/featured-products
       Headers: Authorization: Bearer <supabase_jwt>
       Query: ?establishment_id=&plan=
       Response: { products: FeaturedProduct[] }

POST   /api/mobile/ads/:id/impression
       Headers: Authorization: Bearer <supabase_jwt>
       Response: { success: true }

POST   /api/mobile/ads/:id/click
       Headers: Authorization: Bearer <supabase_jwt>
       Response: { success: true }

POST   /api/mobile/featured-products/:id/click
       Headers: Authorization: Bearer <supabase_jwt>
       Response: { success: true }
```

---

### VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # somente server-side

# Auth do Portal
PORTAL_JWT_SECRET=                 # para tokens de impersonation
PORTAL_SESSION_DURATION=28800      # 8 horas em segundos

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@appbello.com.br

# Push Notifications
EXPO_ACCESS_TOKEN=                 # para enviar push via Expo

# App
NEXT_PUBLIC_APP_URL=https://admin.appbello.com.br
```
