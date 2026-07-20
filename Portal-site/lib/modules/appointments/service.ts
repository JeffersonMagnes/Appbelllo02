import { z } from 'zod';
import { createAppointmentSchema, updateAppointmentSchema } from './contract';
import { AppointmentRepository } from './repository';

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: 400 | 404 | 409 | 500; code: string; message: string };

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const uuidSchema = z.string().uuid();

function repositoryError<T>(error: { code?: string; message: string } | null): ServiceResult<T> {
  if (error?.code === '23P01') return { ok: false, status: 409, code: 'SCHEDULE_CONFLICT', message: 'Horário indisponível.' };
  if (error?.code === 'PGRST116') return { ok: false, status: 404, code: 'NOT_FOUND', message: 'Agendamento não encontrado.' };
  return { ok: false, status: 500, code: 'DATA_UNAVAILABLE', message: 'Não foi possível concluir a operação.' };
}

export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}

  async list(date?: string | null): Promise<ServiceResult<unknown[]>> {
    if (date && !isoDateSchema.safeParse(date).success) {
      return { ok: false, status: 400, code: 'BAD_REQUEST', message: 'Data inválida.' };
    }
    const { data, error } = await this.repository.list(date);
    return error ? repositoryError(error) : { ok: true, value: data ?? [] };
  }

  async create(raw: unknown): Promise<ServiceResult<unknown>> {
    const parsed = createAppointmentSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, status: 400, code: 'BAD_REQUEST', message: 'Dados do agendamento inválidos.' };
    const { data, error } = await this.repository.create(parsed.data);
    return error ? repositoryError(error) : { ok: true, value: data };
  }

  async update(id: string, raw: unknown): Promise<ServiceResult<unknown>> {
    if (!uuidSchema.safeParse(id).success) return { ok: false, status: 400, code: 'BAD_REQUEST', message: 'Identificador inválido.' };
    const parsed = updateAppointmentSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, status: 400, code: 'BAD_REQUEST', message: 'Dados do agendamento inválidos.' };
    const { data, error } = await this.repository.update(id, parsed.data);
    return error ? repositoryError(error) : { ok: true, value: data };
  }

  async cancel(id: string): Promise<ServiceResult<{ success: true }>> {
    if (!uuidSchema.safeParse(id).success) return { ok: false, status: 400, code: 'BAD_REQUEST', message: 'Identificador inválido.' };
    const { error } = await this.repository.cancel(id);
    return error ? repositoryError(error) : { ok: true, value: { success: true } };
  }
}
