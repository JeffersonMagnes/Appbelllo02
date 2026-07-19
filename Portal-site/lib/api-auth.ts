import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function getAuthUser() {
  const cookieStore = cookies();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { user: null, supabase, establishment: null };

  const { data: establishment } = await supabase
    .from('establishments')
    .select('id, name, slug')
    .eq('owner_id', session.user.id)
    .maybeSingle();

  return { user: session.user, supabase, establishment };
}

export async function getAdminUser() {
  const cookieStore = cookies();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { user: null, role: null };

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!adminUser) return { user: null, role: null };

  return { user: session.user, role: adminUser.role as string };
}
