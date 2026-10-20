import {
  createPublicKey,
  verify,
  type JsonWebKey as CryptoJsonWebKey,
} from "node:crypto";

const CERT_CACHE_MS = 60 * 60 * 1000;
const CLOCK_LEEWAY_SECONDS = 60;

type AccessConfig = {
  teamDomain: string;
  audience: string;
};

type Jwk = CryptoJsonWebKey & { kid?: string; kty?: string };

type CachedKeys = {
  fetchedAt: number;
  keys: Jwk[];
};

const keyCache = new Map<string, CachedKeys>();

function decodeJson(part: string): unknown {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertionFromHeaders(requestHeaders: Headers) {
  const header = requestHeaders.get("Cf-Access-Jwt-Assertion");
  if (header) return header;

  const cookieHeader = requestHeaders.get("cookie");
  if (!cookieHeader) return null;
  for (const item of cookieHeader.split(";")) {
    const [name, ...value] = item.trim().split("=");
    if (name === "CF_Authorization") {
      return decodeURIComponent(value.join("="));
    }
  }
  return null;
}

async function fetchKeys(teamDomain: string, now: number, force = false) {
  const cached = keyCache.get(teamDomain);
  if (!force && cached && now - cached.fetchedAt < CERT_CACHE_MS) {
    return cached.keys;
  }

  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error("Unable to fetch Cloudflare Access keys");
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.keys)) {
    throw new Error("Invalid Cloudflare Access key response");
  }
  const keys = body.keys.filter(isRecord) as Jwk[];
  keyCache.set(teamDomain, { fetchedAt: now, keys });
  return keys;
}

async function keyForKid(teamDomain: string, kid: string, now: number) {
  let keys = await fetchKeys(teamDomain, now);
  let key = keys.find((item) => item.kid === kid);
  if (!key) {
    keys = await fetchKeys(teamDomain, now, true);
    key = keys.find((item) => item.kid === kid);
  }
  return key ?? null;
}

export async function verifyCloudflareAccess(
  requestHeaders: Headers,
  config: AccessConfig,
  now = Date.now(),
) {
  try {
    const token = assertionFromHeaders(requestHeaders);
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3 || !parts.every(Boolean)) return null;
    const header = decodeJson(parts[0]);
    const claims = decodeJson(parts[1]);
    if (!isRecord(header) || !isRecord(claims)) return null;
    if (header.alg !== "RS256" || typeof header.kid !== "string") return null;

    const key = await keyForKid(config.teamDomain, header.kid, now);
    if (!key || key.kty !== "RSA") return null;
    const publicKey = createPublicKey({ key, format: "jwk" });
    const validSignature = verify(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`),
      publicKey,
      Buffer.from(parts[2], "base64url"),
    );
    if (!validSignature) return null;

    const expectedIssuer = `https://${config.teamDomain}`;
    const audience = claims.aud;
    const hasAudience =
      audience === config.audience ||
      (Array.isArray(audience) && audience.includes(config.audience));
    if (!hasAudience || claims.iss !== expectedIssuer) return null;

    const nowSeconds = Math.floor(now / 1000);
    if (
      typeof claims.exp !== "number" ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= nowSeconds
    ) {
      return null;
    }
    if (
      (claims.nbf !== undefined &&
        (typeof claims.nbf !== "number" ||
          !Number.isFinite(claims.nbf) ||
          claims.nbf > nowSeconds + CLOCK_LEEWAY_SECONDS)) ||
      (claims.iat !== undefined &&
        (typeof claims.iat !== "number" ||
          !Number.isFinite(claims.iat) ||
          claims.iat > nowSeconds + CLOCK_LEEWAY_SECONDS))
    ) {
      return null;
    }
    if (typeof claims.email !== "string" || !claims.email.trim()) return null;
    return claims.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

export function clearCloudflareAccessKeyCache() {
  keyCache.clear();
}
