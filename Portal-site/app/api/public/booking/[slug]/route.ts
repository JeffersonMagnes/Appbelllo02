import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const supabase = getSupabase();
  const { data, error } = await (supabase as any).rpc('get_public_storefront', { p_slug: params.slug });
  if (error || !data?.establishment) {
    return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });
  }
  return NextResponse.json({
    establishment: data.establishment,
    services: data.services || [],
    professionals: data.professionals || [],
  });
}
