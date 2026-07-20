import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { createBillingAdminClient } from './admin';

export async function getBillingAuth(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      const admin = createBillingAdminClient();
      const { data: establishment } = await admin
        .from('establishments')
        .select('id, name, slug')
        .eq('owner_id', user.id)
        .maybeSingle();
      return { user, establishment };
    }
  }

  const { user, establishment } = await getAuthUser();
  return { user, establishment };
}
