# Appbello — Documentação para Criação do Site (bolt.new)

## Visão Geral do Projeto

**Appbello** é uma plataforma SaaS completa de gestão para salões de beleza, barbearias e clínicas estéticas. O aplicativo mobile (React Native/Expo) já existe e usa **Supabase** como backend.

O site a ser criado no bolt.new deve ter:
1. **Landing Page** — página de marketing para atrair novos clientes
2. **Portal de Autenticação** — cadastro e login que funcionam com o mesmo banco Supabase do app mobile
3. **Dashboard Web** — painel de controle acessível via navegador (mesmas funcionalidades do app mobile)
4. **API REST** — endpoints para integração com o app mobile e terceiros

---

## Stack Tecnológica Recomendada

```
Framework:     Next.js 14+ (App Router)
Linguagem:     TypeScript
Estilização:   Tailwind CSS + shadcn/ui
Auth/DB:       Supabase (@supabase/supabase-js + @supabase/ssr)
Estado:        Zustand ou React Query (@tanstack/react-query)
Formulários:   React Hook Form + Zod
Animações:     Framer Motion
Ícones:        Lucide React
Deploy:        Vercel
```

---

## Variáveis de Ambiente

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui   # apenas server-side
NEXT_PUBLIC_APP_URL=https://appbello.com.br
```

> **Importante:** Use as mesmas credenciais Supabase do app mobile. Isso permite que o cadastro feito no site seja usado no app e vice-versa.

---

## Identidade Visual

```
Nome:          Appbello
Tagline:       "Gerencie seu salão com inteligência"
Cor Primária:  #5333ED  (roxo vibrante)
Cor Secundária:#A855F7  (roxo claro)
Cor Acento:    #EC4899  (rosa)
Background:    #F9FAFB  (cinza muito claro)
Texto:         #111827  (cinza escuro)
Gradiente:     linear-gradient(135deg, #5333ED, #A855F7)
Fonte:         Outfit (Google Fonts) — weights: 400, 600, 700, 800
Border Radius: arredondado (rounded-2xl padrão)
```

---

## Estrutura de Páginas

### 1. Landing Page (`/`)

**Seções (de cima para baixo):**

#### Hero
- Navbar com logo Appbello, links (Recursos, Preços, Entrar) e botão "Começar grátis"
- Título grande: **"Gerencie seu salão com inteligência"**
- Subtítulo: *"Agendamentos, clientes, financeiro e muito mais. Tudo em um lugar."*
- Botões: "Começar grátis" (primário) + "Ver demonstração" (secundário)
- Mockup do app mobile ao lado (imagem ou vídeo)
- Fundo com gradiente suave roxo/rosa

#### Logos de Confiança
- "Mais de 500 salões confiam no Appbello"
- Ícones/logos fictícios de parceiros

#### Funcionalidades (grid 3 colunas)
```
📅 Agenda Inteligente       — Visualização por dia, semana e mês
👥 Gestão de Clientes       — CRM completo com histórico
💰 Controle Financeiro      — Receitas, despesas e relatórios
✂️ Catálogo de Serviços     — Preços, durações e categorias
👩‍💼 Gestão de Funcionários  — Comissões, horários e acesso
📦 Controle de Estoque      — Produtos e fornecedores
🤖 Assistente IA            — Conselhos de negócio com Claude AI
📊 Relatórios               — Métricas e insights do seu negócio
```

#### Como Funciona (3 passos)
1. Crie sua conta gratuitamente
2. Configure seu estabelecimento
3. Comece a agendar e gerenciar

#### Depoimentos (3 cards)
- Depoimentos fictícios de donos de salão

#### Planos e Preços (3 cards)
```
Grátis:        R$ 0/mês   — até 50 agendamentos/mês, 1 profissional
Profissional:  R$ 49/mês  — ilimitado, até 5 profissionais, relatórios
Empresarial:   R$ 99/mês  — tudo incluso, multi-estabelecimento, IA
```

#### CTA Final
- "Comece hoje mesmo, grátis"
- Campo de email + botão "Criar conta"

#### Footer
- Links: Sobre, Recursos, Preços, Contato, Privacidade, Termos
- Copyright © 2025 Appbello

---

### 2. Autenticação

#### `/login` — Login
```tsx
// Campos:
- Email
- Senha
- Botão "Entrar"
- Link "Esqueci minha senha"
- Link "Criar conta"
- Separador "ou"
- Botão "Entrar com Google" (opcional)

// Lógica:
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()
await supabase.auth.signInWithPassword({ email, password })
// Após login, redirecionar para /dashboard
```

#### `/cadastro` — Cadastro
```tsx
// Campos:
- Nome completo
- Email
- Senha (mín. 8 chars)
- Confirmar senha
- Nome do estabelecimento
- Tipo de negócio (select: Salão, Barbearia, Clínica Estética, Spa, Outro)
- Checkbox aceitar termos
- Botão "Criar conta grátis"

// Lógica:
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { name, establishmentName, businessType } }
})

