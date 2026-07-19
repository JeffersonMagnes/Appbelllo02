import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createServerSupabase();
  const { data, error } = await (supabase as any).rpc('get_public_storefront', { p_slug: params.slug });
  if (error || !data?.establishment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ establishment: data.establishment, products: data.products || [] });
}
