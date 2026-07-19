import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';

export async function GET() {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('establishment_id', establishment.id)
    .eq('active', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('services')
    .insert({ ...body, establishment_id: establishment.id, active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
