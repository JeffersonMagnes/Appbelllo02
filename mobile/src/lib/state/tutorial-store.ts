import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetArea: 'header' | 'kpi' | 'quick-actions' | 'agenda' | 'services' | 'profile' | 'notifications' | 'settings' | 'management' | 'welcome' | 'ai-assistant' | 'tabs';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Appbello!',
    description: 'Vamos fazer um tour rápido pelo app para você conhecer todas as funcionalidades. Toque em "Próximo" para começar!',
    icon: 'rocket',
    targetArea: 'welcome',
  },
  {
    id: 'kpi',
    title: 'Painel de Resultados',
    description: 'Aqui você acompanha o faturamento do dia, lucro mensal, meta e indicadores do seu negócio em tempo real.',
    icon: 'chart',
    targetArea: 'kpi',
  },
  {
    id: 'quick-actions',
    title: 'Ações Rápidas',
    description: 'Acesse rapidamente as funções mais usadas: Agendar, Clientes, Comandas, Financeiro, Relatórios e muito mais!',
    icon: 'grid',
    targetArea: 'quick-actions',
  },
  {
    id: 'ai-assistant',
    title: 'Assistente IA',
    description: 'Use a inteligência artificial para tirar dúvidas, gerar relatórios e receber sugestões personalizadas para o seu negócio.',
    icon: 'magic',
    targetArea: 'ai-assistant',
  },
  {
    id: 'management',
    title: 'Gestão Completa',
    description: 'Gerencie Agenda, Financeiro, Comandas, Clientes, Produtos, Funcionários e Links de agendamento em um só lugar.',
    icon: 'briefcase',
    targetArea: 'management',
  },
  {
    id: 'notifications',
    title: 'Notificações',
    description: 'Fique por dentro de tudo! Aqui você recebe alertas de agendamentos, pagamentos, estoque baixo e muito mais.',
    icon: 'bell',
    targetArea: 'notifications',
  },
  {
    id: 'settings',
    title: 'Configurações',
    description: 'Personalize seu estabelecimento: horários, endereço, marca, taxas, metas e permissões de acesso.',
    icon: 'settings',
    targetArea: 'settings',
  },
  {
    id: 'tabs-services',
    title: 'Aba Serviços',
    description: 'Cadastre e gerencie seus serviços e pacotes. Defina preços, durações e categorias.',
    icon: 'scissors',
    targetArea: 'services',
  },
  {
    id: 'tabs-agenda',
    title: 'Aba Agenda',
    description: 'Visualize seus agendamentos por semana, mês ou ano. Filtre por profissional e gerencie horários.',
    icon: 'calendar',
    targetArea: 'agenda',
  },
  {
    id: 'tabs-profile',
    title: 'Aba Perfil',
    description: 'Gerencie seus dados pessoais, assinatura, formas de pagamento, notificações e configurações do app.',
    icon: 'user',
    targetArea: 'profile',
  },
];

interface TutorialState {
  hasSeenTutorial: boolean;
  showTutorial: boolean;
  currentStep: number;
  setHasSeenTutorial: (value: boolean) => void;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      hasSeenTutorial: false,
      showTutorial: false,
      currentStep: 0,

      setHasSeenTutorial: (value) => set({ hasSeenTutorial: value }),

      startTutorial: () => set({ showTutorial: true, currentStep: 0 }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < TUTORIAL_STEPS.length - 1) {
          set({ currentStep: currentStep + 1 });
        } else {
          get().completeTutorial();
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      skipTutorial: () => set({ showTutorial: false, hasSeenTutorial: true }),

      completeTutorial: () => set({ showTutorial: false, hasSeenTutorial: true, currentStep: 0 }),

      resetTutorial: () => set({ hasSeenTutorial: false, showTutorial: false, currentStep: 0 }),
    }),
    {
      name: 'tutorial-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenTutorial: state.hasSeenTutorial,
      }),
    }
  )
);
