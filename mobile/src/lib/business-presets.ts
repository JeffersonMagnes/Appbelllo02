export type BusinessType = 'clinic' | 'barbershop' | 'salon' | 'spa' | 'studio' | '';

export interface BusinessPreset {
  roles: string[];
  services: string[];
  categories: string[];
}

const PRESETS: Record<string, BusinessPreset> = {
  barbershop: {
    roles: ['Barbeiro', 'Barbeiro Senior', 'Auxiliar', 'Recepcionista', 'Outro'],
    services: [
      'Corte Masculino',
      'Barba',
      'Corte + Barba',
      'Degradê',
      'Nevou',
      'Sobrancelha',
      'Relaxamento',
      'Pigmentação',
      'Hidratação Capilar',
      'Platinado',
    ],
    categories: ['Cortes', 'Barba', 'Tratamentos', 'Coloração'],
  },
  salon: {
    roles: ['Cabeleireiro(a)', 'Manicure', 'Colorista', 'Auxiliar', 'Recepcionista', 'Outro'],
    services: [
      'Corte Feminino',
      'Corte Masculino',
      'Escova',
      'Progressiva',
      'Coloração',
      'Mechas/Luzes',
      'Manicure',
      'Pedicure',
      'Hidratação',
      'Penteado',
    ],
    categories: ['Cabelo', 'Unhas', 'Tratamentos', 'Coloração', 'Penteados'],
  },
  clinic: {
    roles: ['Médico(a)', 'Esteticista', 'Fisioterapeuta', 'Dermatologista', 'Dentista', 'Enfermeiro(a)', 'Recepcionista', 'Outro'],
    services: [
      'Consulta',
      'Limpeza de Pele',
      'Peeling',
      'Botox',
      'Preenchimento',
      'Drenagem Linfática',
      'Microagulhamento',
      'Laser',
      'Depilação',
      'Avaliação',
    ],
    categories: ['Consultas', 'Estética Facial', 'Estética Corporal', 'Procedimentos', 'Avaliações'],
  },
  spa: {
    roles: ['Massoterapeuta', 'Terapeuta', 'Esteticista', 'Recepcionista', 'Outro'],
    services: [
      'Massagem Relaxante',
      'Massagem Modeladora',
      'Drenagem Linfática',
      'Pedras Quentes',
      'Aromaterapia',
      'Banho de Ofurô',
      'Esfoliação Corporal',
      'Hidratação Corporal',
      'Reflexologia',
      'Day Spa Completo',
    ],
    categories: ['Massagens', 'Tratamentos Corporais', 'Relaxamento', 'Pacotes'],
  },
  studio: {
    roles: ['Tatuador(a)', 'Body Piercer', 'Designer', 'Micropigmentador(a)', 'Recepcionista', 'Outro'],
    services: [
      'Tatuagem Pequena',
      'Tatuagem Média',
      'Tatuagem Grande',
      'Cobertura',
      'Piercing',
      'Micropigmentação',
      'Design de Sobrancelha',
      'Remoção a Laser',
      'Retoque',
      'Orçamento',
    ],
    categories: ['Tatuagem', 'Piercing', 'Micropigmentação', 'Outros'],
  },
};

const DEFAULT_PRESET: BusinessPreset = {
  roles: ['Profissional', 'Auxiliar', 'Recepcionista', 'Outro'],
  services: [
    'Atendimento',
    'Consulta',
    'Procedimento',
    'Avaliação',
  ],
  categories: ['Geral'],
};

export function getBusinessPreset(type: BusinessType): BusinessPreset {
  if (!type) return DEFAULT_PRESET;
  return PRESETS[type] ?? DEFAULT_PRESET;
}

export type ServiceCategory = { id: string; name: string; icon: string };

const CATEGORY_MAP: Record<string, ServiceCategory[]> = {
  barbershop: [
    { id: '1', name: 'Cortes', icon: 'scissors' },
    { id: '2', name: 'Barba', icon: 'user' },
    { id: '3', name: 'Tratamentos', icon: 'heart' },
    { id: '4', name: 'Coloração', icon: 'sparkles' },
  ],
  salon: [
    { id: '1', name: 'Cabelo', icon: 'scissors' },
    { id: '2', name: 'Unhas', icon: 'sparkles' },
    { id: '3', name: 'Tratamentos', icon: 'heart' },
    { id: '4', name: 'Coloração', icon: 'palette' },
    { id: '5', name: 'Penteados', icon: 'crown' },
  ],
  clinic: [
    { id: '1', name: 'Consultas', icon: 'clipboard' },
    { id: '2', name: 'Estética Facial', icon: 'sparkles' },
    { id: '3', name: 'Estética Corporal', icon: 'heart' },
    { id: '4', name: 'Procedimentos', icon: 'medical' },
    { id: '5', name: 'Avaliações', icon: 'search' },
  ],
  spa: [
    { id: '1', name: 'Massagens', icon: 'heart' },
    { id: '2', name: 'Tratamentos Corporais', icon: 'sparkles' },
    { id: '3', name: 'Relaxamento', icon: 'sun' },
    { id: '4', name: 'Pacotes', icon: 'gift' },
  ],
  studio: [
    { id: '1', name: 'Tatuagem', icon: 'pen' },
    { id: '2', name: 'Piercing', icon: 'sparkles' },
    { id: '3', name: 'Micropigmentação', icon: 'eye' },
    { id: '4', name: 'Outros', icon: 'grid' },
  ],
};

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: '1', name: 'Geral', icon: 'grid' },
];

export function getServiceCategories(type: BusinessType): ServiceCategory[] {
  if (!type) return DEFAULT_CATEGORIES;
  return CATEGORY_MAP[type] ?? DEFAULT_CATEGORIES;
}
