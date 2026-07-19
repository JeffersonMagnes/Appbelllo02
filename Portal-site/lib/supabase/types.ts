export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; name: string | null; email: string | null; avatar_url: string | null; created_at: string };
        Insert: { id: string; name?: string | null; email?: string | null; avatar_url?: string | null; created_at?: string };
        Update: { id?: string; name?: string | null; email?: string | null; avatar_url?: string | null };
      };
      establishments: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string | null;
          logo_url: string | null;
          banner_url: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          phone: string | null;
          whatsapp: string | null;
          instagram: string | null;
          business_type: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          bio: string | null;
          hours_json: Json | null;
          custom_links: Json | null;
          active: boolean;
          has_demo_data: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          business_type?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          bio?: string | null;
          hours_json?: Json | null;
          custom_links?: Json | null;
          active?: boolean;
          has_demo_data?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          business_type?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          bio?: string | null;
          hours_json?: Json | null;
          custom_links?: Json | null;
          active?: boolean;
          has_demo_data?: boolean;
          updated_at?: string;
        };
      };
      services: {
        Row: { id: string; establishment_id: string; name: string; description: string | null; price: number; duration: number; category: string | null; active: boolean; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; description?: string | null; price: number; duration: number; category?: string | null; active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; description?: string | null; price?: number; duration?: number; category?: string | null; active?: boolean };
      };
      clients: {
        Row: { id: string; establishment_id: string; name: string; email: string | null; phone: string | null; avatar_url: string | null; birth_date: string | null; notes: string | null; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; email?: string | null; phone?: string | null; avatar_url?: string | null; birth_date?: string | null; notes?: string | null; created_at?: string };
        Update: { id?: string; name?: string; email?: string | null; phone?: string | null; avatar_url?: string | null; birth_date?: string | null; notes?: string | null };
      };
      appointments: {
        Row: { id: string; establishment_id: string; client_id: string | null; employee_id: string | null; service_id: string | null; date: string; time: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled'; notes: string | null; client_name: string | null; created_at: string };
        Insert: { id?: string; establishment_id: string; client_id?: string | null; employee_id?: string | null; service_id?: string | null; date: string; time: string; status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'; notes?: string | null; client_name?: string | null; created_at?: string };
        Update: { id?: string; client_id?: string | null; employee_id?: string | null; service_id?: string | null; date?: string; time?: string; status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'; notes?: string | null; client_name?: string | null };
      };
      employees: {
        Row: { id: string; establishment_id: string; name: string; avatar_url: string | null; role: 'admin' | 'receptionist' | 'professional'; specialty: string | null; phone: string | null; email: string | null; pin: string | null; commission_type: 'fixed' | 'percentage'; commission_value: number; active: boolean; hire_date: string | null; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; avatar_url?: string | null; role?: 'admin' | 'receptionist' | 'professional'; specialty?: string | null; phone?: string | null; email?: string | null; pin?: string | null; commission_type?: 'fixed' | 'percentage'; commission_value?: number; active?: boolean; hire_date?: string | null; created_at?: string };
        Update: { id?: string; name?: string; avatar_url?: string | null; role?: 'admin' | 'receptionist' | 'professional'; specialty?: string | null; phone?: string | null; email?: string | null; pin?: string | null; commission_type?: 'fixed' | 'percentage'; commission_value?: number; active?: boolean; hire_date?: string | null };
      };
      products: {
        Row: { id: string; establishment_id: string; name: string; price: number; cost_price: number | null; stock: number; min_stock: number; category: string | null; description: string | null; image_url: string | null; sell_online: boolean; barcode: string | null; active: boolean; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; price: number; cost_price?: number | null; stock?: number; min_stock?: number; category?: string | null; description?: string | null; image_url?: string | null; sell_online?: boolean; barcode?: string | null; active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; price?: number; cost_price?: number | null; stock?: number; min_stock?: number; category?: string | null; description?: string | null; image_url?: string | null; sell_online?: boolean; barcode?: string | null; active?: boolean };
      };
      product_images: {
        Row: { id: string; product_id: string; image_url: string; sort_order: number; created_at: string };
        Insert: { id?: string; product_id: string; image_url: string; sort_order?: number; created_at?: string };
        Update: { id?: string; product_id?: string; image_url?: string; sort_order?: number };
      };
      transactions: {
        Row: { id: string; establishment_id: string; type: 'income' | 'expense'; category: string; description: string | null; amount: number; payment_method: 'cash' | 'credit' | 'debit' | 'pix' | 'transfer'; date: string; employee_id: string | null; client_id: string | null; status: 'pending' | 'paid' | 'cancelled'; created_at: string };
        Insert: { id?: string; establishment_id: string; type: 'income' | 'expense'; category: string; description?: string | null; amount: number; payment_method: 'cash' | 'credit' | 'debit' | 'pix' | 'transfer'; date: string; employee_id?: string | null; client_id?: string | null; status?: 'pending' | 'paid' | 'cancelled'; created_at?: string };
        Update: { id?: string; type?: 'income' | 'expense'; category?: string; description?: string | null; amount?: number; payment_method?: 'cash' | 'credit' | 'debit' | 'pix' | 'transfer'; date?: string; employee_id?: string | null; client_id?: string | null; status?: 'pending' | 'paid' | 'cancelled' };
      };
      professionals: {
        Row: { id: string; establishment_id: string; name: string; specialty: string | null; avatar: string | null; rating: number | null; review_count: number; active: boolean; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; specialty?: string | null; avatar?: string | null; rating?: number | null; review_count?: number; active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; specialty?: string | null; avatar?: string | null; rating?: number | null; review_count?: number; active?: boolean };
      };
      professional_services: {
        Row: { professional_id: string; service_id: string };
        Insert: { professional_id: string; service_id: string };
        Update: { professional_id?: string; service_id?: string };
      };
      service_categories: {
        Row: { id: string; establishment_id: string; name: string; icon: string | null; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; icon?: string | null; created_at?: string };
        Update: { id?: string; name?: string; icon?: string | null };
      };
      service_packages: {
        Row: { id: string; establishment_id: string; name: string; description: string | null; price: number; sessions: number; validity_days: number; discount_percent: number | null; service_ids: string[]; active: boolean; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; description?: string | null; price: number; sessions: number; validity_days: number; discount_percent?: number | null; service_ids: string[]; active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; description?: string | null; price?: number; sessions?: number; validity_days?: number; discount_percent?: number | null; service_ids?: string[]; active?: boolean };
      };
      comandas: {
        Row: { id: string; establishment_id: string; client_id: string | null; employee_id: string | null; status: string; total: number; notes: string | null; created_at: string };
        Insert: { id?: string; establishment_id: string; client_id?: string | null; employee_id?: string | null; status?: string; total?: number; notes?: string | null; created_at?: string };
        Update: { id?: string; status?: string; total?: number; notes?: string | null };
      };
      comanda_items: {
        Row: { id: string; comanda_id: string; service_id: string | null; product_id: string | null; name: string; quantity: number; price: number; created_at: string };
        Insert: { id?: string; comanda_id: string; service_id?: string | null; product_id?: string | null; name: string; quantity?: number; price: number; created_at?: string };
        Update: { id?: string; name?: string; quantity?: number; price?: number };
      };
      online_orders: {
        Row: { id: string; establishment_id: string; client_name: string; client_phone: string | null; status: string; total: number; created_at: string };
        Insert: { id?: string; establishment_id: string; client_name: string; client_phone?: string | null; status?: string; total?: number; created_at?: string };
        Update: { id?: string; status?: string; total?: number };
      };
      online_order_items: {
        Row: { id: string; order_id: string; product_id: string; name: string; quantity: number; price: number };
        Insert: { id?: string; order_id: string; product_id: string; name: string; quantity?: number; price: number };
        Update: { id?: string; quantity?: number; price?: number };
      };
      anamnesis_templates: {
        Row: { id: string; establishment_id: string; name: string; fields: Json; active: boolean; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; fields: Json; active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; fields?: Json; active?: boolean };
      };
      anamnesis_submissions: {
        Row: { id: string; template_id: string; client_id: string; establishment_id: string; data: Json; created_at: string };
        Insert: { id?: string; template_id: string; client_id: string; establishment_id: string; data: Json; created_at?: string };
        Update: { id?: string; data?: Json };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_admin_establishments: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          owner_id: string;
          establishment_name: string;
          slug: string | null;
          logo_url: string | null;
          business_type: string | null;
          phone: string | null;
          address: string | null;
          active: boolean;
          created_at: string;
          owner_name: string;
          owner_email: string;
          professionals_count: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Establishment = Tables<'establishments'>;
export type Service = Tables<'services'>;
export type Client = Tables<'clients'>;
export type Appointment = Tables<'appointments'>;
export type Employee = Tables<'employees'>;
export type Product = Tables<'products'>;
export type ProductImage = Tables<'product_images'>;
export type Transaction = Tables<'transactions'>;
export type Profile = Tables<'profiles'>;
export type Professional = Tables<'professionals'>;
export type ServicePackage = Tables<'service_packages'>;
export type Comanda = Tables<'comandas'>;
export type ComandaItem = Tables<'comanda_items'>;
export type OnlineOrder = Tables<'online_orders'>;
export type OnlineOrderItem = Tables<'online_order_items'>;
export type AnamnesisTemplate = Tables<'anamnesis_templates'>;
export type AnamnesisSubmission = Tables<'anamnesis_submissions'>;
