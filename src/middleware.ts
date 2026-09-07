import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
  const isAdminPage = (pathname === '/admin' || pathname.startsWith('/admin/')) && !isAdminLogin;
  const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. FAIL-CLOSED: If Supabase credentials are missing, never permit access to admin pages or APIs
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminApi) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Dịch vụ xác thực chưa được cấu hình',
          },
        },
        { status: 401 }
      );
    }

    if (isAdminPage) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // 2. Initialize Supabase SSR client for cookie-based session management
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // 3. Resolve user from auth session cookies
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch (err) {
    console.error('[Middleware] Supabase auth.getUser exception:', err);
    user = null;
  }

  // 4. Intercept /api/admin/:path*
  if (isAdminApi) {
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Vui lòng đăng nhập để tiếp tục',
          },
        },
        { status: 401 }
      );
    }
  }

  // 5. Intercept /admin/:path* (excluding /admin/login)
  if (isAdminPage) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      const redirectResponse = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả request ngoại trừ:
     * - _next/static (static chunks)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, videos, flipmenu (public static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|pdf)$).*)',
  ],
};
