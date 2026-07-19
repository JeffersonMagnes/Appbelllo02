'use client';

import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
};
