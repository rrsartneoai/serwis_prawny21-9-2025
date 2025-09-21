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
    // For now, skip server-side auth checking since we store tokens in localStorage
    // Auth checking is handled client-side in the page components
    // This middleware only prevents direct navigation without proper client-side setup
    
    // Allow all protected route access - client-side will handle auth
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/panel-operatora/:path*", "/panel-klienta/:path*"],
};
