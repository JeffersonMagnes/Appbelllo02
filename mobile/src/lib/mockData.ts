// Appbello - Mock Data
import { Professional, Service, ServiceCategory, Appointment, Establishment, Employee, Product, Transaction, Client, Comanda, ClientAnamnesis } from './types';

export const establishment: Establishment = {
  id: '1',
  name: 'Appbello',
  logo: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200',
  address: 'Rua das Flores, 123 - Centro',
  phone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  instagram: '@appbello',
  workingHours: {
    monday: { open: '09:00', close: '19:00' },
    tuesday: { open: '09:00', close: '19:00' },
    wednesday: { open: '09:00', close: '19:00' },
    thursday: { open: '09:00', close: '19:00' },
    friday: { open: '09:00', close: '19:00' },
    saturday: { open: '09:00', close: '17:00' },
    sunday: null,
  },
};

export const professionals: Professional[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    specialty: 'Barbeiro Master',
    rating: 4.9,
    reviewCount: 127,
    services: ['1', '2', '3', '4'],
  },
  {
    id: '2',
    name: 'Ana Paula',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    specialty: 'Hair Stylist',
    rating: 4.8,
    reviewCount: 89,
    services: ['5', '6', '7', '8'],
  },
  {
    id: '3',
    name: 'Ricardo Santos',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    specialty: 'Barbeiro',
    rating: 4.7,
    reviewCount: 64,
    services: ['1', '2', '3'],
  },
  {
    id: '4',
    name: 'Juliana Costa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    specialty: 'Manicure & Pedicure',
    rating: 4.9,
    reviewCount: 156,
    services: ['9', '10', '11'],
  },
];

export const serviceCategories: ServiceCategory[] = [
  { id: '1', name: 'Cabelo', icon: 'scissors' },
  { id: '2', name: 'Barba', icon: 'user' },
  { id: '3', name: 'Unhas', icon: 'sparkles' },
  { id: '4', name: 'Tratamentos', icon: 'heart' },
];

export const services: Service[] = [
  {
    id: '1',
    name: 'Corte Masculino',
    description: 'Corte moderno com acabamento perfeito',
    duration: 30,
    price: 45,
    category: '1',
    professionals: ['1', '3'],
  },
  {
    id: '2',
    name: 'Barba Completa',
    description: 'Barba modelada com toalha quente e produtos premium',
    duration: 30,
    price: 35,
    category: '2',
    professionals: ['1', '3'],
  },
  {
    id: '3',
    name: 'Corte + Barba',
    description: 'Combo completo para você ficar impecável',
    duration: 60,
    price: 70,
    category: '1',
    professionals: ['1', '3'],
  },
  {
    id: '4',
    name: 'Pigmentação de Barba',
    description: 'Cobertura de falhas e fios brancos',
    duration: 45,
    price: 55,
    category: '2',
    professionals: ['1'],
  },
  {
    id: '5',
    name: 'Corte Feminino',
    description: 'Corte personalizado de acordo com seu estilo',
    duration: 45,
    price: 65,
    category: '1',
    professionals: ['2'],
  },
  {
    id: '6',
    name: 'Escova Modeladora',
    description: 'Escova com finalização profissional',
    duration: 40,
    price: 50,
    category: '1',
    professionals: ['2'],
  },
  {
    id: '7',
    name: 'Coloração',
    description: 'Tintura completa com produtos de qualidade',
    duration: 90,
    price: 120,
    category: '1',
    professionals: ['2'],
  },
  {
    id: '8',
    name: 'Hidratação Profunda',
    description: 'Tratamento intensivo para fios danificados',
    duration: 60,
    price: 80,
    category: '4',
    professionals: ['2'],
  },
  {
    id: '9',
    name: 'Manicure',
    description: 'Cuidado completo para suas unhas',
    duration: 45,
    price: 40,
    category: '3',
    professionals: ['4'],
  },
  {
    id: '10',
    name: 'Pedicure',
    description: 'Tratamento completo para os pés',
    duration: 50,
    price: 50,
    category: '3',
    professionals: ['4'],
  },
  {
    id: '11',
    name: 'Mani + Pedi',
    description: 'Combo completo mãos e pés',
    duration: 90,
    price: 80,
    category: '3',
    professionals: ['4'],
  },
];

