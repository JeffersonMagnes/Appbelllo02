import { create } from 'zustand';

// Types
export interface AccountData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface BusinessData {
  businessName: string;
  businessType: 'clinic' | 'barbershop' | 'salon' | 'spa' | 'studio' | '';
  cnpj: string;
  phone: string;
  businessEmail: string;
  monthlyGoal: string;
  feePix: string;
  feeDinheiro: string;
  feeCredito: string;
  feeDebito: string;
}

export interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface BrandingData {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface SettingsData {
  openingTime: string;
  closingTime: string;
  workingDays: string[];
  breakStart: string;
  breakEnd: string;
  cancellationPolicy: number; // hours before
  defaultServiceDuration: number; // minutes
}

export interface ProfessionalData {
  name: string;
  role: string;
  services: string[];
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  workingHoursStart: string;
  workingHoursEnd: string;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  account: AccountData;
  business: BusinessData;
  address: AddressData;
  branding: BrandingData;
  settings: SettingsData;
  professional: ProfessionalData;

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateAccount: (data: Partial<AccountData>) => void;
  updateBusiness: (data: Partial<BusinessData>) => void;
  updateAddress: (data: Partial<AddressData>) => void;
  updateBranding: (data: Partial<BrandingData>) => void;
  updateSettings: (data: Partial<SettingsData>) => void;
  updateProfessional: (data: Partial<ProfessionalData>) => void;
  resetOnboarding: () => void;
}

const initialAccount: AccountData = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

const initialBusiness: BusinessData = {
  businessName: '',
  businessType: '',
  cnpj: '',
  phone: '',
  businessEmail: '',
  monthlyGoal: '',
  feePix: '0',
  feeDinheiro: '0',
  feeCredito: '3.5',
  feeDebito: '1.5',
};

const initialAddress: AddressData = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const initialBranding: BrandingData = {
  logoUrl: '',
  primaryColor: '#5333ed',
  secondaryColor: '#2cd4d9',
};

const initialSettings: SettingsData = {
  openingTime: '08:00',
  closingTime: '18:00',
  workingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
  breakStart: '12:00',
  breakEnd: '13:00',
  cancellationPolicy: 24,
  defaultServiceDuration: 30,
};

const initialProfessional: ProfessionalData = {
  name: '',
  role: '',
  services: [],
  commissionType: 'percentage',
  commissionValue: 0,
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  totalSteps: 6,
  account: initialAccount,
  business: initialBusiness,
  address: initialAddress,
  branding: initialBranding,
  settings: initialSettings,
  professional: initialProfessional,

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.totalSteps)
  })),

  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1)
  })),

  updateAccount: (data) => set((state) => ({
    account: { ...state.account, ...data }
  })),

  updateBusiness: (data) => set((state) => ({
    business: { ...state.business, ...data }
  })),

  updateAddress: (data) => set((state) => ({
    address: { ...state.address, ...data }
  })),

  updateBranding: (data) => set((state) => ({
    branding: { ...state.branding, ...data }
  })),

  updateSettings: (data) => set((state) => ({
    settings: { ...state.settings, ...data }
  })),

  updateProfessional: (data) => set((state) => ({
    professional: { ...state.professional, ...data }
  })),

  resetOnboarding: () => set({
    currentStep: 1,
    account: initialAccount,
    business: initialBusiness,
    address: initialAddress,
    branding: initialBranding,
    settings: initialSettings,
    professional: initialProfessional,
  }),
}));
