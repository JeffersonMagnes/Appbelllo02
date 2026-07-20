import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { AppointmentRepository } from '@/lib/modules/appointments/repository';
import { AppointmentService, type ServiceResult } from '@/lib/modules/appointments/service';

function response<T>(result: ServiceResult<T>) {
  if (!result.ok) return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status });
  return NextResponse.json(result.value);
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