// Após signup, criar registro na tabela establishments:
await supabase.from('establishments').insert({
  owner_id: data.user.id,
  name: establishmentName,
  business_type: businessType,
  active: true
})

// Redirecionar para /dashboard/onboarding
```

#### `/recuperar-senha` — Recuperação de Senha
```tsx
// Campos:
- Email
- Botão "Enviar link de recuperação"

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/nova-senha`
})
```

#### `/nova-senha` — Definir Nova Senha
```tsx
// Campos:
- Nova senha
- Confirmar nova senha

// Pegar tokens da URL hash (Supabase redireciona com #access_token=...)
await supabase.auth.updateUser({ password: novaSenha })
```

---

### 3. Dashboard Web (`/dashboard/*`)

> Protegido por autenticação. Usar middleware Next.js para verificar sessão.

#### `/dashboard` — Início
- Cards de resumo: agendamentos hoje, clientes totais, receita do mês, serviços ativos
- Gráfico de receita semanal/mensal (Recharts)
- Lista dos próximos agendamentos do dia
- Atividade recente

#### `/dashboard/agenda` — Agenda
- Calendário visual (FullCalendar ou react-big-calendar)
- Visualização: dia, semana, mês
- Criar/editar/cancelar agendamentos
- Filtro por profissional
- Cor por status: pendente (amarelo), confirmado (verde), cancelado (vermelho)

#### `/dashboard/clientes` — Clientes
- Tabela com busca e filtros
- Criar/editar/excluir clientes
- Ver histórico de agendamentos por cliente
- Campos: nome, email, telefone, data de nascimento, observações

#### `/dashboard/servicos` — Serviços
- Lista de serviços com preço e duração
- Categorias de serviços
- Criar/editar/desativar serviços

#### `/dashboard/equipe` — Equipe
- Lista de funcionários
- Criar/editar funcionários
- Roles: admin, recepcionista, profissional
- Comissões (fixo ou percentual)
- PIN de acesso para app mobile

#### `/dashboard/financeiro` — Financeiro
- Resumo: receitas, despesas, lucro líquido
- Gráfico por período
- Lista de transações
- Filtros: tipo (receita/despesa), método de pagamento, data

#### `/dashboard/produtos` — Estoque
- Lista de produtos com estoque
- Alertas de estoque mínimo
- Criar/editar produtos

#### `/dashboard/configuracoes` — Configurações
- Dados do estabelecimento (nome, endereço, telefone, logo)
- Upload de logo
- Horários de funcionamento
- Link de agendamento público

---

## Banco de Dados Supabase (Schema Existente)

> **Não criar tabelas novas.** Usar as tabelas que já existem no projeto Supabase do app mobile.

```sql
-- TABELAS EXISTENTES:

profiles            -- Perfis de usuário (id, name, email)
establishments      -- Estabelecimentos (owner_id, name, logo_url, address, phone, active)
services            -- Serviços (establishment_id, name, price, duration, category, active)
service_categories  -- Categorias (establishment_id, name, icon)
professionals       -- Profissionais (establishment_id, name, specialty, avatar, rating)
professional_services -- Relação profissional↔serviço
clients             -- Clientes (establishment_id, name, email, phone, birth_date, notes)
appointments        -- Agendamentos (establishment_id, client_id, employee_id, service_id, date, time, status)
employees           -- Funcionários (establishment_id, name, role, specialty, commission_type, commission_value, pin)
products            -- Produtos (establishment_id, name, price, cost_price, stock, min_stock)
transactions        -- Transações financeiras (establishment_id, type, amount, date, payment_method)
```

### Row Level Security (RLS)
Todas as tabelas têm RLS ativo. Cada dono só vê dados do seu estabelecimento via `owner_id`. O site deve usar o client Supabase autenticado (não service role) para as queries do dashboard.

---

