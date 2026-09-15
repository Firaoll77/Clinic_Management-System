import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/'];

// Role-specific dashboard routes
const roleRoutes: Record<string, string> = {
  '/dashboard/doctor': 'DOCTOR',
  '/dashboard/admin': 'ADMIN',
  '/dashboard/nurse': 'NURSE',
  '/dashboard/receptionist': 'RECEPTIONIST',
  '/dashboard/laboratorist': 'LAB_TECH',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    // If user is already authenticated and tries to access login, redirect to dashboard
    if (pathname === '/login' || pathname === '/register') {
      const accessToken = request.cookies.get('accessToken')?.value;
      if (accessToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Check for authentication cookie
  const accessToken = request.cookies.get('accessToken')?.value;

  // If no access token and trying to access protected route, redirect to login
  if (!accessToken && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and accessing a role-specific route, verify role
  if (accessToken && pathname.startsWith('/dashboard')) {
    // For main dashboard, let it handle role-based redirect
    if (pathname === '/dashboard') {
      return NextResponse.next();
    }

    // Check role-specific routes
    for (const [route, requiredRole] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route)) {
        // We can't verify role without making an API call
        // For now, let the page handle role verification
        // In production, you could add a role cookie or make a server-side API call
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
