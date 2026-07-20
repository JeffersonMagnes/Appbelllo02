import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { AppointmentRepository } from '@/lib/modules/appointments/repository';
import { AppointmentService, type ServiceResult } from '@/lib/modules/appointments/service';

function response<T>(result: ServiceResult<T>, successStatus = 200) {
  if (!result.ok) return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status });
  return NextResponse.json(result.value, { status: successStatus });
}

export async function GET(request: Request) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const service = new AppointmentService(new AppointmentRepository(supabase, establishment.id));
  return response(await service.list(date));
}

export async function POST(request: Request) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const service = new AppointmentService(new AppointmentRepository(supabase, establishment.id));
  return response(await service.create(await request.json()), 201);
}
