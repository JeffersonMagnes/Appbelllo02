import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnamnesisField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'photo_comparison';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface AnamnesisSection {
  id: string;
  title: string;
  fields: AnamnesisField[];
}

export interface PhotoComparison {
  before: string[];
  after: string[];
}

export interface AnamnesisTemplate {
  id: string;
  name: string;
  icon: string;
  category: 'beauty' | 'health' | 'hair' | 'body' | 'general';
  description: string;
  sections: AnamnesisSection[];
  isFavorite: boolean;
  isCustom: boolean;
}

export interface FilledAnamnesis {
  id: string;
  clientId: string;
  templateId: string;
  templateName: string;
  filledAt: string;
  updatedAt: string;
  shareToken: string;
  data: Record<string, string | boolean | string[] | PhotoComparison>;
}

interface AnamnesisState {
  templates: AnamnesisTemplate[];
  filledAnamnesis: FilledAnamnesis[];
  favoriteTemplates: string[];
  toggleFavorite: (templateId: string) => void;
  addFilledAnamnesis: (anamnesis: Omit<FilledAnamnesis, 'id' | 'filledAt' | 'updatedAt' | 'shareToken'>) => FilledAnamnesis;
  updateFilledAnamnesis: (id: string, data: Record<string, string | boolean | string[] | PhotoComparison>) => void;
  getClientAnamnesis: (clientId: string) => FilledAnamnesis[];
}

