import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { AppointmentRepository } from '@/lib/modules/appointments/repository';
import { AppointmentService, type ServiceResult } from '@/lib/modules/appointments/service';
import { apiError, apiSuccess } from '@/lib/server/observability';

function response<T>(result: ServiceResult<T>) {
  if (!result.ok) return apiError(result.status, result.code, result.message, { module: 'appointments' });
  return apiSuccess(result.value);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const service = new AppointmentService(new AppointmentRepository(supabase, establishment.id));
  return response(await service.update(params.id, await request.json()));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const service = new AppointmentService(new AppointmentRepository(supabase, establishment.id));
  return response(await service.cancel(params.id));
}
