import { getStore } from "@netlify/blobs";
import type { DualChallengeProof, NostrEvent } from "did-beta-bch";

export const RELAYS = [
  "wss://nos.lol",
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
];
export const AUTH_AUDIENCE = "https://cashlet.netlify.app/verify";
export const AUTH_VERIFY_ENDPOINT = "https://cashlet.netlify.app/api/auth/verify";
export const AUTH_CHALLENGE_STORE = "cashlet-auth-challenges-v3";
export const AUTH_SESSION_STORE = "cashlet-auth-sessions-v3";
export const AUTH_TTL_SECONDS = 300;
export const SESSION_TTL_SECONDS = 60 * 60;

export interface AuthChallenge {
  nonce: string;
  audience: string;
  endpoint: string;
  issuedAt: number;
  expiresAt: number;
  pubkey: string;
  address: string;
  bindingId: string;
  consumedAt?: number;
}

export interface AuthSession {
  pubkey: string;
  address: string;
  bindingId: string;
  createdAt: number;
  expiresAt: number;
}

export function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function jsonResponse(body: object, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function parseProof(value: unknown): DualChallengeProof | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const event = candidate["nostrEvent"];
  if (
    typeof candidate["signature"] !== "string" ||
    typeof candidate["payload"] !== "string" ||
    typeof candidate["address"] !== "string" ||
    !event ||
    typeof event !== "object" ||
    Array.isArray(event)
  ) return null;
  const rawEvent = event as Record<string, unknown>;
  if (
    typeof rawEvent["id"] !== "string" ||
    typeof rawEvent["pubkey"] !== "string" ||
    typeof rawEvent["created_at"] !== "number" ||
    typeof rawEvent["kind"] !== "number" ||
    typeof rawEvent["content"] !== "string" ||
    typeof rawEvent["sig"] !== "string" ||
    !Array.isArray(rawEvent["tags"]) ||
    !rawEvent["tags"].every(tag =>
      Array.isArray(tag) && tag.every(item => typeof item === "string")
    )
  ) return null;
  return {
    signature: candidate["signature"],
    payload: candidate["payload"],
    address: candidate["address"],
    nostrEvent: rawEvent as unknown as NostrEvent,
  };
}

export function challengeStore() {
  return getStore(AUTH_CHALLENGE_STORE);
}

export function sessionStore() {
  return getStore(AUTH_SESSION_STORE);
}
