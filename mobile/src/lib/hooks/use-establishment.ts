import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { establishment as mockEstablishment } from '@/lib/mockData';
import type { Database } from '@/lib/database.types';

type EstablishmentInsert = Database['public']['Tables']['establishments']['Insert'];
type EstablishmentUpdate = Database['public']['Tables']['establishments']['Update'];

export function useEstablishmentById(establishmentId?: string) {
  return useQuery({
    queryKey: ['establishment', 'by-id', establishmentId],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !establishmentId) return null;
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('id', establishmentId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: isSupabaseConfigured() && Boolean(establishmentId),
  });
}

export function useEstablishment(userId?: string) {
  return useQuery({
    queryKey: ['establishment', userId],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !userId) return null;
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('owner_id', userId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: isSupabaseConfigured() && Boolean(userId),
  });
}

export function useEstablishmentOrMock(userId?: string) {
  const { data: supabaseData, isLoading } = useEstablishment(userId);
  if (!isSupabaseConfigured()) return { data: mockEstablishment, isLoading: false };
  return { data: supabaseData, isLoading };
}

export function useCreateEstablishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EstablishmentInsert) => {
      const { data, error } = await supabase
        .from('establishments')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['establishment', data.owner_id] });
    },
  });
}

export function useUpdateEstablishment(establishmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: EstablishmentUpdate) => {
      const { data, error } = await supabase
        .from('establishments')
        .update(updates)
        .eq('id', establishmentId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment'] });
    },
  });
}

function generateSlug(name: string, suffix: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return (base || 'meu-salao') + '-' + suffix;
}

async function ensureOwnerAsEmployee(establishmentId: string, userId: string, name: string): Promise<void> {
  try {
    const { data: employees } = await (supabase as any)
      .from('employees')
      .select('id')
      .eq('establishment_id', establishmentId)
      .limit(1);

    if (employees && employees.length > 0) return;

    const { data: user } = await supabase.auth.getUser();
    const email = user?.user?.email ?? '';

    await (supabase as any)
      .from('employees')
      .insert({
        establishment_id: establishmentId,
        name,
        email,
        role: 'professional',
        specialty: 'Proprietário',
        commission_type: 'percentage',
        commission_value: 0,
        active: true,
      });
  } catch (error) {
    console.error('ensureOwnerAsEmployee failed:', error);
  }
}

export async function ensureEstablishment(userId: string, name: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const slug = generateSlug(name, userId.slice(0, 6));

  // 1. Busca estabelecimento existente
  const { data: existing } = await supabase
    .from('establishments')
    .select('id, slug')
    .eq('owner_id', userId)
    .maybeSingle();

  if (existing) {
    if (!existing.slug) {
      await supabase.from('establishments').update({ slug } as any).eq('id', existing.id);
    }
    // Garante que o dono existe como employee
    await ensureOwnerAsEmployee(existing.id, userId, name);
    return existing.id;
  }

  // 2. Cria novo estabelecimento
  const { data: created } = await supabase
    .from('establishments')
    .insert({
      owner_id: userId,
      name,
      slug,
      active: true,
      business_type: 'salon',
    } as any)
    .select('id')
    .single();

  if (created?.id) {
    await ensureOwnerAsEmployee(created.id, userId, name);
  }

  return created?.id ?? null;
}
