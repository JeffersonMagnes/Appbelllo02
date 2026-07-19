import { NextResponse } from 'next/server';
import { employeeAdminClient, readEmployeeSession } from '@/lib/server/employee-session';

export async function GET() {
  const session = await readEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin' && session.permissions.viewClients === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await employeeAdminClient()
    .from('clients')
    .select('id, name, email, phone, birth_date, notes')
    .eq('establishment_id', session.establishmentId)
    .order('name');
  if (error) return NextResponse.json({ error: 'Data unavailable' }, { status: 502 });
  return NextResponse.json(data || []);
}

