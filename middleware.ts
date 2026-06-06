import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis";

export async function checkRateLimit(
  ip: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `ratelimit:${ip}:${endpoint}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 100;
  const clearBefore = now - windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, clearBefore);
  pipeline.zcard(key);
  pipeline.zadd(key, {
    score: now,
    member: `${now}-${Math.random()}`,
  });
  pipeline.pexpire(key, windowMs);

  const results = await pipeline.exec();
  const count = results[1] as number;
  const allowed = count < maxRequests;
  const remaining = Math.max(0, maxRequests - count);
  const resetAt = now + windowMs;

  return { allowed, remaining, resetAt };
}

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // Rate Limiting for API routes
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const ip =
      req.ip ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "127.0.0.1";
    const limitResult = await checkRateLimit(ip, pathname);

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "rate_limit_exceeded", retryAfter: 60 },
        { status: 429 }
      );
    }
  }

  // Authentication Redirects
  const isLoggedIn = !!req.auth;
  const protectedRoutes = [
    "/feed",
    "/submit",
    "/profile",
    "/review",
    "/leaderboard",
  ];
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/feed/:path*",
    "/submit/:path*",
    "/profile/:path*",
    "/review/:path*",
    "/leaderboard/:path*",
    "/api/:path*",
  ],
};
