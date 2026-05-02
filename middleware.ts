import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Routes that require authentication
const AUTH_REQUIRED_ROUTES = ['/dashboard', '/profile', '/tournaments/create', '/clans/create', '/notifications', '/admin'];
// Routes that require onboarding to be complete (subset of above, NOT /onboarding itself)
const ONBOARDING_REQUIRED_ROUTES = ['/dashboard', '/profile', '/tournaments/create', '/clans/create', '/notifications'];
// Auth-only pages — redirect logged-in users away
const AUTH_ONLY_ROUTES = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // ── 1. Redirect logged-in users away from auth pages ──────────────
  if (user && AUTH_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── 2. Protect routes that require authentication ──────────────────
  if (!user && AUTH_REQUIRED_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── 3. Admin protection ────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url));
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile?.is_admin) return NextResponse.redirect(new URL('/', request.url));
  }

  // ── 4. Onboarding guard ────────────────────────────────────────────
  // Only runs on specific protected pages (NOT /onboarding itself)
  // If user is logged in but hasn't completed onboarding → send to /onboarding
  if (
    user &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/auth') &&
    ONBOARDING_REQUIRED_ROUTES.some(r => pathname.startsWith(r))
  ) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle(); // Use maybeSingle so missing rows don't throw an error

    // Only redirect if the profile row exists AND onboarding is explicitly false
    if (profile && profile.onboarding_complete === false) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
