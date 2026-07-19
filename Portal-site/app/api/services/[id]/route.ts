import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('services')
    .update(body)
    .eq('id', params.id)
    .eq('establishment_id', establishment.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const { error } = await supabase
    .from('services')
    .update({ active: false })
    .eq('id', params.id)
    .eq('establishment_id', establishment.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
