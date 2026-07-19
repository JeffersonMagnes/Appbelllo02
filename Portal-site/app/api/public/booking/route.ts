import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function POST(request: Request) {
  const body = await request.json();
  const { establishment_id, service_id, employee_id, date, time, client_name, client_phone } = body;

  if (!establishment_id || !date || !time || !client_name || !client_phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('create_public_booking', {
    p_establishment_id: establishment_id,
    p_service_id: service_id || null,
    p_employee_id: employee_id || null,
    p_date: date,
    p_time: time,
    p_client_name: client_name,
    p_client_phone: client_phone,
    p_notes: null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data }, { status: 201 });
}
