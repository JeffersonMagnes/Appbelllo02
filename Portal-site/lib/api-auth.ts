import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase/server';

// Resolves the signed-in owner for API routes. Two credentials are supported:
//  - `Authorization: Bearer <supabase access token>` (native mobile app). The
//    token is validated by Supabase and, when present, is the only credential
//    considered: an invalid Bearer never falls back to a cookie.
//  - the cookie session (web). A plain supabase-js client never reads the auth
//    cookie, so the cookie-aware server client is required here.
// Employee sessions are a different credential, handled by
// readActiveEmployeeSession on /api/employee/* — they are not accepted here.
export async function getAuthUser() {
  const authorization = headers().get('authorization');
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  let supabase: SupabaseClient;
  let user: User | null;

  if (bearer) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      }
    );
    ({ data: { user } } = await supabase.auth.getUser(bearer));
  } else {
    supabase = createServerSupabase() as unknown as SupabaseClient;
    ({ data: { user } } = await supabase.auth.getUser());
  }

  if (!user) return { user: null, supabase, establishment: null };

  const { data: establishment } = await supabase
    .from('establishments')
    .select('id, name, slug')
    .eq('owner_id', user.id)
    .maybeSingle();

  return { user, supabase, establishment };
}

export async function getAdminUser() {
  // Cookie-aware server client (same one the middleware uses). A plain
  // supabase-js client with persistSession:false never reads the auth cookie,
  // so every admin page bounced back to /admin-login.
  const supabase = createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null };

  const { data } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  const adminUser = data as { role: string } | null;

  if (!adminUser) return { user: null, role: null };

  return { user, role: adminUser.role };
}
