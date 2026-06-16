import NextAuth from "next-auth";
import fs from "fs";
import path from "path";

// In development, load .env.local or .env so you can "import" env files locally
if (process.env.NODE_ENV !== "production") {
  try {
    // prefer .env.local (Next.js convention), fallback to .env
    const localPath = path.resolve(process.cwd(), ".env.local");
    const envPath = path.resolve(process.cwd(), ".env");
    // dynamic require so bundlers don't include dotenv in production client bundles
    const dotenv = require("dotenv");
    if (fs.existsSync(localPath)) dotenv.config({ path: localPath });
    else if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  } catch (err) {
    // ignore — env may already be loaded by Next.js
  }
}

// Ensure sensible defaults and helpful warnings
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
if (!process.env.NEXTAUTH_SECRET) {
  // only warn (do not throw) so local development can continue, but remind user to set secret
  // This secret should be set in Vercel (production) and in .env.local for local testing
  // Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  // eslint-disable-next-line no-console
  console.warn(
    "Warning: NEXTAUTH_SECRET is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" and set NEXTAUTH_SECRET in your .env.local or Vercel env vars.",
  );
}
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request Gmail send permission alongside normal OAuth scopes
          scope: ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.send"].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),

    // ── Email + Password ──────────────────────────────────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isValid) return null;

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: ActivityType.LOGIN,
            description: `User ${user.email} masuk via email/password`,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    // ── JWT: simpan id, access_token, refresh_token dari Google ──────────
    async jwt({ token, user, account }) {
      // First sign-in: user & account tersedia
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleTokenExpiry = account.expires_at;
        token.provider = "google";

        // Log Google login
        if (user?.id) {
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: ActivityType.LOGIN,
              description: `User ${user.email ?? ""} masuk via Google OAuth`,
            },
          });
        }
      }
      return token;
    },

    // ── Session: expose id & google token ke client ───────────────────────
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.googleAccessToken = token.googleAccessToken as string | undefined;
        session.provider = token.provider as string | undefined;
      }
      return session;
    },
  },
});
