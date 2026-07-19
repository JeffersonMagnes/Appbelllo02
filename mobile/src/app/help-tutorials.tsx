import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft2, Calendar, DollarCircle, Profile2User, Scissor, ClipboardText,
  Box, Setting2, MagicStar, Link2, Chart, UserTick, CloseCircle,
  ArrowRight2, TickCircle, Wallet, ShoppingBag, Notification,
} from 'iconsax-react-native';
import { colors } from '@/lib/theme';

interface TutorialStep {
  text: string;
}

interface Tutorial {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  steps: TutorialStep[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'agenda',
    icon: <Calendar size={22} color="#5333ED" variant="Outline" />,
    title: 'Agenda',
    description: 'Como gerenciar seus agendamentos',
    color: '#5333ED',
    steps: [
      { text: 'Na tela principal, toque em "Agenda" ou na aba "Agenda" na barra inferior.' },
      { text: 'Você verá seus agendamentos organizados por Semana, Mês ou Ano. Use os botões no topo para trocar a visualização.' },
      { text: 'Toque em qualquer agendamento para ver os detalhes: cliente, serviço, horário e profissional.' },
      { text: 'No detalhe, você pode alterar o status (Confirmado, Pendente, Concluído, Cancelado).' },
      { text: 'Para marcar como concluído, selecione a forma de pagamento (PIX, Crédito, Débito, Dinheiro) e confirme.' },
      { text: 'Use o filtro de profissional no topo para ver apenas os agendamentos de um profissional específico.' },
      { text: 'Toque no botão "+" para criar um novo agendamento manualmente.' },
    ],
  },
  {
    id: 'clientes',
    icon: <Profile2User size={22} color="#0BBDB6" variant="Outline" />,
    title: 'Clientes',
    description: 'Cadastro e gestão de clientes',
    color: '#0BBDB6',
    steps: [
      { text: 'Acesse "Clientes" pelo menu principal ou ações rápidas.' },
      { text: 'Veja a lista completa de clientes. Use a busca para encontrar por nome, telefone ou e-mail.' },
      { text: 'Toque no botão "+" para cadastrar um novo cliente com nome, telefone, e-mail e data de nascimento.' },
      { text: 'Use as abas no topo: Todos, Retornos (frequentes), Sumidos (inativos), Aniversários e Fichas (anamnese).' },
      { text: 'Toque em um cliente para ver o histórico de atendimentos, pacotes e ficha de anamnese.' },
      { text: 'Em cada cliente, você pode ligar, enviar WhatsApp ou SMS diretamente.' },
    ],
  },
  {
    id: 'servicos',
    icon: <Scissor size={22} color="#7C3AED" variant="Outline" />,
    title: 'Serviços e Pacotes',
    description: 'Cadastrar serviços e criar pacotes',
    color: '#7C3AED',
    steps: [
      { text: 'Acesse a aba "Serviços" na barra inferior.' },
      { text: 'Veja todos os serviços cadastrados com preço, duração e categoria.' },
      { text: 'Toque no "+" para adicionar um novo serviço. Informe nome, preço, duração e categoria.' },
      { text: 'Mude para a aba "Pacotes" para criar pacotes promocionais com vários serviços.' },
      { text: 'Em cada pacote, defina o preço, quantidade de sessões, validade e desconto.' },
    ],
  },
  {
    id: 'financeiro',
    icon: <DollarCircle size={22} color="#F59E0B" variant="Outline" />,
    title: 'Financeiro',
    description: 'Controle de receitas e despesas',
    color: '#F59E0B',
    steps: [
      { text: 'Acesse "Financeiro" pelo menu de Gestão na tela principal.' },
      { text: 'Veja o resumo: receitas, despesas, taxas e lucro líquido.' },
      { text: 'Filtre por período: Hoje, Semana ou Mês.' },
      { text: 'Alterne entre Receitas e Despesas usando os botões de filtro.' },
      { text: 'Veja o detalhamento por forma de pagamento (PIX, Crédito, Débito, Dinheiro).' },
      { text: 'As taxas são calculadas automaticamente conforme configurado em Configurações > Taxas.' },
    ],
  },
  {
    id: 'comandas',
    icon: <ClipboardText size={22} color="#EC4899" variant="Outline" />,
    title: 'Comandas',
    description: 'Abrir, adicionar itens e fechar comandas',
    color: '#EC4899',
    steps: [
      { text: 'Acesse "Comandas" pelo menu de Gestão.' },
      { text: 'Toque em "Nova Comanda" para abrir uma nova conta.' },
      { text: 'Informe o nome do cliente (opcional) e adicione itens: serviços ou produtos.' },
      { text: 'Para fechar, toque na comanda e selecione "Pagar".' },
      { text: 'Escolha desconto (percentual ou fixo) e divida o pagamento entre métodos se necessário.' },
      { text: 'Após pagar, um recibo é gerado automaticamente.' },
    ],
  },
  {
    id: 'equipe',
    icon: <UserTick size={22} color="#3B82F6" variant="Outline" />,
    title: 'Equipe',
    description: 'Gerenciar funcionários e comissões',
    color: '#3B82F6',
    steps: [
      { text: 'Acesse "Equipe" pelo menu de Gestão.' },
      { text: 'Veja a lista de funcionários com nome, função e comissões.' },
      { text: 'Toque em "+" para adicionar: nome, e-mail, telefone, função e tipo de comissão (% ou fixo).' },
      { text: 'Defina os serviços que cada profissional realiza.' },
      { text: 'Em Configurações > Permissões, controle o que cada funcionário pode ver e editar.' },
      { text: 'Funcionários podem acessar o app com PIN para ver apenas a própria agenda.' },
    ],
  },
  {
    id: 'produtos',
    icon: <Box size={22} color="#10B981" variant="Outline" />,
    title: 'Produtos e Estoque',
    description: 'Controle de estoque e vendas',
    color: '#10B981',
    steps: [
      { text: 'Acesse "Produtos" pelo menu de Gestão.' },
      { text: 'Veja todos os produtos com preço, estoque e margem de lucro.' },
      { text: 'Toque em "+" para cadastrar: nome, preço de venda, preço de custo, estoque e categoria.' },
      { text: 'Use o scanner de código de barras para agilizar o cadastro.' },
      { text: 'Produtos com estoque baixo aparecem como alerta na tela principal.' },
      { text: 'Ative "Vender online" para disponibilizar no catálogo público.' },
    ],
  },
  {
    id: 'caixa',
    icon: <Wallet size={22} color="#6366F1" variant="Outline" />,
    title: 'Caixa',
    description: 'Abertura, fechamento e movimentações',
    color: '#6366F1',
    steps: [
      { text: 'Acesse "Caixa" pelo menu de Gestão.' },
      { text: 'Toque em "Abrir Caixa" e informe o valor inicial em dinheiro.' },
      { text: 'Durante o dia, registre reforços (entradas) e sangrias (retiradas).' },
      { text: 'Acompanhe o saldo em tempo real com o resumo de entradas e saídas.' },
      { text: 'No final do dia, toque em "Fechar Caixa" para registrar o fechamento.' },
    ],
  },
  {
    id: 'link',
    icon: <Link2 size={22} color="#5333ED" variant="Outline" />,
    title: 'Link de Agendamento',
    description: 'Compartilhar seu link e QR Code',
    color: '#5333ED',
    steps: [
      { text: 'Acesse "Link de Agendamento" ou "Meu Perfil" no menu de Gestão.' },
      { text: 'Seu link personalizado aparece no topo. Copie com um toque.' },
      { text: 'Compartilhe via WhatsApp, Instagram ou outros apps.' },
      { text: 'Um QR Code é gerado automaticamente — perfeito para imprimir no balcão.' },
      { text: 'Seus clientes podem agendar pelo link sem precisar ligar ou mandar mensagem.' },
      { text: 'Personalize seu perfil público com bio, cores e links das redes sociais.' },
    ],
  },
  {
    id: 'relatorios',
    icon: <Chart size={22} color="#EF4444" variant="Outline" />,
    title: 'Relatórios',
    description: 'Análises e métricas do negócio',
    color: '#EF4444',
    steps: [
      { text: 'Acesse "Relatórios" pelo menu de Gestão.' },
      { text: 'Use as abas: Resumo (visão geral), Caixa (fluxo diário) e Performance (profissionais).' },
      { text: 'Filtre por período: Semana, Mês ou Ano.' },
      { text: 'Em Resumo, veja receita total, despesas, lucro e top serviços.' },
      { text: 'Em Performance, compare faturamento e comissões por profissional.' },
      { text: 'Veja os melhores clientes por gasto total e frequência de visitas.' },
    ],
  },
  {
    id: 'assistente',
    icon: <MagicStar size={22} color="#7C3AED" variant="Outline" />,
    title: 'Assistente IA',
    description: 'Dicas e sugestões inteligentes',
    color: '#7C3AED',
    steps: [
      { text: 'Acesse "Assistente IA" pelas ações rápidas ou menu de Gestão.' },
      { text: 'Digite qualquer pergunta sobre gestão do seu negócio.' },
      { text: 'Use os prompts rápidos sugeridos para perguntas comuns.' },
      { text: 'O assistente pode ajudar com: fidelização de clientes, estratégias de marketing, organização de agenda e mais.' },
    ],
  },
  {
    id: 'configuracoes',
    icon: <Setting2 size={22} color="#64748B" variant="Outline" />,
    title: 'Configurações',
    description: 'Personalizar seu estabelecimento',
    color: '#64748B',
    steps: [
      { text: 'Toque no ícone de engrenagem no topo da tela principal.' },
      { text: 'Configurações gerais: dados do estabelecimento, endereço e tipo de negócio.' },
      { text: 'Horários: defina os dias e horários de funcionamento.' },
      { text: 'Marca: personalize logo e cores do seu perfil público.' },
      { text: 'Taxas: configure as taxas de cada forma de pagamento.' },
      { text: 'Metas: defina sua meta de faturamento mensal.' },
      { text: 'Permissões: controle o que cada funcionário pode acessar.' },
    ],
  },
];

