import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isPasscode } from "@/lib/passcode";

const LOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

async function recordLoginFailure(email: string) {
  const attempt = await prisma.loginAttempt.findUnique({ where: { email } });
  const expired = attempt?.lockedUntil ? attempt.lockedUntil.getTime() <= Date.now() : false;
  const failedCount = expired ? 1 : (attempt?.failedCount ?? 0) + 1;
  const lockedUntil = failedCount >= MAX_FAILURES ? new Date(Date.now() + LOCK_MS) : null;
  await prisma.loginAttempt.upsert({
    where: { email },
    create: { email, failedCount, lockedUntil },
    update: { failedCount, lockedUntil },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        passcode: { label: "Passcode", type: "password" },
      },
      authorize: async (credentials) => {
        const email = process.env.OWNER_EMAIL?.trim().toLowerCase() ?? "";
        const passcode = String(credentials.passcode ?? "");
        if (!email || !isPasscode(passcode)) return null;

        const attempt = await prisma.loginAttempt.findUnique({ where: { email } });
        if (attempt?.lockedUntil && attempt.lockedUntil.getTime() > Date.now()) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = user ? await bcrypt.compare(passcode, user.passwordHash) : false;
        if (!user || !valid) {
          await recordLoginFailure(email);
          return null;
        }
        await prisma.loginAttempt.deleteMany({ where: { email } });
        return { id: user.id, email: user.email, name: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
