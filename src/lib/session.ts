import { headers } from "next/headers";
import { getAccessConfig } from "./auth-mode";
import { verifyCloudflareAccess } from "./cf-access";
import { prisma } from "./db";

export async function getAccessEmail() {
  const config = getAccessConfig();
  if (!config) return null;
  return verifyCloudflareAccess(await headers(), config);
}

export async function getSessionUser() {
  const email = await getAccessEmail();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}
