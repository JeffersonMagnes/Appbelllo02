// Appbello - Theme System for White-Label
// This allows each establishment to customize their brand colors

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  background: string;
  backgroundLight: string;
  backgroundCard: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

// Default Appbello Theme – White / Light
export const defaultTheme: Theme = {
  name: 'Appbello',
  isDark: false,
  colors: {
    primary: '#C026D3',
    primaryLight: '#D946EF',
    primaryDark: '#A21CAF',
    secondary: '#FBBF24',
    secondaryLight: '#FDE68A',
    secondaryDark: '#F59E0B',
    background: '#0F172A',
    backgroundLight: '#1E293B',
    backgroundCard: '#1E293B',
    surface: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    border: 'rgba(255,255,255,0.1)',
  },
};

// Light Theme Alternative
export const lightTheme: Theme = {
  name: 'Appbello Light',
  isDark: false,
  colors: {
    primary: '#6666cc',
    primaryLight: '#8080d9',
    primaryDark: '#5555aa',
    secondary: '#7ccad0',
    secondaryLight: '#a0d8dc',
    secondaryDark: '#5ab5bc',
    background: '#F8FAFC',
    backgroundLight: '#FFFFFF',
    backgroundCard: '#FFFFFF',
    surface: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    border: '#E2E8F0',
  },
};

// Current active theme (can be changed per establishment)
export let currentTheme: Theme = lightTheme;

export const setTheme = (theme: Theme) => {
  currentTheme = theme;
};

// Utility to get current theme colors
export const getColors = (): ThemeColors => currentTheme.colors;

// Legacy support - export colors directly for existing code
export const colors = lightTheme.colors;

// Status colors mapping
export const statusColors = {
  confirmed: '#10B981',
  pending: '#F59E0B',
  completed: '#6B7280',
  cancelled: '#EF4444',
  open: '#F59E0B',
  closed: '#6666cc',
  paid: '#10B981',
};

// Payment method colors
export const paymentColors = {
  pix: '#32BCAD',
  credit: '#8B5CF6',
  debit: '#3B82F6',
  cash: '#10B981',
  transfer: '#F59E0B',
};
