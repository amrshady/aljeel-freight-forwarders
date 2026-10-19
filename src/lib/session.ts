import { cookies } from "next/headers";
import { prisma } from "./db";
import {
  createSessionToken,
  hashSessionToken,
  SESSION_DURATION_MS,
} from "./session-token";

const COOKIE = "freight_session";

function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires,
  };
}

export async function findSessionUser(
  token: string | undefined,
  now = new Date(),
) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= now) return null;
  return session.user;
}

export async function getSessionUser() {
  const jar = await cookies();
  return findSessionUser(jar.get(COOKIE)?.value);
}

export async function setSession(userId: string) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });
  const jar = await cookies();
  jar.set(COOKIE, token, cookieOptions(expiresAt));
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }
  jar.set(COOKIE, "", cookieOptions(new Date(0)));
}
