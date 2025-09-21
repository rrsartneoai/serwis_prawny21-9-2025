import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Simplified middleware - detailed role checking is done client-side
  // This just handles basic route protection
  
  // Protected routes that require authentication
  const protectedRoutes = ["/admin", "/panel-operatora", "/panel-klienta"];
  
  // Check if accessing protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Check for basic auth token in cookies or headers
    const authCookie = request.cookies.get("auth-token");
    const authHeader = request.headers.get("authorization");
    
    // If no auth token found, redirect to login
    if (!authCookie && !authHeader) {
      return NextResponse.redirect(new URL("/logowanie", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/panel-operatora/:path*", "/panel-klienta/:path*"],
};
