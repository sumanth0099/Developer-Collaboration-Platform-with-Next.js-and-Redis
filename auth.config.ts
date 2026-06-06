import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true; // Redirect logic is handled manually in middleware.ts
    },
  },
  providers: [], // Providers are added in lib/auth.ts
} satisfies NextAuthConfig;
