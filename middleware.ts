import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/auth');

  // Allow public access to the leads API for demo form submissions (POST and OPTIONS for CORS preflight)
  const isPublicApi = request.nextUrl.pathname === '/api/leads' && 
    (request.method === 'POST' || request.method === 'OPTIONS');

  if (!user && !isAuthPage && !isPublicApi) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check if user is an Auvora admin (for auth page redirect and root redirect)
  const isRootPage = request.nextUrl.pathname === '/';
  
  if (user && (isAuthPage || isRootPage)) {
    const { data: adminData } = await supabase
      .from('auvora_admins')
      .select('id')
      .eq('id', user.id)
      .single();

    // Redirect admins to /admin from auth pages or root
    if (adminData) {
      if (isAuthPage || isRootPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    } else if (isAuthPage) {
      // Non-admin on auth page - redirect to dashboard
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
