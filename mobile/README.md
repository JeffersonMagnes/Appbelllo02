# Appbello

Sistema SaaS white-label completo para clínicas, barbearias e salões de beleza, com foco em agendamento online, gestão operacional, financeira e relacionamento com clientes.

## Upload de Imagens (Implementado)

O app agora faz upload real de imagens para o Vibecode Storage CDN via backend:

- **Backend**: `POST /api/upload` — recebe multipart/form-data e envia para `storage.vibecodeapp.com`
- **Utilitário**: `mobile/src/lib/upload.ts` — função `uploadFile(uri, filename, mimeType)` retorna URL CDN
- **Telas atualizadas**:
  - `onboarding/step-4.tsx` — upload de logo do estabelecimento
  - `admin/settings/branding.tsx` — upload de logo nas configurações de marca
  - `admin/employees.tsx` — upload de avatar do funcionário
  - `admin/anamnesis-form.tsx` — upload de fotos antes/depois

Todas as telas mostram `ActivityIndicator` durante o upload e tratam erros com `Alert`.

## Funcionalidades Implementadas

### Dashboard Administrativo (`src/app/(tabs)/index.tsx`)
- Quick actions para acesso rápido às principais funções
- Cards de KPI com mini gráficos de receita semanal
- Barra de progresso de meta mensal
- Preview dos próximos agendamentos
- Alertas de estoque baixo com destaque visual
- Menu organizado por seções (Gestão, Relatórios)
- Animações de entrada suaves

### Agenda (`src/app/(tabs)/appointments.tsx`)
- **3 modos de visualização**: Semana, Mês, Ano
- **Visualização de Semana**: Calendário semanal com indicadores de agendamentos por dia
- **Visualização de Mês**: Calendário mensal completo com grid de dias e indicadores
- **Visualização de Ano**: Mini-calendários de cada mês com preview de dias e contagem de agendamentos
- Filtro por profissional com avatares
- Navegação fluida entre períodos (semana, mês, ano)
- Feedback háptico em todas as interações
- Animações suaves com react-native-reanimated
- Status visuais por cor (confirmado, pendente, cancelado)
- Cards de agendamento com borda colorida por status
- Empty states com CTAs

### Gestão de Clientes (`src/app/admin/clients.tsx`)
- Cadastro completo de clientes
- Busca por nome, telefone ou email
- Ficha de anamnese para cada cliente
- Histórico de atendimentos
- Estatísticas (total, com anamnese, novos do mês)

### Gestão Financeira (`src/app/admin/financial.tsx`)
- Resumo de entradas e saídas
- Lucro líquido do período
- Filtro por período (dia, semana, mês)
- Breakdown por método de pagamento (PIX, cartão, dinheiro)
- Lista de todas as transações

### Funcionários & Comissão (`src/app/admin/employees.tsx`)
- Cadastro completo de funcionários com foto, nome, email, telefone
- Definição de cargo (Profissional, Recepcionista, Admin)
- Especialidade e serviços realizados
- Comissão (fixa ou percentual)
- Cálculo automático de comissões
- Gerenciamento de acesso ao app
- Modal de criação com layout otimizado

### Acesso de Funcionários (`src/app/admin/employee-access.tsx`)
- Sistema de permissões granular (8 tipos de permissão)
- Login por PIN de 4 dígitos
- Presets rápidos: "Apenas Agenda" ou "Acesso Total"
- Controle de ativação/desativação de acesso
- Reset de PIN
- Copiar PIN para compartilhamento

### Sistema de Autenticação (`src/lib/state/auth-store.ts`)
- Zustand store para gerenciamento de autenticação
- Login como Proprietário (acesso completo)
- Login como Funcionário (acesso limitado por permissões)
- Verificação de permissões em tempo real

### Tela de Login (`src/app/login.tsx`)
- Seleção de tipo de usuário (Proprietário ou Funcionário)
- Teclado numérico para PIN do funcionário
- Animação de shake em PIN inválido
- Feedback háptico

### Home do Funcionário (`src/app/employee-home.tsx`)
- Dashboard limitado para funcionários
- Agenda do dia com detalhes dos agendamentos
- Próximos 7 dias de compromissos
- Aviso de acesso limitado
- Logout

### Controle de Caixa (`src/app/admin/cash-register.tsx`)
- Abertura e fechamento de caixa
- Registro de sangrias e reforços
- Saldo em tempo real
- Vendas por método de pagamento (Dinheiro, PIX, Cartão)
- Histórico de movimentações do dia
- Resumo completo ao fechar o caixa

### Produtos & Estoque (`src/app/admin/products.tsx`)
- Catálogo de produtos por categoria
- Controle de estoque com alertas visuais
- Preço de custo, venda e margem de lucro
- Filtro por estoque baixo

