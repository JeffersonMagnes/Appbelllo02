// Lightweight Supabase JWT verification, no SDK dependency needed: this
// backend already talks to Supabase Auth's REST API directly for the
// password-reset page (see index.ts), so the same fetch-based pattern is
// reused here rather than adding @supabase/supabase-js to a service that
// otherwise has no database of its own.

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export async function verifySupabaseUser(
  authHeader: string | null | undefined
): Promise<AuthenticatedUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("verifySupabaseUser: Supabase URL/anon key not configured");
    return null;
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string; email?: string };
    if (!user?.id) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

// Simple in-memory sliding-window limiter. This process is a long-running
// Bun server (not per-request serverless), so in-memory state persists
// reliably across requests here — unlike the short-lived Netlify functions
// elsewhere in this project, where the same pattern would be illusory.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
