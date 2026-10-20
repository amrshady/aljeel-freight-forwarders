import {
  createHmac,
  generateKeyPairSync,
  sign,
} from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCloudflareAccessKeyCache,
  verifyCloudflareAccess,
} from "./cf-access";

const config = {
  teamDomain: "example.cloudflareaccess.com",
  audience: "test-audience",
};
const now = new Date("2030-01-01T00:00:00Z").getTime();
const nowSeconds = Math.floor(now / 1000);
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test-key" };

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function token(
  claimOverrides: Record<string, unknown> = {},
  headerOverrides: Record<string, unknown> = {},
) {
  const header = encode({ alg: "RS256", kid: "test-key", ...headerOverrides });
  const claims = encode({
    aud: config.audience,
    iss: `https://${config.teamDomain}`,
    email: "Person@Example.Test",
    iat: nowSeconds,
    nbf: nowSeconds,
    exp: nowSeconds + 300,
    ...claimOverrides,
  });
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${claims}`),
    privateKey,
  ).toString("base64url");
  return `${header}.${claims}.${signature}`;
}

function requestHeaders(assertion?: string) {
  const headers = new Headers();
  if (assertion) headers.set("Cf-Access-Jwt-Assertion", assertion);
  return headers;
}

describe("Cloudflare Access assertions", () => {
  beforeEach(() => {
    clearCloudflareAccessKeyCache();
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ keys: [jwk] }), { status: 200 }),
      ),
    );
  });

  it("accepts a valid token and lowercases its email", async () => {
    await expect(
      verifyCloudflareAccess(requestHeaders(token()), config, now),
    ).resolves.toBe("person@example.test");
  });

  it("accepts the CF_Authorization cookie fallback", async () => {
    const headers = new Headers({ cookie: `other=x; CF_Authorization=${token()}` });
    await expect(verifyCloudflareAccess(headers, config, now)).resolves.toBe(
      "person@example.test",
    );
  });

  it.each([
    ["wrong audience", { aud: "another-audience" }],
    ["wrong issuer", { iss: "https://another.cloudflareaccess.com" }],
    ["expired", { exp: nowSeconds }],
    ["future nbf", { nbf: nowSeconds + 61 }],
    ["future iat", { iat: nowSeconds + 61 }],
  ])("rejects a token with %s", async (_label, overrides) => {
    await expect(
      verifyCloudflareAccess(requestHeaders(token(overrides)), config, now),
    ).resolves.toBeNull();
  });

  it("rejects a bad signature", async () => {
    const signed = token();
    const [header, claims] = signed.split(".");
    const badSignature = sign(
      "RSA-SHA256",
      Buffer.from(`${header}.${claims}changed`),
      privateKey,
    ).toString("base64url");
    await expect(
      verifyCloudflareAccess(
        requestHeaders(`${header}.${claims}.${badSignature}`),
        config,
        now,
      ),
    ).resolves.toBeNull();
  });

  it.each(["none", "HS256"])("rejects the %s algorithm", async (alg) => {
    const header = encode({ alg, kid: "test-key" });
    const claims = encode({
      aud: config.audience,
      iss: `https://${config.teamDomain}`,
      email: "person@example.test",
      exp: nowSeconds + 300,
    });
    const signature =
      alg === "HS256"
        ? createHmac("sha256", "secret")
            .update(`${header}.${claims}`)
            .digest("base64url")
        : "unsigned";
    await expect(
      verifyCloudflareAccess(
        requestHeaders(`${header}.${claims}.${signature}`),
        config,
        now,
      ),
    ).resolves.toBeNull();
  });

  it("refetches once and rejects an unknown kid", async () => {
    await expect(
      verifyCloudflareAccess(
        requestHeaders(token({}, { kid: "missing-key" })),
        config,
        now,
      ),
    ).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects a missing token without fetching keys", async () => {
    await expect(
      verifyCloudflareAccess(requestHeaders(), config, now),
    ).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
