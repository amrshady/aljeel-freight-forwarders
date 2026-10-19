import { createHash, randomBytes } from "node:crypto";

export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