## API REST

Criar em `app/api/` (Next.js Route Handlers) para integração com o app mobile e terceiros.

### Autenticação da API
Todas as rotas privadas devem verificar o Bearer token Supabase:
```typescript
// lib/api-auth.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getAuthUser() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  return session.user
}
```

### Endpoints da API

#### Health Check
```
GET /api/health
Response: { status: "ok", timestamp: "..." }
```

#### Estabelecimento
```
GET    /api/establishment          — Dados do estabelecimento do usuário logado
PUT    /api/establishment          — Atualizar dados do estabelecimento
```

#### Agendamentos
```
GET    /api/appointments?date=YYYY-MM-DD   — Listar (filtro opcional por data)
POST   /api/appointments                   — Criar agendamento
PUT    /api/appointments/:id               — Atualizar status
DELETE /api/appointments/:id               — Cancelar
```

#### Clientes
```
GET    /api/clients                — Listar clientes
POST   /api/clients                — Criar cliente
PUT    /api/clients/:id            — Atualizar cliente
DELETE /api/clients/:id            — Excluir cliente
```

#### Serviços
```
GET    /api/services               — Listar serviços ativos
POST   /api/services               — Criar serviço
PUT    /api/services/:id           — Atualizar serviço
DELETE /api/services/:id           — Desativar serviço
```

#### Funcionários
```
GET    /api/employees              — Listar funcionários
POST   /api/employees              — Criar funcionário
PUT    /api/employees/:id          — Atualizar funcionário
```

#### Agendamento Público (sem auth)
```
GET  /api/public/booking/:slug     — Dados públicos do estabelecimento + serviços + profissionais
POST /api/public/booking           — Criar agendamento público (cliente externo)
Body: { establishment_id, service_id, employee_id, date, time, client_name, client_phone }
```

#### Dashboard Stats
```
GET /api/stats?period=today|week|month
Response: {
  appointments: { total, pending, confirmed, completed, cancelled },
  revenue: { total, byPaymentMethod: [...] },
  clients: { total, new },
  topServices: [{ name, count, revenue }]
}
```

### Exemplo de Route Handler
```typescript
// app/api/appointments/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  // Buscar o establishment do usuário logado
  const { data: establishment } = await supabase
    .from('establishments')
    .select('id')
    .eq('owner_id', session.user.id)
    .single()

  if (!establishment) {
    return NextResponse.json({ error: 'Establishment not found' }, { status: 404 })
  }

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('establishment_id', establishment.id)
    .order('date')
    .order('time')

  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('appointments')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

---

## Middleware de Autenticação

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                     req.nextUrl.pathname.startsWith('/cadastro')
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')

  if (isDashboard && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/cadastro']
}
```

---

## Página de Agendamento Público

**Rota:** `/agendar/:slug`

Esta página permite que clientes finais agendem online sem precisar de conta:

```
1. Exibe nome, logo e informações do salão
2. Lista serviços disponíveis (com preço e duração)
3. Seleciona profissional (filtra por serviço)
4. Escolhe data e horário disponível
5. Preenche nome e telefone
6. Confirma o agendamento
7. Mostra tela de sucesso com resumo
```

Buscar slug da tabela `establishments` (coluna `slug`).

---

## Integrações

### Upload de Imagens (Logo do Estabelecimento)
```typescript
// Usar Supabase Storage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`logos/${establishmentId}`, file, { upsert: true })

const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`logos/${establishmentId}`)

// Salvar publicUrl na tabela establishments
```

### Email Transacional (opcional)
- Confirmar agendamento para clientes
- Usar Resend (resend.com) ou Nodemailer
- Configurar via variável `RESEND_API_KEY`

---

## Observações Finais

1. **Mesmo Supabase:** O site e o app mobile usam o mesmo banco. Um usuário que cria conta no site pode usar o app mobile com o mesmo email/senha e verá os mesmos dados.

2. **RLS já configurado:** Não precisa criar policies de segurança — as do app mobile já protegem os dados.

3. **Sem conflito de dados:** O site deve sempre filtrar por `establishment_id` do usuário logado para evitar vazamento de dados entre estabelecimentos.

4. **Idioma:** Todo o conteúdo em **Português Brasileiro (pt-BR)**. Datas no formato DD/MM/AAAA.

5. **Responsivo:** O site deve funcionar bem em mobile e desktop.

6. **Modo escuro:** Opcional, mas desejável.
