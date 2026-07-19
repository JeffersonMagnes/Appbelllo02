import { NextRequest, NextResponse } from 'next/server';
import { employeeAdminClient, readEmployeeSession } from '@/lib/server/employee-session';

export async function GET(request: NextRequest) {
  const session = await readEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin' && session.permissions.viewAgenda === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const date = request.nextUrl.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const supabase = employeeAdminClient();
  const [appointments, services, clients] = await Promise.all([
    supabase.from('appointments').select('id, client_name, client_id, service_id, date, time, status, notes')
      .eq('establishment_id', session.establishmentId).eq('employee_id', session.employeeId)
      .gte('date', date).order('date').order('time'),
    supabase.from('services').select('id, name, price, duration').eq('establishment_id', session.establishmentId),
    supabase.from('clients').select('id, name').eq('establishment_id', session.establishmentId),
  ]);

  const error = appointments.error || services.error || clients.error;
  if (error) return NextResponse.json({ error: 'Data unavailable' }, { status: 502 });
  return NextResponse.json({
    appointments: appointments.data || [],
    services: services.data || [],
    clients: clients.data || [],
  });
}
