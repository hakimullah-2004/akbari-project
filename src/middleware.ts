import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const IDLE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const lastActivity = request.cookies.get("last_activity")?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/api/auth/login"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Idle timeout: if too long has passed since the last recorded activity, force logout
  if (lastActivity) {
    const idleFor = Date.now() - parseInt(lastActivity, 10);
    if (idleFor > IDLE_LIMIT_MS) {
      const isApi = pathname.startsWith("/api/");
      const response = isApi
        ? NextResponse.json({ error: "نشست شما به دلیل عدم فعالیت منقضی شده است" }, { status: 401 })
        : NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      response.cookies.delete("last_activity");
      return response;
    }
  }

  const response = NextResponse.next();
  const isHttps = request.nextUrl.protocol === "https:";
  response.cookies.set("last_activity", String(Date.now()), {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|images).*)"],
};