export default function HelpTutorialsScreen() {
  const router = useRouter();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const openTutorial = (tutorial: Tutorial) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTutorial(tutorial);
    setCurrentStep(0);
  };

  const closeTutorial = () => {
    setSelectedTutorial(null);
    setCurrentStep(0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft2 size={22} color={colors.textPrimary} variant="Outline" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>Tutoriais</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
            Aprenda a usar cada funcionalidade do Appbello com guias passo a passo.
          </Text>

          {TUTORIALS.map((tutorial, index) => (
            <Animated.View key={tutorial.id} entering={FadeInDown.duration(300).delay(index * 40)}>
              <Pressable
                onPress={() => openTutorial(tutorial)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: colors.backgroundCard,
                  marginBottom: 10,
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: tutorial.color + '15',
                  alignItems: 'center', justifyContent: 'center', marginRight: 14,
                }}>
                  {tutorial.icon}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{tutorial.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{tutorial.description}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginRight: 4 }}>{tutorial.steps.length} passos</Text>
                  <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Tutorial Detail Modal */}
      <Modal visible={!!selectedTutorial} animationType="slide" transparent onRequestClose={closeTutorial}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '85%',
            paddingTop: 20,
            paddingBottom: 34,
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: (selectedTutorial?.color ?? colors.primary) + '15',
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  {selectedTutorial?.icon}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 17 }}>{selectedTutorial?.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Passo {currentStep + 1} de {selectedTutorial?.steps.length}</Text>
                </View>
              </View>
              <Pressable onPress={closeTutorial} style={{ padding: 6 }}>
                <CloseCircle size={22} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </View>

            {/* Progress bar */}
            <View style={{ height: 4, backgroundColor: colors.border, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
              <View style={{
                height: 4, borderRadius: 2,
                width: `${((currentStep + 1) / (selectedTutorial?.steps.length ?? 1)) * 100}%`,
                backgroundColor: selectedTutorial?.color ?? colors.primary,
              }} />
            </View>

            {/* Step content */}
            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {selectedTutorial?.steps.map((step, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    marginBottom: 16,
                    opacity: i <= currentStep ? 1 : 0.3,
                  }}
                >
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: i < currentStep ? (selectedTutorial.color + '15') : i === currentStep ? '#E5E7EB' : colors.border,
                    alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2,
                  }}>
                    {i < currentStep ? (
                      <TickCircle size={16} color={selectedTutorial.color} variant="Outline" />
                    ) : (
                      <Text style={{ color: i === currentStep ? selectedTutorial.color : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={{
                    flex: 1, color: colors.textPrimary, fontSize: 14, lineHeight: 21,
                    fontWeight: i === currentStep ? '600' : '400',
                  }}>
                    {step.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Navigation buttons */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 20 }}>
              {currentStep > 0 && (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentStep(s => s - 1); }}
                  style={{
                    flex: 1, height: 48, borderRadius: 14,
                    borderWidth: 1.5, borderColor: colors.border,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Anterior</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (currentStep < (selectedTutorial?.steps.length ?? 1) - 1) {
                    setCurrentStep(s => s + 1);
                  } else {
                    closeTutorial();
                  }
                }}
                style={{
                  flex: currentStep > 0 ? 1.5 : 1, height: 48, borderRadius: 14,
                  backgroundColor: '#F3F4F6',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {currentStep < (selectedTutorial?.steps.length ?? 1) - 1 ? (
                  <>
                    <Text style={{ color: '#374151', fontWeight: '700', fontSize: 15 }}>Próximo</Text>
                    <ArrowRight2 size={16} color={selectedTutorial?.color ?? colors.primary} variant="Outline" />
                  </>
                ) : (
                  <>
                    <TickCircle size={18} color={selectedTutorial?.color ?? colors.primary} variant="Outline" />
                    <Text style={{ color: '#374151', fontWeight: '700', fontSize: 15 }}>Concluir</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
