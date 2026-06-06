import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import { User } from "@prisma/client";
import { authConfig } from "@/auth.config";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  reputation: number;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      reputation: number;
      name?: string | null;
      image?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await validateCredentials(
          credentials.email as string,
          credentials.password as string
        );
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          username: user.username,
          reputation: user.reputation,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        const email = user.email || profile?.email || `${profile?.login || "github"}@github.com`;
        const username = profile?.login as string || email.split("@")[0];
        const displayName = user.name || profile?.name || username;
        const avatarUrl = user.image || (profile as any)?.avatar_url || null;
        const githubId = profile?.id?.toString() || account.providerAccountId;

        // Auto-create or update user in database
        let dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!dbUser) {
          let finalUsername = username;
          let count = 0;
          while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
            count++;
            finalUsername = `${username}${count}`;
          }

          dbUser = await prisma.user.create({
            data: {
              email,
              username: finalUsername,
              displayName,
              avatarUrl,
              githubId,
              reputation: 0,
            },
          });
        } else if (!dbUser.githubId) {
          dbUser = await prisma.user.update({
            where: { email },
            data: { githubId, avatarUrl },
          });
        }

        user.id = dbUser.id;
        (user as any).username = dbUser.username;
        (user as any).reputation = dbUser.reputation;
        (user as any).displayName = dbUser.displayName;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = (user as any).username;
        token.displayName = (user as any).displayName || user.name;
        token.reputation = (user as any).reputation ?? 0;
      } else if (token.id) {
        // Refresh session data from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { reputation: true, username: true, displayName: true },
        });
        if (dbUser) {
          token.reputation = dbUser.reputation;
          token.username = dbUser.username;
          token.displayName = dbUser.displayName;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as any).username = token.username as string;
        (session.user as any).displayName = token.displayName as string;
        (session.user as any).reputation = token.reputation as number;
      }
      return session;
    },
  },
});

export async function validateCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user || !user.password) return null;
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  return user;
}

export async function getServerSession() {
  const session = await auth();
  if (!session || !session.user) return null;
  return session;
}

export async function getUserFromSession(
  req?: NextRequest
): Promise<SessionUser | null> {
  const session = req ? await auth(req as any) : await auth();
  if (!session?.user) return null;
  const user = session.user as any;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName || user.name || "",
    reputation: user.reputation ?? 0,
  };
}
