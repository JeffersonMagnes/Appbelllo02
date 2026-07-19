import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';

export async function GET(request: Request) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('establishment_id', establishment.id)
    .order('date')
    .order('time');

  if (date) query = query.eq('date', date);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...body, establishment_id: establishment.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