// Gera agendamentos fictícios espalhados pelo mês atual
function generateMockAppointments(): Appointment[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const clientIds = ['1', '2', '3', '4', '5', '1', '2', '3'];
  const professionalIds = ['1', '2', '3'];
  const serviceIds = ['1', '2', '3', '4', '5', '6'];
  const statuses: Appointment['status'][] = ['confirmed', 'confirmed', 'confirmed', 'pending', 'completed', 'cancelled'];
  const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

  // Número de agendamentos por dia — varia para mostrar anéis diferentes
  const appointmentsPerDay: Record<number, number> = {
    1: 2, 2: 4, 3: 1, 4: 6, 5: 3, 6: 0, 7: 5,
    8: 2, 9: 7, 10: 1, 11: 8, 12: 3, 13: 4, 14: 2,
    15: 6, 16: 3, 17: 9, 18: 1, 19: 2, 20: 5,
    21: 3, 22: 0, 23: 4, 24: 7, 25: 2, 26: 1,
    27: 3, 28: 5, 29: 2, 30: 4, 31: 1,
  };

  const appointments: Appointment[] = [];
  let id = 1;

  for (let day = 1; day <= daysInMonth; day++) {
    const count = appointmentsPerDay[day] ?? 0;
    for (let i = 0; i < count; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      appointments.push({
        id: String(id++),
        clientId: clientIds[i % clientIds.length],
        professionalId: professionalIds[i % professionalIds.length],
        serviceId: serviceIds[i % serviceIds.length],
        date: dateStr,
        time: times[i % times.length],
        status: statuses[i % statuses.length],
        createdAt: new Date().toISOString(),
      });
    }
  }

  return appointments;
}

export const mockAppointments: Appointment[] = generateMockAppointments();

export const generateTimeSlots = (date: string, professionalId: string): { time: string; available: boolean }[] => {
  const slots = [];
  const startHour = 9;
  const endHour = 19;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      // Simulate some busy slots
      const available = Math.random() > 0.3;
      slots.push({ time, available });
    }
  }

  return slots;
};

// ============ DADOS DE GESTÃO ============

export const employees: Employee[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    role: 'professional',
    specialty: 'Barbeiro Master',
    phone: '(11) 99999-1111',
    email: 'carlos@appbello.com',
    commissionType: 'percentage',
    commissionValue: 40,
    services: ['1', '2', '3', '4'],
    active: true,
    hireDate: '2023-01-15',
  },
  {
    id: '2',
    name: 'Ana Paula',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    role: 'professional',
    specialty: 'Hair Stylist',
    phone: '(11) 99999-2222',
    email: 'ana@appbello.com',
    commissionType: 'percentage',
    commissionValue: 45,
    services: ['5', '6', '7', '8'],
    active: true,
    hireDate: '2023-03-20',
  },
  {
    id: '3',
    name: 'Ricardo Santos',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    role: 'professional',
    specialty: 'Barbeiro',
    phone: '(11) 99999-3333',
    email: 'ricardo@appbello.com',
    commissionType: 'percentage',
    commissionValue: 35,
    services: ['1', '2', '3'],
    active: true,
    hireDate: '2023-06-10',
  },
  {
    id: '4',
    name: 'Juliana Costa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    role: 'professional',
    specialty: 'Manicure & Pedicure',
    phone: '(11) 99999-4444',
    email: 'juliana@appbello.com',
    commissionType: 'percentage',
    commissionValue: 50,
    services: ['9', '10', '11'],
    active: true,
    hireDate: '2023-02-01',
  },
  {
    id: '5',
    name: 'Marina Souza',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
    role: 'receptionist',
    phone: '(11) 99999-5555',
    email: 'marina@appbello.com',
    commissionType: 'fixed',
    commissionValue: 0,
    services: [],
    active: true,
    hireDate: '2023-04-15',
  },
];

export const clients: Client[] = [
  {
    id: '1',
    name: 'João Pedro Almeida',
    email: 'joao.pedro@email.com',
    phone: '(11) 98888-1111',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200',
    birthDate: '1990-05-15',
    notes: 'Cliente VIP - sempre pontual',
    createdAt: '2023-01-10',
  },
  {
    id: '2',
    name: 'Maria Clara Santos',
    email: 'maria.clara@email.com',
    phone: '(11) 98888-2222',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    birthDate: '1985-11-20',
    notes: 'Prefere horários pela manhã',
    createdAt: '2023-02-15',
  },
  {
    id: '3',
    name: 'Lucas Ferreira',
    email: 'lucas.f@email.com',
    phone: '(11) 98888-3333',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    birthDate: '1995-03-08',
    createdAt: '2023-03-22',
  },
  {
    id: '4',
    name: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    phone: '(11) 98888-4444',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    birthDate: '1988-07-30',
    notes: 'Alergia a amônia',
    createdAt: '2023-04-05',
  },
  {
    id: '5',
    name: 'Roberto Gomes',
    email: 'roberto.g@email.com',
    phone: '(11) 98888-5555',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    birthDate: '1992-12-12',
    createdAt: '2023-05-18',
  },
];

