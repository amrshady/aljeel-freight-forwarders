import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("accepts the right password and rejects the wrong password", async () => {
    const password = randomBytes(24).toString("hex");
    const wrongPassword = randomBytes(24).toString("hex");
    const hash = await hashPassword(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword(wrongPassword, hash)).resolves.toBe(false);
  });

  it("uses a random salt for every hash", async () => {
    const password = randomBytes(24).toString("hex");
    await expect(hashPassword(password)).resolves.not.toBe(
      await hashPassword(password),
    );
  });
});
