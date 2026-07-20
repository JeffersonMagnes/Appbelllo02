import { z } from 'zod';

export const appointmentStatusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled']);

const appointmentFields = {
  client_id: z.string().uuid().nullable().optional(),
  employee_id: z.string().uuid().nullable().optional(),
  service_id: z.string().uuid().nullable().optional(),
  client_name: z.string().trim().min(1).max(160).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  status: appointmentStatusSchema.optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
} as const;

export const createAppointmentSchema = z.object(appointmentFields).strict();
export const updateAppointmentSchema = z.object(appointmentFields).partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required',
);

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

export type AppointmentRecord = CreateAppointmentInput & {
  id: string;
  establishment_id: string;
  created_at: string;
};
