// Appbello - Types

export interface Professional {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  services: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // em minutos
  price: number;
  category: string;
  professionals: string[]; // IDs dos profissionais
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName?: string;
  professionalId: string;
  serviceId: string;
  date: string; // ISO date
  time: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Establishment {
  id: string;
  name: string;
  logo: string;
  address: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  workingHours: {
    [key: string]: { open: string; close: string } | null;
  };
}

// ============ GESTÃO ADMINISTRATIVA ============

export interface Employee {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'receptionist' | 'professional';
  specialty?: string;
  phone: string;
  email: string;
  commissionType: 'fixed' | 'percentage';
  commissionValue: number; // valor fixo ou percentual
  services: string[];
  active: boolean;
  hireDate: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  category: string;
  supplierId?: string;
  barcode?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'pix' | 'transfer';
  date: string;
  relatedAppointmentId?: string;
  relatedProductId?: string;
  employeeId?: string;
  clientId?: string;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface Commission {
  id: string;
  employeeId: string;
  appointmentId?: string;
  productSaleId?: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
}

export interface Comanda {
  id: string;
  clientId: string;
  clientName: string;
  items: ComandaItem[];
  total: number;
  status: 'open' | 'closed' | 'paid';
  createdAt: string;
  closedAt?: string;
}

export interface ComandaItem {
  id: string;
  type: 'service' | 'product';
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  employeeId?: string;
}

export interface ClientAnamnesis {
  id: string;
  clientId: string;
  allergies?: string;
  medications?: string;
  healthConditions?: string;
  skinType?: string;
  hairType?: string;
  preferences?: string;
  observations?: string;
  lastUpdate: string;
}

export interface DailyReport {
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  appointmentsCount: number;
  productsSold: number;
  newClients: number;
  topServices: { serviceId: string; count: number; revenue: number }[];
  topEmployees: { employeeId: string; revenue: number; appointments: number }[];
}

export interface FinancialSummary {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeByCategory: { category: string; amount: number }[];
  expensesByCategory: { category: string; amount: number }[];
  paymentMethods: { method: string; amount: number }[];
  commissionsPaid: number;
  commissionsPending: number;
}
