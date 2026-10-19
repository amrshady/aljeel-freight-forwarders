import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, hashSessionToken } from "./session-token";

const sessions = new Map<string, { expiresAt: Date; user: { id: string } }>();

vi.mock("./db", () => ({
  prisma: {
    session: {
      findUnique: vi.fn(({ where }: { where: { tokenHash: string } }) =>
        sessions.get(where.tokenHash) ?? null,
      ),
    },
  },
}));

import { findSessionUser } from "./session";

describe("session tokens", () => {
  beforeEach(() => sessions.clear());

  it("accepts a valid token", async () => {
    const token = createSessionToken();
    sessions.set(hashSessionToken(token), {
      expiresAt: new Date("2030-01-02T00:00:00Z"),
      user: { id: "test-user" },
    });
    await expect(
      findSessionUser(token, new Date("2030-01-01T00:00:00Z")),
    ).resolves.toEqual({ id: "test-user" });
  });

  it.each([
    ["tampered", () => `${createSessionToken()}tampered`],
    ["unknown", () => randomBytes(32).toString("hex")],
  ])("rejects a %s token", async (_label, token) => {
    await expect(findSessionUser(token())).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = createSessionToken();
    sessions.set(hashSessionToken(token), {
      expiresAt: new Date("2030-01-01T00:00:00Z"),
      user: { id: "test-user" },
    });
    await expect(
      findSessionUser(token, new Date("2030-01-01T00:00:01Z")),
    ).resolves.toBeNull();
  });
});
