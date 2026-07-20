import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const requestCorrelationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  requestHeaders.set('x-correlation-id', requestCorrelationId);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('x-correlation-id', requestCorrelationId);

  if (req.nextUrl.pathname.startsWith('/api/')) return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthPage =
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/cadastro') ||
    req.nextUrl.pathname.startsWith('/recuperar-senha') ||
    req.nextUrl.pathname.startsWith('/nova-senha');

  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/profissional');
  const isAdminArea = req.nextUrl.pathname.startsWith('/admin');

  if (isDashboard && !session) {
    const redirect = NextResponse.redirect(new URL('/login', req.url));
    redirect.headers.set('x-correlation-id', requestCorrelationId);
    return redirect;
  }

  if (isAdminArea) {
    if (!session) {
      const redirect = NextResponse.redirect(new URL('/admin-login', req.url));
      redirect.headers.set('x-correlation-id', requestCorrelationId);
      return redirect;
    }
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (!adminUser) {
      const redirect = NextResponse.redirect(new URL('/admin-login', req.url));
      redirect.headers.set('x-correlation-id', requestCorrelationId);
      return redirect;
    }
  }

  if (isAuthPage && session) {
    // Check if the user is a professional to route them properly, otherwise dashboard
    // We will just redirect to dashboard for now.
    const redirect = NextResponse.redirect(new URL('/dashboard', req.url));
    redirect.headers.set('x-correlation-id', requestCorrelationId);
    return redirect;
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/profissional/:path*', '/admin/:path*', '/login', '/cadastro', '/recuperar-senha', '/nova-senha'],
};