export const clientAnamnesis: ClientAnamnesis[] = [
  {
    id: '1',
    clientId: '2',
    allergies: 'Alergia a amônia e parabenos',
    medications: 'Nenhuma',
    skinType: 'Sensível',
    hairType: 'Ondulado, fios finos',
    preferences: 'Prefere produtos naturais',
    observations: 'Evitar químicas fortes',
    lastUpdate: '2024-01-15',
  },
  {
    id: '2',
    clientId: '4',
    allergies: 'Alergia a amônia',
    medications: 'Anticoncepcional',
    skinType: 'Normal',
    hairType: 'Liso, fios grossos',
    preferences: 'Gosta de colorações mais claras',
    lastUpdate: '2024-02-20',
  },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Pomada Modeladora',
    description: 'Pomada para cabelo com fixação forte',
    price: 45.00,
    costPrice: 22.00,
    stock: 15,
    minStock: 5,
    category: 'Cabelo',
    active: true,
  },
  {
    id: '2',
    name: 'Óleo para Barba',
    description: 'Óleo hidratante para barba',
    price: 55.00,
    costPrice: 28.00,
    stock: 12,
    minStock: 3,
    category: 'Barba',
    active: true,
  },
  {
    id: '3',
    name: 'Shampoo Premium',
    description: 'Shampoo profissional 500ml',
    price: 68.00,
    costPrice: 35.00,
    stock: 8,
    minStock: 5,
    category: 'Cabelo',
    active: true,
  },
  {
    id: '4',
    name: 'Cera Capilar',
    description: 'Cera modeladora matte',
    price: 38.00,
    costPrice: 18.00,
    stock: 20,
    minStock: 8,
    category: 'Cabelo',
    active: true,
  },
  {
    id: '5',
    name: 'Esmalte Premium',
    description: 'Esmalte longa duração',
    price: 25.00,
    costPrice: 12.00,
    stock: 2,
    minStock: 10,
    category: 'Unhas',
    active: true,
  },
  {
    id: '6',
    name: 'Balm para Barba',
    description: 'Balm hidratante e modelador',
    price: 48.00,
    costPrice: 24.00,
    stock: 6,
    minStock: 4,
    category: 'Barba',
    active: true,
  },
];

export const transactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'Serviço',
    description: 'Corte + Barba - João Pedro',
    amount: 70.00,
    paymentMethod: 'pix',
    date: new Date().toISOString(),
    employeeId: '1',
    clientId: '1',
    status: 'paid',
  },
  {
    id: '2',
    type: 'income',
    category: 'Serviço',
    description: 'Escova Modeladora - Maria Clara',
    amount: 50.00,
    paymentMethod: 'credit',
    date: new Date().toISOString(),
    employeeId: '2',
    clientId: '2',
    status: 'paid',
  },
  {
    id: '3',
    type: 'income',
    category: 'Produto',
    description: 'Pomada Modeladora',
    amount: 45.00,
    paymentMethod: 'debit',
    date: new Date().toISOString(),
    clientId: '1',
    status: 'paid',
  },
  {
    id: '4',
    type: 'expense',
    category: 'Aluguel',
    description: 'Aluguel do mês',
    amount: 2500.00,
    paymentMethod: 'transfer',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'paid',
  },
  {
    id: '5',
    type: 'expense',
    category: 'Produtos',
    description: 'Reposição de estoque',
    amount: 850.00,
    paymentMethod: 'pix',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'paid',
  },
  {
    id: '6',
    type: 'income',
    category: 'Serviço',
    description: 'Manicure + Pedicure - Fernanda',
    amount: 80.00,
    paymentMethod: 'cash',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    employeeId: '4',
    clientId: '4',
    status: 'paid',
  },
  {
    id: '7',
    type: 'expense',
    category: 'Água/Luz',
    description: 'Conta de luz',
    amount: 380.00,
    paymentMethod: 'transfer',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'paid',
  },
];

export const comandas: Comanda[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'João Pedro Almeida',
    items: [
      { id: '1', type: 'service', itemId: '3', name: 'Corte + Barba', quantity: 1, unitPrice: 70, total: 70, employeeId: '1' },
      { id: '2', type: 'product', itemId: '1', name: 'Pomada Modeladora', quantity: 1, unitPrice: 45, total: 45 },
    ],
    total: 115,
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Maria Clara Santos',
    items: [
      { id: '1', type: 'service', itemId: '6', name: 'Escova Modeladora', quantity: 1, unitPrice: 50, total: 50, employeeId: '2' },
    ],
    total: 50,
    status: 'paid',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    closedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Funções auxiliares para cálculos
export const calculateDailyRevenue = (): number => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return transactions
    .filter(t => t.type === 'income' && t.date.startsWith(today) && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateMonthlyRevenue = (): number => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return transactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonth) && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateMonthlyExpenses = (): number => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth) && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const getEmployeeCommissions = (employeeId: string): number => {
  const employee = employees.find(e => e.id === employeeId);
  if (!employee) return 0;

  const employeeTransactions = transactions.filter(
    t => t.employeeId === employeeId && t.type === 'income' && t.status === 'paid'
  );

  const totalRevenue = employeeTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (employee.commissionType === 'percentage') {
    return totalRevenue * (employee.commissionValue / 100);
  }
  return employee.commissionValue * employeeTransactions.length;
};

export const getLowStockProducts = (): Product[] => {
  return products.filter(p => p.stock <= p.minStock && p.active);
};
