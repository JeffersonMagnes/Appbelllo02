export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
          business_type: string;
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
          business_type?: string;
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
          business_type?: string;
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
        Relationships: [];
      };
      professionals: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          avatar: string | null;
          specialty: string | null;
          rating: number;
          review_count: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          avatar?: string | null;
          specialty?: string | null;
          rating?: number;
          review_count?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          avatar?: string | null;
          specialty?: string | null;
          rating?: number;
          review_count?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      service_categories: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          icon?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          establishment_id: string;
          category: string | null;
          name: string;
          description: string | null;
          duration: number;
          price: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          category?: string | null;
          name: string;
          description?: string | null;
          duration: number;
          price: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          category?: string | null;
          name?: string;
          description?: string | null;
          duration?: number;
          price?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      professional_services: {
        Row: {
          professional_id: string;
          service_id: string;
        };
        Insert: {
          professional_id: string;
          service_id: string;
        };
        Update: {
          professional_id?: string;
          service_id?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          birth_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          establishment_id: string;
          client_id: string | null;
          employee_id: string | null;
          service_id: string | null;
          date: string;
          time: string;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes: string | null;
          client_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          client_id?: string | null;
          employee_id?: string | null;
          service_id?: string | null;
          date: string;
          time: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes?: string | null;
          client_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          client_id?: string | null;
          employee_id?: string | null;
          service_id?: string | null;
          date?: string;
          time?: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          notes?: string | null;
          client_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          avatar_url: string | null;
          role: 'admin' | 'receptionist' | 'professional';
          specialty: string | null;
          phone: string | null;
          email: string | null;
          pin: string | null;
          commission_type: 'fixed' | 'percentage';
          commission_value: number;
          active: boolean;
          hire_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          avatar_url?: string | null;
          role?: 'admin' | 'receptionist' | 'professional';
          specialty?: string | null;
          phone?: string | null;
          email?: string | null;
          pin?: string | null;
          commission_type?: 'fixed' | 'percentage';
          commission_value?: number;
          active?: boolean;
          hire_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'receptionist' | 'professional';
          specialty?: string | null;
          phone?: string | null;
          email?: string | null;
          pin?: string | null;
          commission_type?: 'fixed' | 'percentage';
          commission_value?: number;
          active?: boolean;
          hire_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          description: string | null;
          price: number;
          cost_price: number;
          stock: number;
          min_stock: number;
          category: string | null;
          active: boolean;
          image_url: string | null;
          sell_online: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          description?: string | null;
          price: number;
          cost_price?: number;
          stock?: number;
          min_stock?: number;
          category?: string | null;
          active?: boolean;
          image_url?: string | null;
          sell_online?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          cost_price?: number;
          stock?: number;
          min_stock?: number;
          category?: string | null;
          active?: boolean;
          image_url?: string | null;
          sell_online?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          establishment_id: string;
          type: 'income' | 'expense';
          category: string;
          description: string;
          amount: number;
          payment_method: 'cash' | 'credit' | 'debit' | 'pix' | 'transfer';
          date: string;
          employee_id: string | null;
          client_id: string | null;
          status: 'pending' | 'paid' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          type: 'income' | 'expense';
          category: string;
          description: string;
          amount: number;
          payment_method: 'cash' | 'credit' | 'debit' | 'pix' | 'transfer';
          date: string;
          employee_id?: string | null;
          client_id?: string | null;
          status?: 'pending' | 'paid' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          type?: 'income' | 'expense';
          category?: string;
          description?: string;
          amount?: number;
          payment_method?: 'cash' | 'credit' | 'debit' | 'pix' | 'transfer';
          date?: string;
          employee_id?: string | null;
          client_id?: string | null;
          status?: 'pending' | 'paid' | 'cancelled';
          created_at?: string;
        };
        Relationships: [];
      };
      service_packages: {
        Row: { id: string; establishment_id: string; name: string; description: string | null; price: number; sessions: number; validity_days: number; discount_percent: number | null; service_ids: string[]; active: boolean; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; description?: string | null; price: number; sessions: number; validity_days: number; discount_percent?: number | null; service_ids: string[]; active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; description?: string | null; price?: number; sessions?: number; validity_days?: number; discount_percent?: number | null; service_ids?: string[]; active?: boolean };
        Relationships: [];
      };
      comandas: {
        Row: { id: string; establishment_id: string; client_id: string | null; client_name: string | null; employee_id: string | null; status: string; total: number; discount: number | null; payment_method: string | null; notes: string | null; closed_at: string | null; created_at: string };
        Insert: { id?: string; establishment_id: string; client_id?: string | null; client_name?: string | null; employee_id?: string | null; status?: string; total?: number; discount?: number | null; payment_method?: string | null; notes?: string | null; closed_at?: string | null; created_at?: string };
        Update: { id?: string; client_name?: string | null; status?: string; total?: number; discount?: number | null; payment_method?: string | null; notes?: string | null; closed_at?: string | null };
        Relationships: [];
      };
      comanda_items: {
        Row: { id: string; comanda_id: string; type: string | null; service_id: string | null; product_id: string | null; name: string; description: string | null; quantity: number; price: number; unit_price: number | null; employee_id: string | null; created_at: string };
        Insert: { id?: string; comanda_id: string; type?: string | null; service_id?: string | null; product_id?: string | null; name: string; description?: string | null; quantity?: number; price: number; unit_price?: number | null; employee_id?: string | null; created_at?: string };
        Update: { id?: string; name?: string; description?: string | null; quantity?: number; price?: number; unit_price?: number | null; employee_id?: string | null };
        Relationships: [];
      };
      online_orders: {
        Row: { id: string; establishment_id: string; client_name: string; client_phone: string | null; status: string; total: number; created_at: string };
        Insert: { id?: string; establishment_id: string; client_name: string; client_phone?: string | null; status?: string; total?: number; created_at?: string };
        Update: { id?: string; status?: string; total?: number };
        Relationships: [];
      };
      online_order_items: {
        Row: { id: string; order_id: string; product_id: string; name: string; quantity: number; price: number };
        Insert: { id?: string; order_id: string; product_id: string; name: string; quantity?: number; price: number };
        Update: { id?: string; quantity?: number; price?: number };
        Relationships: [];
      };
      anamnesis_templates: {
        Row: { id: string; establishment_id: string; name: string; fields: Json; active: boolean; created_at: string };
        Insert: { id?: string; establishment_id: string; name: string; fields: Json; active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; fields?: Json; active?: boolean };
        Relationships: [];
      };
      anamnesis_submissions: {
        Row: { id: string; template_id: string; client_id: string; establishment_id: string; data: Json; created_at: string };
        Insert: { id?: string; template_id: string; client_id: string; establishment_id: string; data: Json; created_at?: string };
        Update: { id?: string; data?: Json };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row types
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbEstablishment = Database['public']['Tables']['establishments']['Row'];
export type DbProfessional = Database['public']['Tables']['professionals']['Row'];
export type DbServiceCategory = Database['public']['Tables']['service_categories']['Row'];
export type DbService = Database['public']['Tables']['services']['Row'];
export type DbClient = Database['public']['Tables']['clients']['Row'];
export type DbAppointment = Database['public']['Tables']['appointments']['Row'];
export type DbEmployee = Database['public']['Tables']['employees']['Row'];
export type DbProduct = Database['public']['Tables']['products']['Row'];
export type DbTransaction = Database['public']['Tables']['transactions']['Row'];
export type DbServicePackage = Database['public']['Tables']['service_packages']['Row'];
export type DbComanda = Database['public']['Tables']['comandas']['Row'];
export type DbComandaItem = Database['public']['Tables']['comanda_items']['Row'];
export type DbOnlineOrder = Database['public']['Tables']['online_orders']['Row'];
export type DbOnlineOrderItem = Database['public']['Tables']['online_order_items']['Row'];
export type DbAnamnesisTemplate = Database['public']['Tables']['anamnesis_templates']['Row'];
export type DbAnamnesisSubmission = Database['public']['Tables']['anamnesis_submissions']['Row'];
