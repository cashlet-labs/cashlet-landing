import { verifyDualChallengeProof } from "did-beta-bch";
import {
  AUTH_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  challengeStore,
  jsonResponse,
  parseProof,
  randomHex,
  sessionStore,
  type AuthChallenge,
  type AuthSession,
} from "../lib/auth.js";

export default async (req: Request) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!req.headers.get("content-type")?.includes("application/json"))
    return jsonResponse({ error: "Expected application/json" }, 415);
  if (Number(req.headers.get("content-length") ?? 0) > 32_768)
    return jsonResponse({ error: "Request body is too large" }, 413);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return jsonResponse({ error: "Invalid request" }, 400);
  const request = body as Record<string, unknown>;
  const nonce = request["nonce"];
  const proof = parseProof(request["proof"]);
  if (typeof nonce !== "string" || !/^[0-9a-f]{64}$/.test(nonce) || !proof)
    return jsonResponse({ error: "Malformed challenge proof" }, 400);

  const store = challengeStore();
  const entry = await store.getWithMetadata<AuthChallenge>(nonce, {
    consistency: "strong",
    type: "json",
  });
  if (!entry || !entry.data)
    return jsonResponse({ error: "Challenge not found or already consumed" }, 401);
  const challenge = entry.data;
  const now = Math.floor(Date.now() / 1000);
  if (
    !entry.etag ||
    challenge.nonce !== nonce ||
    challenge.consumedAt !== undefined ||
    typeof challenge.audience !== "string" ||
    challenge.audience.length === 0 ||
    typeof challenge.endpoint !== "string" ||
    challenge.endpoint.length === 0 ||
    !Number.isSafeInteger(challenge.issuedAt) ||
    challenge.expiresAt !== challenge.issuedAt + AUTH_TTL_SECONDS ||
    now > challenge.expiresAt ||
    now - challenge.issuedAt > AUTH_TTL_SECONDS
  ) return jsonResponse({ error: "Challenge expired or invalid" }, 401);

  const valid = verifyDualChallengeProof(proof, {
    nonce,
    audience: challenge.audience,
    endpoint: challenge.endpoint,
    issuedAt: challenge.issuedAt,
    address: challenge.address,
    pubkey: challenge.pubkey,
  });
  if (!valid) return jsonResponse({ error: "BCH and Nostr proofs did not match the challenge" }, 401);

  const consumed = await store.setJSON(
    nonce,
    { ...challenge, consumedAt: now },
    { onlyIfMatch: entry.etag },
  );
  if (!consumed.modified)
    return jsonResponse({ error: "Challenge was already consumed" }, 409);

  const sessionId = randomHex(32);
  const session: AuthSession = {
    pubkey: challenge.pubkey,
    address: challenge.address,
    bindingId: challenge.bindingId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_SECONDS,
  };
  const created = await sessionStore().setJSON(sessionId, session, { onlyIfNew: true });
  if (!created.modified)
    return jsonResponse({ error: "Unable to establish a login session" }, 503);

  return jsonResponse(
    { authenticated: true, pubkey: session.pubkey, address: session.address, expiresAt: session.expiresAt },
    200,
    { "Set-Cookie": `cashlet_did_session=${sessionId}; Path=/api/auth; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict` },
  );
};

export const config = { path: "/api/auth/verify" };
