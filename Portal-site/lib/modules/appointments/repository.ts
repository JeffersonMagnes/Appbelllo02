import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateAppointmentInput, UpdateAppointmentInput } from './contract';

export class AppointmentRepository {
  constructor(private readonly database: SupabaseClient, private readonly establishmentId: string) {}

  async list(date?: string | null) {
    let query = this.database
      .from('appointments')
      .select('*')
      .eq('establishment_id', this.establishmentId)
      .order('date')
      .order('time');
    if (date) query = query.eq('date', date);
    return query;
  }

  async create(input: CreateAppointmentInput) {
    return this.database
      .from('appointments')
      .insert({ ...input, establishment_id: this.establishmentId })
      .select()
      .single();
  }

  async update(id: string, input: UpdateAppointmentInput) {
    return this.database
      .from('appointments')
      .update(input)
      .eq('id', id)
      .eq('establishment_id', this.establishmentId)
      .select()
      .single();
  }

  async cancel(id: string) {
    return this.database
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('establishment_id', this.establishmentId)
      .select('id')
      .single();
  }
}
