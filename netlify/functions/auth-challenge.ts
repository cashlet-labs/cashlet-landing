import {
  AUTH_AUDIENCE,
  AUTH_TTL_SECONDS,
  AUTH_VERIFY_ENDPOINT,
  challengeStore,
  jsonResponse,
  randomHex,
  type AuthChallenge,
} from "../lib/auth.js";

export default async (req: Request) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!req.headers.get("content-type")?.includes("application/json"))
    return jsonResponse({ error: "Expected application/json" }, 415);
  if (Number(req.headers.get("content-length") ?? 0) > 4096)
    return jsonResponse({ error: "Request body is too large" }, 413);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return jsonResponse({ error: "Invalid request" }, 400);

  const r = body as Record<string, unknown>;
  const npub = r["npub"];
  const pubkey = r["pubkey"];
  const address = r["address"];
  const bindingId = r["bindingId"];

  if (
    typeof npub !== "string" || npub.length > 128 ||
    typeof pubkey !== "string" || !/^[0-9a-f]{64}$/.test(pubkey) ||
    typeof address !== "string" || !/^(bitcoincash|bchtest):/.test(address) ||
    typeof bindingId !== "string" || !/^[0-9a-f]{64}$/.test(bindingId)
  ) return jsonResponse({ error: "Invalid identity fields" }, 400);

  const now = Math.floor(Date.now() / 1000);
  const challenge: AuthChallenge = {
    nonce: randomHex(32),
    audience: AUTH_AUDIENCE,
    endpoint: AUTH_VERIFY_ENDPOINT,
    issuedAt: now,
    expiresAt: now + AUTH_TTL_SECONDS,
    pubkey,
    address,
    bindingId,
  };
  const store = challengeStore();
  const stored = await store.setJSON(challenge.nonce, challenge, { onlyIfNew: true });
  if (!stored.modified)
    return jsonResponse({ error: "Unable to issue a unique challenge; retry" }, 503);

  return jsonResponse({
    nonce: challenge.nonce,
    audience: challenge.audience,
    endpoint: challenge.endpoint,
    issuedAt: challenge.issuedAt,
    expiresAt: challenge.expiresAt,
    address: challenge.address,
    pubkey: challenge.pubkey,
    bindingId: challenge.bindingId,
  });
};

export const config = { path: "/api/auth/challenge" };
