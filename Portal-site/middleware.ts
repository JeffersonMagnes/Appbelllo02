import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

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
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAdminArea) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin-login', req.url));
    }
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (!adminUser) {
      return NextResponse.redirect(new URL('/admin-login', req.url));
    }
  }

  if (isAuthPage && session) {
    // Check if the user is a professional to route them properly, otherwise dashboard
    // We will just redirect to dashboard for now.
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profissional/:path*', '/admin/:path*', '/login', '/cadastro', '/recuperar-senha', '/nova-senha'],
};
