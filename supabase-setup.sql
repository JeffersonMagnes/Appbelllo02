-- =====================================================
-- ⚠️ ARQUIVO DESATUALIZADO — NÃO EXECUTAR CONTRA O BANCO DE PRODUÇÃO ⚠️
--
-- Este script é o setup histórico inicial do banco. As tabelas/colunas
-- adicionadas depois (app_settings, service_packages, employee_permissions,
-- offers, colunas de imagem/venda online em produtos, demo_data_flag,
-- web_push_subscription, fix no schema de comandas) NÃO estão refletidas
-- aqui — elas vivem em supabase/migrations/.
--
-- O bloco "REMOVER TABELAS ANTIGAS" abaixo dropa e recria as tabelas
-- centrais (profiles, establishments, appointments, products, etc.) —
-- rodar isso contra um banco com dados reais APAGA esses dados.
--
-- Fonte da verdade atual: supabase/migrations/*.sql
-- =====================================================

-- =====================================================
-- APPBELLO - SETUP COMPLETO DO BANCO DE DADOS (HISTÓRICO)
-- Execute no SQL Editor: https://supabase.com/dashboard/project/rfuvtsnnmoovscdteqnx/sql
-- =====================================================

-- Extensão UUID
create extension if not exists "uuid-ossp";

-- =====================================================
-- REMOVER TABELAS ANTIGAS (ordem inversa de dependências)
-- =====================================================
drop table if exists public.professional_services cascade;
drop table if exists public.transactions cascade;
drop table if exists public.appointments cascade;
drop table if exists public.products cascade;
drop table if exists public.clients cascade;
drop table if exists public.services cascade;
drop table if exists public.service_categories cascade;
drop table if exists public.employees cascade;
drop table if exists public.professionals cascade;
drop table if exists public.establishments cascade;
drop table if exists public.profiles cascade;

-- =====================================================
-- TABELAS
-- =====================================================

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  created_at timestamptz default now()
);

create table public.establishments (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  slug text,
  logo_url text,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  whatsapp text,
  instagram text,
  business_type text not null default 'salon',
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.professionals (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments on delete cascade not null,
  name text not null,
  avatar text,
  specialty text,
  rating numeric default 5.0,
  review_count integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table public.service_categories (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments on delete cascade not null,
  name text not null,
  icon text,
  created_at timestamptz default now()
);

create table public.services (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments on delete cascade not null,
  category text,
  name text not null,
  description text,
  duration integer not null default 30,
  price numeric not null default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table public.professional_services (
  professional_id uuid references public.professionals on delete cascade,
  service_id uuid references public.services on delete cascade,
  primary key (professional_id, service_id)
);

create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments on delete cascade not null,
  name text not null,
  email text,
  phone text,
  avatar_url text,
  birth_date date,
  notes text,
  created_at timestamptz default now()
);

create table public.employees (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments on delete cascade not null,
  name text not null,
  avatar_url text,
  role text default 'professional' check (role in ('admin', 'receptionist', 'professional')),
  specialty text,
  phone text,
  email text,
  pin text,
  commission_type text default 'percentage' check (commission_type in ('fixed', 'percentage')),
  commission_value numeric default 0,
  active boolean default true,
  hire_date date,
  created_at timestamptz default now()
);

create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments on delete cascade not null,
  client_id uuid references public.clients on delete set null,
  employee_id uuid references public.employees on delete set null,
  service_id uuid references public.services on delete set null,
  date date not null,
  time text not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  client_name text,
  created_at timestamptz default now()
);

create table public.products (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments on delete cascade not null,
  name text not null,
  description text,
  price numeric not null default 0,
  cost_price numeric default 0,
  stock integer default 0,
  min_stock integer default 5,
  category text,
  active boolean default true,
  image_url text,
  sell_online boolean default false,
  created_at timestamptz default now()
);

create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments on delete cascade not null,
  type text not null check (type in ('income', 'expense', 'receita', 'despesa')),
  category text,
  description text,
  amount numeric not null,
  payment_method text check (payment_method in ('cash', 'credit', 'debit', 'pix', 'transfer', 'dinheiro', 'credito', 'debito', 'outro')),
  date date not null,
  employee_id uuid references public.employees on delete set null,
  client_id uuid references public.clients on delete set null,
  status text default 'paid' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz default now()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
alter table public.profiles enable row level security;
alter table public.establishments enable row level security;
alter table public.professionals enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.professional_services enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.employees enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;

-- =====================================================
-- FUNÇÃO: retorna establishment_id do usuário logado
-- =====================================================
create or replace function public.get_user_establishment_id()
returns uuid language sql security definer stable as $$
  select id from public.establishments where owner_id = auth.uid() limit 1;
$$;

-- =====================================================
-- POLÍTICAS DE ACESSO
-- =====================================================

-- Profiles
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Establishments
drop policy if exists "establishments_all" on public.establishments;
create policy "establishments_all" on public.establishments for all using (owner_id = auth.uid());

-- Professionals
drop policy if exists "professionals_all" on public.professionals;
create policy "professionals_all" on public.professionals
  for all using (establishment_id = get_user_establishment_id());

-- Service Categories
drop policy if exists "service_categories_all" on public.service_categories;
create policy "service_categories_all" on public.service_categories
  for all using (establishment_id = get_user_establishment_id());

-- Services
drop policy if exists "services_all" on public.services;
create policy "services_all" on public.services
  for all using (establishment_id = get_user_establishment_id());

-- Professional Services
drop policy if exists "professional_services_all" on public.professional_services;
create policy "professional_services_all" on public.professional_services
  for all using (
    professional_id in (
      select id from public.professionals where establishment_id = get_user_establishment_id()
    )
  );

-- Clients
drop policy if exists "clients_all" on public.clients;
create policy "clients_all" on public.clients
  for all using (establishment_id = get_user_establishment_id());

-- Appointments
drop policy if exists "appointments_all" on public.appointments;
create policy "appointments_all" on public.appointments
  for all using (establishment_id = get_user_establishment_id());

-- Employees
drop policy if exists "employees_all" on public.employees;
create policy "employees_all" on public.employees
  for all using (establishment_id = get_user_establishment_id());

-- Products
drop policy if exists "products_all" on public.products;
create policy "products_all" on public.products
  for all using (establishment_id = get_user_establishment_id());

-- Transactions
drop policy if exists "transactions_all" on public.transactions;
create policy "transactions_all" on public.transactions
  for all using (establishment_id = get_user_establishment_id());

-- =====================================================
-- TRIGGER: cria perfil automaticamente ao criar conta
-- =====================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- TRIGGER: atualiza updated_at em establishments
-- =====================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists establishments_updated_at on public.establishments;
create trigger establishments_updated_at
  before update on public.establishments
  for each row execute procedure public.handle_updated_at();

-- =====================================================
-- FUNÇÃO ADMIN: retorna todos os usuários/estabelecimentos
-- Usa security definer para bypassar RLS (só para o portal admin)
-- =====================================================
drop function if exists public.get_admin_establishments();
create or replace function public.get_admin_establishments()
returns table (
  id uuid,
  owner_id uuid,
  establishment_name text,
  logo_url text,
  business_type text,
  phone text,
  address text,
  active boolean,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  professionals_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    e.id,
    e.owner_id,
    e.name           as establishment_name,
    e.logo_url,
    e.business_type,
    e.phone,
    e.address,
    e.active,
    e.created_at,
    coalesce(p.name, '') as owner_name,
    coalesce(p.email, '') as owner_email,
    count(pr.id)     as professionals_count
  from public.establishments e
  left join public.profiles p on p.id = e.owner_id
  left join public.professionals pr
         on pr.establishment_id = e.id and pr.active = true
  group by e.id, p.name, p.email
  order by e.created_at desc
$$;

revoke all on function public.get_admin_establishments() from public, anon, authenticated;

-- =====================================================
-- POLÍTICAS PÚBLICAS — Link de Agendamento
-- Permitem leitura pública de estabelecimentos ativos
-- e inserção de agendamentos via link público
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Estabelecimentos: leitura pública (necessário para buscar por slug)
drop policy if exists "establishments_public_select" on public.establishments;
create policy "establishments_public_select" on public.establishments
  for select using (active = true);

-- Serviços: leitura pública de estabelecimentos ativos
drop policy if exists "services_public_select" on public.services;
create policy "services_public_select" on public.services
  for select using (
    establishment_id in (select id from public.establishments where active = true)
    and active = true
  );

-- Profissionais: leitura pública de estabelecimentos ativos
drop policy if exists "professionals_public_select" on public.professionals;
create policy "professionals_public_select" on public.professionals
  for select using (
    establishment_id in (select id from public.establishments where active = true)
    and active = true
  );

-- Clientes: inserção pública (criado durante booking) + leitura para checar duplicata
drop policy if exists "clients_public_insert" on public.clients;
create policy "clients_public_insert" on public.clients
  for insert with check (
    establishment_id in (select id from public.establishments where active = true)
  );

drop policy if exists "clients_public_select" on public.clients;

-- Agendamentos: inserção pública via link de agendamento
drop policy if exists "appointments_public_insert" on public.appointments;
create policy "appointments_public_insert" on public.appointments
  for insert with check (
    establishment_id in (select id from public.establishments where active = true)
  );

-- =====================================================
-- Push Notifications — token do dispositivo
-- =====================================================
alter table public.profiles add column if not exists push_token text;

-- Política para o próprio usuário atualizar seu token
drop policy if exists "profiles_push_token_update" on public.profiles;
create policy "profiles_push_token_update" on public.profiles
  for update using (auth.uid() = id);

-- =====================================================
-- CORRIGE SLUGS: atualiza estabelecimentos sem slug
-- Execute no SQL Editor do Supabase
-- =====================================================
update public.establishments
set slug = regexp_replace(
  regexp_replace(
    lower(unaccent(name)),
    '[^a-z0-9]+', '-', 'g'
  ),
  '^-|-$', '', 'g'
) || '-' || substr(owner_id::text, 1, 6)
where slug is null or slug = '';

-- Atualiza get_admin_establishments para incluir slug
drop function if exists public.get_admin_establishments();
create or replace function public.get_admin_establishments()
returns table (
  id uuid,
  owner_id uuid,
  establishment_name text,
  slug text,
  logo_url text,
  business_type text,
  phone text,
  address text,
  active boolean,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  professionals_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    e.id, e.owner_id,
    e.name           as establishment_name,
    e.slug,
    e.logo_url, e.business_type, e.phone, e.address,
    e.active, e.created_at,
    coalesce(p.name, '')  as owner_name,
    coalesce(p.email, '') as owner_email,
    count(pr.id)          as professionals_count
  from public.establishments e
  left join public.profiles p on p.id = e.owner_id
  left join public.professionals pr
         on pr.establishment_id = e.id and pr.active = true
  group by e.id, p.name, p.email
  order by e.created_at desc
$$;

revoke all on function public.get_admin_establishments() from public, anon, authenticated;

-- =====================================================
-- FASE 2: NOVAS COLUNAS E TABELAS (PARIDADE MOBILE)
-- =====================================================

-- Colunas novas em establishments
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#5333ED';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#0BBDB6';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS hours_json JSONB;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'trial';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS cancellation_policy INTEGER DEFAULT 2;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS default_service_duration INTEGER DEFAULT 30;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS bio VARCHAR(160);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS custom_links JSONB DEFAULT '[]';
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS monthly_goal DECIMAL(10,2);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS payment_fees JSONB;

-- Tabela de comandas
CREATE TABLE IF NOT EXISTS comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  client_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'open',
  total DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS comanda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID REFERENCES comandas(id) ON DELETE CASCADE,
  type VARCHAR(10) DEFAULT 'service',
  service_id UUID REFERENCES services(id),
  product_id UUID REFERENCES products(id),
  description VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  employee_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de anamnese
CREATE TABLE IF NOT EXISTS anamnesis_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anamnesis_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES anamnesis_templates(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(100),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "owner_comandas" ON comandas;
CREATE POLICY "owner_comandas" ON comandas
  FOR ALL USING (establishment_id IN (SELECT id FROM establishments WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "owner_comanda_items" ON comanda_items;
CREATE POLICY "owner_comanda_items" ON comanda_items
  FOR ALL USING (comanda_id IN (SELECT id FROM comandas WHERE establishment_id IN (SELECT id FROM establishments WHERE owner_id = auth.uid())));

DROP POLICY IF EXISTS "owner_anamnesis_templates" ON anamnesis_templates;
CREATE POLICY "owner_anamnesis_templates" ON anamnesis_templates
  FOR ALL USING (establishment_id IN (SELECT id FROM establishments WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "owner_anamnesis_submissions" ON anamnesis_submissions;
CREATE POLICY "owner_anamnesis_submissions" ON anamnesis_submissions
  FOR ALL USING (establishment_id IN (SELECT id FROM establishments WHERE owner_id = auth.uid()));

-- Leitura pública de templates ativos (para a página de anamnese pública)
DROP POLICY IF EXISTS "public_read_anamnesis_templates" ON anamnesis_templates;
CREATE POLICY "public_read_anamnesis_templates" ON anamnesis_templates
  FOR SELECT USING (active = true);

-- Inserção pública de respostas
DROP POLICY IF EXISTS "public_insert_anamnesis_submissions" ON anamnesis_submissions;
CREATE POLICY "public_insert_anamnesis_submissions" ON anamnesis_submissions
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- CONFIGURAÇÕES GLOBAIS DO APP (app_settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sem RLS: acessada apenas via service role key no backend admin
-- Seed: valores padrão de notificações
INSERT INTO public.app_settings (key, value)
VALUES (
  'notifications',
  '{"trialReminder3": true, "trialReminder1": true, "paymentFailed": true, "weeklyReport": false, "newFeature": true, "partnerOffer": true}'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value)
VALUES (
  'geral',
  '{"appName": "AppBello", "supportEmail": "suporte@appbello.com.br", "supportPhone": "(11) 4000-0000", "trialDays": 14, "maintenanceMode": false}'
)
ON CONFLICT (key) DO NOTHING;
