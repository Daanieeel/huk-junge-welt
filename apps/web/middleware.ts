import { NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/sign-in", "/sign-up"];
const SESSION_COOKIE = "better-auth.session_token";
const REST_URL =
  process.env.NEXT_PUBLIC_REST_URL ?? "http://localhost:3001";

async function getSession(request: NextRequest): Promise<boolean> {
  try {
    const res = await fetch(`${REST_URL}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!res.ok || res.status === 204) return false;
    const body: unknown = await res.json();
    return body !== null && typeof body === "object" && "user" in body;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // Fast path: no cookie → unauthenticated, no need to hit the API.
  if (!request.cookies.has(SESSION_COOKIE)) {
    if (isAuthRoute) return NextResponse.next();
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Cookie exists — validate the session against the REST API.
  const isAuthenticated = await getSession(request);

  if (!isAuthenticated) {
    if (isAuthRoute) return NextResponse.next();
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(url);
    // Clear the stale cookie so future requests hit the fast path.
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Authenticated user trying to access a sign-in/sign-up page.
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