// Modelos de fichas padrão baseados na imagem
const defaultTemplates: AnamnesisTemplate[] = [
  {
    id: 'micropigmentacao',
    name: 'Micropigmentação',
    icon: 'eyebrow',
    category: 'beauty',
    description: 'Ficha completa para procedimentos de micropigmentação',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'data-nascimento', label: 'Data de nascimento', type: 'date', required: true },
          { id: 'profissao', label: 'Profissão', type: 'text', required: false },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
        ],
      },
      {
        id: 'historico-saude',
        title: 'Histórico de Saúde',
        fields: [
          { id: 'gestante', label: 'Está gestante ou amamentando?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'diabetes', label: 'Possui diabetes?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'hipertensao', label: 'Possui hipertensão?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'hemofilia', label: 'Possui hemofilia ou problemas de coagulação?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'herpes', label: 'Tem histórico de herpes labial?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'alergia-anestesico', label: 'Tem alergia a anestésicos?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'queloides', label: 'Tem tendência a queloides?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'medicamentos', label: 'Usa algum medicamento? Qual?', type: 'textarea', required: false },
        ],
      },
      {
        id: 'procedimento',
        title: 'Informações do Procedimento',
        fields: [
          { id: 'area', label: 'Área a ser pigmentada', type: 'select', required: true, options: ['Sobrancelhas', 'Lábios', 'Olhos (delineado)', 'Outro'] },
          { id: 'procedimento-anterior', label: 'Já fez micropigmentação antes?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'expectativas', label: 'Quais suas expectativas com o procedimento?', type: 'textarea', required: false },
        ],
      },
      {
        id: 'termo',
        title: 'Termo de Consentimento',
        fields: [
          { id: 'aceite-termo', label: 'Declaro que todas as informações são verdadeiras e autorizo o procedimento', type: 'checkbox', required: true },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'design-sobrancelhas',
    name: 'Design Sobrancelhas',
    icon: 'eye',
    category: 'beauty',
    description: 'Ficha para design e modelagem de sobrancelhas',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
        ],
      },
      {
        id: 'historico',
        title: 'Histórico',
        fields: [
          { id: 'primeira-vez', label: 'É a primeira vez fazendo design?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'tipo-pele', label: 'Tipo de pele', type: 'select', required: true, options: ['Normal', 'Oleosa', 'Seca', 'Mista', 'Sensível'] },
          { id: 'alergia', label: 'Possui alguma alergia?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'qual-alergia', label: 'Se sim, qual?', type: 'text', required: false },
          { id: 'usa-acido', label: 'Usa ácidos ou retinoides?', type: 'radio', required: true, options: ['Sim', 'Não'] },
        ],
      },
      {
        id: 'preferencias',
        title: 'Preferências',
        fields: [
          { id: 'formato', label: 'Formato desejado', type: 'select', required: false, options: ['Natural', 'Arqueada', 'Reta', 'A definir'] },
          { id: 'observacoes', label: 'Observações', type: 'textarea', required: false },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'alongamento-cilios',
    name: 'Alongamento de Cílios',
    icon: 'eyelash',
    category: 'beauty',
    description: 'Ficha para extensão e alongamento de cílios',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
          { id: 'data-nascimento', label: 'Data de nascimento', type: 'date', required: true },
        ],
      },
      {
        id: 'saude-ocular',
        title: 'Saúde Ocular',
        fields: [
          { id: 'usa-lentes', label: 'Usa lentes de contato?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'alergia-cola', label: 'Tem alergia a colas/adesivos?', type: 'radio', required: true, options: ['Sim', 'Não', 'Não sei'] },
          { id: 'problema-ocular', label: 'Possui algum problema ocular?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'qual-problema', label: 'Se sim, qual?', type: 'text', required: false },
          { id: 'cirurgia-ocular', label: 'Fez cirurgia ocular recente?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'gestante', label: 'Está gestante?', type: 'radio', required: true, options: ['Sim', 'Não'] },
        ],
      },
      {
        id: 'procedimento',
        title: 'Procedimento',
        fields: [
          { id: 'tipo-alongamento', label: 'Tipo de alongamento', type: 'select', required: true, options: ['Fio a fio clássico', 'Volume russo', 'Volume brasileiro', 'Híbrido', 'Mega volume'] },
          { id: 'curvatura', label: 'Curvatura preferida', type: 'select', required: false, options: ['C', 'CC', 'D', 'DD', 'A definir'] },
          { id: 'observacoes', label: 'Observações', type: 'textarea', required: false },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'alongamento-unhas',
    name: 'Alongamento de Unhas',
    icon: 'nail',
    category: 'beauty',
    description: 'Ficha para extensão e alongamento de unhas',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
        ],
      },
      {
        id: 'saude',
        title: 'Histórico de Saúde',
        fields: [
          { id: 'fungos', label: 'Possui ou já teve micose nas unhas?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'alergia', label: 'Tem alergia a esmaltes ou produtos químicos?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'diabetes', label: 'Possui diabetes?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'medicamentos', label: 'Usa algum medicamento?', type: 'textarea', required: false },
        ],
      },
      {
        id: 'preferencias',
        title: 'Preferências',
        fields: [
          { id: 'tipo', label: 'Tipo de alongamento', type: 'select', required: true, options: ['Gel', 'Fibra de vidro', 'Acrílico', 'Polygel'] },
          { id: 'formato', label: 'Formato desejado', type: 'select', required: true, options: ['Quadrado', 'Redondo', 'Stiletto', 'Bailarina', 'Amendoado'] },
          { id: 'comprimento', label: 'Comprimento', type: 'select', required: true, options: ['Curto', 'Médio', 'Longo', 'Extra longo'] },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'depilacao',
    name: 'Depilação',
    icon: 'wax',
    category: 'body',
    description: 'Ficha para procedimentos de depilação',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
        ],
      },
      {
        id: 'saude',
        title: 'Histórico de Saúde',
        fields: [
          { id: 'gestante', label: 'Está gestante?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'diabetes', label: 'Possui diabetes?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'varizes', label: 'Possui varizes?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'pele-sensivel', label: 'Possui pele sensível?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'usa-acidos', label: 'Usa ácidos ou retinoides?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'alergia', label: 'Tem alergia a cera ou resina?', type: 'radio', required: true, options: ['Sim', 'Não'] },
        ],
      },
      {
        id: 'procedimento',
        title: 'Procedimento',
        fields: [
          { id: 'areas', label: 'Áreas a serem depiladas', type: 'textarea', required: true, placeholder: 'Ex: Pernas, axilas, virilha...' },
          { id: 'tipo-cera', label: 'Preferência de cera', type: 'select', required: false, options: ['Cera quente', 'Cera fria', 'Cera roll-on', 'Sem preferência'] },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'capilar',
    name: 'Capilar',
    icon: 'hair',
    category: 'hair',
    description: 'Ficha para tratamentos capilares',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
        ],
      },
      {
        id: 'historico-capilar',
        title: 'Histórico Capilar',
        fields: [
          { id: 'tipo-cabelo', label: 'Tipo de cabelo', type: 'select', required: true, options: ['Liso', 'Ondulado', 'Cacheado', 'Crespo'] },
          { id: 'quimica', label: 'Possui química no cabelo?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'qual-quimica', label: 'Se sim, qual?', type: 'select', required: false, options: ['Coloração', 'Descoloração', 'Progressiva', 'Relaxamento', 'Permanente'] },
          { id: 'ultima-quimica', label: 'Quando foi a última química?', type: 'text', required: false },
          { id: 'alergia', label: 'Tem alergia a algum produto capilar?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'queda', label: 'Tem queda de cabelo?', type: 'radio', required: true, options: ['Sim', 'Não'] },
        ],
      },
      {
        id: 'tratamento',
        title: 'Tratamento Desejado',
        fields: [
          { id: 'objetivo', label: 'Objetivo do tratamento', type: 'textarea', required: false },
          { id: 'observacoes', label: 'Observações', type: 'textarea', required: false },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'massoterapia',
    name: 'Massoterapia',
    icon: 'massage',
    category: 'body',
    description: 'Ficha para sessões de massagem',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
          { id: 'data-nascimento', label: 'Data de nascimento', type: 'date', required: true },
        ],
      },
      {
        id: 'saude',
        title: 'Histórico de Saúde',
        fields: [
          { id: 'gestante', label: 'Está gestante?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'hipertensao', label: 'Possui hipertensão?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'problemas-cardiacos', label: 'Possui problemas cardíacos?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'cirurgia-recente', label: 'Fez cirurgia recente?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'trombose', label: 'Tem histórico de trombose?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'dores', label: 'Sente dores em alguma região?', type: 'textarea', required: false },
          { id: 'medicamentos', label: 'Usa algum medicamento?', type: 'textarea', required: false },
        ],
      },
      {
        id: 'preferencias',
        title: 'Preferências',
        fields: [
          { id: 'tipo-massagem', label: 'Tipo de massagem', type: 'select', required: true, options: ['Relaxante', 'Modeladora', 'Drenagem linfática', 'Desportiva', 'Terapêutica'] },
          { id: 'pressao', label: 'Intensidade preferida', type: 'select', required: false, options: ['Leve', 'Moderada', 'Firme'] },
          { id: 'areas-evitar', label: 'Áreas a evitar', type: 'textarea', required: false },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'facial',
    name: 'Facial',
    icon: 'face',
    category: 'beauty',
    description: 'Ficha para tratamentos faciais',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
          { id: 'data-nascimento', label: 'Data de nascimento', type: 'date', required: true },
        ],
      },
      {
        id: 'pele',
        title: 'Análise da Pele',
        fields: [
          { id: 'tipo-pele', label: 'Tipo de pele', type: 'select', required: true, options: ['Normal', 'Oleosa', 'Seca', 'Mista', 'Sensível'] },
          { id: 'acne', label: 'Possui acne?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'manchas', label: 'Possui manchas?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'rosacea', label: 'Possui rosácea?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'usa-acidos', label: 'Usa ácidos ou retinoides?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'protetor-solar', label: 'Usa protetor solar diariamente?', type: 'radio', required: true, options: ['Sim', 'Não'] },
        ],
      },
      {
        id: 'saude',
        title: 'Histórico de Saúde',
        fields: [
          { id: 'gestante', label: 'Está gestante?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'herpes', label: 'Tem histórico de herpes?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'alergia', label: 'Tem alergia a algum cosmético?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'qual-alergia', label: 'Se sim, qual?', type: 'text', required: false },
        ],
      },
      {
        id: 'objetivo',
        title: 'Objetivos',
        fields: [
          { id: 'queixa-principal', label: 'Queixa principal', type: 'textarea', required: false },
          { id: 'expectativas', label: 'Expectativas do tratamento', type: 'textarea', required: false },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'podologia',
    name: 'Podologia',
    icon: 'foot',
    category: 'health',
    description: 'Ficha para tratamentos podológicos',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
          { id: 'data-nascimento', label: 'Data de nascimento', type: 'date', required: true },
        ],
      },
      {
        id: 'saude',
        title: 'Histórico de Saúde',
        fields: [
          { id: 'diabetes', label: 'Possui diabetes?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'circulacao', label: 'Problemas de circulação?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'anticoagulante', label: 'Usa anticoagulante?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'sensibilidade', label: 'Tem perda de sensibilidade nos pés?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'medicamentos', label: 'Usa algum medicamento?', type: 'textarea', required: false },
        ],
      },
      {
        id: 'queixas',
        title: 'Queixas',
        fields: [
          { id: 'unha-encravada', label: 'Tem unha encravada?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'micose', label: 'Possui micose?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'calosidade', label: 'Possui calosidades?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'rachadura', label: 'Possui rachaduras?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'outras-queixas', label: 'Outras queixas', type: 'textarea', required: false },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
  {
    id: 'barbearia',
    name: 'Barbearia',
    icon: 'barber',
    category: 'hair',
    description: 'Ficha para serviços de barbearia',
    isFavorite: false,
    isCustom: false,
    sections: [
      {
        id: 'dados-pessoais',
        title: 'Dados Pessoais',
        fields: [
          { id: 'nome', label: 'Nome completo', type: 'text', required: true },
          { id: 'telefone', label: 'Telefone', type: 'text', required: true },
        ],
      },
      {
        id: 'saude',
        title: 'Histórico de Saúde',
        fields: [
          { id: 'alergia-produto', label: 'Tem alergia a algum produto?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'qual-alergia', label: 'Se sim, qual?', type: 'text', required: false },
          { id: 'pele-sensivel', label: 'Possui pele sensível?', type: 'radio', required: true, options: ['Sim', 'Não'] },
          { id: 'foliculite', label: 'Tem foliculite?', type: 'radio', required: true, options: ['Sim', 'Não'] },
        ],
      },
      {
        id: 'preferencias',
        title: 'Preferências',
        fields: [
          { id: 'tipo-corte', label: 'Estilo de corte preferido', type: 'text', required: false },
          { id: 'barba', label: 'Como prefere a barba?', type: 'select', required: false, options: ['Aparada', 'Desenhada', 'Feita', 'Não faz barba'] },
          { id: 'observacoes', label: 'Observações', type: 'textarea', required: false },
        ],
      },
      {
        id: 'fotos-comparativo',
        title: 'Fotos Comparativas',
        fields: [
          { id: 'fotos', label: 'Registro fotográfico antes e depois', type: 'photo_comparison', required: false },
        ],
      },
    ],
  },
];

export const useAnamnesisStore = create<AnamnesisState>()(
  persist(
    (set, get) => ({
  templates: defaultTemplates,
  filledAnamnesis: [],
  favoriteTemplates: [],

  toggleFavorite: (templateId: string) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      ),
      favoriteTemplates: state.favoriteTemplates.includes(templateId)
        ? state.favoriteTemplates.filter((id) => id !== templateId)
        : [...state.favoriteTemplates, templateId],
    }));
  },

  addFilledAnamnesis: (anamnesis) => {
    const now = new Date().toISOString();
    const created: FilledAnamnesis = {
      ...anamnesis,
      id: `anamnesis-${Date.now()}`,
      shareToken: `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,
      filledAt: now,
      updatedAt: now,
    };
    set((state) => ({
      filledAnamnesis: [...state.filledAnamnesis, created],
    }));
    return created;
  },

  updateFilledAnamnesis: (id, data) => {
    set((state) => ({
      filledAnamnesis: state.filledAnamnesis.map((a) =>
        a.id === id ? { ...a, data, updatedAt: new Date().toISOString() } : a
      ),
    }));
  },

  getClientAnamnesis: (clientId: string) => {
    return get().filledAnamnesis.filter((a) => a.clientId === clientId);
  },
    }),
    {
      name: 'anamnesis-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        filledAnamnesis: state.filledAnamnesis,
        favoriteTemplates: state.favoriteTemplates,
        templates: state.templates,
      }),
    }
  )
);
