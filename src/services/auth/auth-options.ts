import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { Role } from "@prisma/client";

import { prisma } from "@/server/repositories/prisma";
import { hydrateAuthEnvironment } from "@/services/auth/env";
import { buildLoginThrottleKey, clearFailedLogins, isLoginBlocked, registerFailedLogin } from "@/services/auth/login-throttle";
import { SESSION_MAX_AGE_SECONDS } from "@/services/auth/session-policy";

const { authSecret } = hydrateAuthEnvironment();

export const authOptions: NextAuthOptions = {
  secret: authSecret ?? undefined,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const throttleKey = buildLoginThrottleKey(email, request.headers);
        if (isLoginBlocked(throttleKey)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });

        if (!user || !user.isActive) {
          registerFailedLogin(throttleKey);
          return null;
        }

        if (user.role !== Role.SUPER_ADMIN && (!user.tenantId || !user.tenant?.isActive)) {
          registerFailedLogin(throttleKey);
          return null;
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          registerFailedLogin(throttleKey);
          return null;
        }

        clearFailedLogins(throttleKey);

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = user.role;
        token.tenantId = user.tenantId ?? null;
        return token;
      }

      if (trigger === "update" && token.sub) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { tenant: true },
        });

        if (!currentUser || !currentUser.isActive) {
          delete token.sub;
          delete token.role;
          delete token.tenantId;
          delete token.email;
          return token;
        }

        if (
          currentUser.role !== Role.SUPER_ADMIN &&
          (!currentUser.tenantId || !currentUser.tenant?.isActive)
        ) {
          delete token.sub;
          delete token.role;
          delete token.tenantId;
          delete token.email;
          return token;
        }

        token.email = currentUser.email;
        token.role = currentUser.role;
        token.tenantId = currentUser.tenantId ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.role) {
        session.user.id = token.sub;
        session.user.email = token.email ?? null;
        session.user.role = token.role as Role;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
      }

      return session;
    },
  },
};
