import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const isAuthRoute = req.nextUrl.pathname.includes("/login");
  const token = req.cookies.get("access_token")?.value; // adjust cookie name for Django session

  // If not logged in and trying to access a protected page
  if (!token && !isAuthRoute) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login page
  if (token && isAuthRoute) {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|static|.*\\..*|_next|favicon.ico|sitemap.xml|robots.txt|login).*)",
  ],
};