### Comandas (`src/app/admin/comandas.tsx`)
- Abertura de comandas por cliente
- Adição de serviços e produtos
- Status (aberta, fechada, paga)
- Total em aberto e ações rápidas

### Relatórios & Performance (`src/app/admin/reports.tsx`)
- Resumo Financeiro (receitas, despesas, lucro)
- Ranking de performance da equipe
- Serviços mais populares
- Melhores clientes
- Estatísticas gerais
- Breakdown por método de pagamento
- Ações rápidas para Controle de Caixa e Financeiro

### Booking Flow (`src/app/booking.tsx`)
- Fluxo de agendamento em 4 etapas
- Progress indicator visual
- Seleção de serviço, profissional, data e horário
- Resumo de confirmação

### Onboarding de Estabelecimento (`src/app/onboarding/`)
Fluxo completo de cadastro para novos estabelecimentos:

**Etapa 1 - Criar Conta** (`step-1.tsx`)
- Nome completo, e-mail, senha
- Validação em tempo real
- Checkbox de aceite dos termos

**Etapa 2 - Dados do Estabelecimento** (`step-2.tsx`)
- Nome do estabelecimento
- Tipo de negócio (Clínica, Barbearia, Salão)
- CNPJ opcional, telefone/WhatsApp, e-mail comercial

**Etapa 3 - Endereço** (`step-3.tsx`)
- CEP com auto-complete via ViaCEP
- Campos de endereço completo
- Preview visual do endereço

**Etapa 4 - Identidade Visual** (`step-4.tsx`)
- Upload de logo
- Seleção de cor principal e secundária
- Preview do portal de agendamento

**Etapa 5 - Configurações Iniciais** (`step-5.tsx`)
- Horário de funcionamento
- Dias de atendimento (seleção visual)
- Intervalo/pausa
- Política de cancelamento
- Duração padrão dos serviços

**Etapa 6 - Primeiro Profissional** (`step-6.tsx`)
- Nome e função
- Serviços que realiza (seleção múltipla + customização)
- Comissão (percentual ou fixa)
- Horário de trabalho

**Etapa 7 - Conclusão** (`step-7.tsx`)
- Mensagem de sucesso animada
- Link de agendamento copiável
- Quick actions para próximos passos
- Compartilhamento do link

**Componentes de Onboarding** (`src/components/onboarding/`)
- `OnboardingHeader` - Progress bar animada, navegação
- `OnboardingFooter` - Botões de ação fixos

**Store de Estado** (`src/lib/state/onboarding-store.ts`)
- Zustand store para gerenciar todos os dados do fluxo
- Persistência entre etapas
- Reset ao finalizar

## Sistema de Design (UI Components)

### Componentes Reutilizáveis (`src/components/ui/`)
- **Button** - Variantes: primary, secondary, outline, ghost, danger
- **Card** - StatCard, ListItemCard com animações
- **Input** - SearchInput, Select com estados de foco
- **Badge** - StatusBadge com cores semânticas
- **Skeleton** - Loading states para listas e cards
- **EmptyState** - Estados vazios com CTAs
- **ProgressBar** - Barras de progresso animadas

### Sistema de Tema (`src/lib/theme.ts`)
- Suporte a white-label (cores customizáveis)
- Tema escuro e claro
- Status colors padronizados
- Payment method colors

## Estrutura de Dados

- `src/lib/types.ts` - Tipos TypeScript completos
- `src/lib/theme.ts` - Sistema de cores e temas
- `src/lib/mockData.ts` - Dados de exemplo + funções de cálculo

## Paleta de Cores (Kinsta)

| Cor | Código | Uso |
|-----|--------|-----|
| Primary | #5333ed | Ações principais, destaques |
| Secondary | #2cd4d9 | Valores, sucesso |
| Background | #0F0A1F | Fundo principal |
| Cards | #231A3A | Cards e superfícies |
| Success | #10B981 | Confirmado, positivo |
| Warning | #F59E0B | Pendente, alerta |
| Error | #EF4444 | Cancelado, erro |

## Melhorias de UX Aplicadas

- Feedback visual para todas as ações
- Animações suaves com react-native-reanimated
- Empty states informativos com sugestões
- Skeleton loading para carregamento
- Filtros rápidos e intuitivos
- Cores semânticas para status
- Touch targets adequados para mobile
- Navegação simplificada

## Próximos Passos

- [ ] Integração com backend (Supabase/Firebase)
- [ ] Notificações push
- [ ] Integração com WhatsApp API
- [ ] Gestão de fornecedores
- [ ] Pacotes de serviços
- [ ] Portal de agendamento do cliente
