// Netlify function: POST /api/register-nip05
// Body: { name, pubkey, signedEvent }
// - Verifies the signed Nostr event proves pubkey ownership
// - Checks a cashlet-did binding exists for the pubkey
// - First-come first-served: rejects if name already taken
// - Writes name→pubkey to Netlify Blobs

import { getStore } from "@netlify/blobs";
import { verifyEvent } from "nostr-tools";
import { queryRelays } from "did-beta-bch";

const RELAYS = ["wss://nos.lol", "wss://relay.damus.io", "wss://relay.nostr.band"];
const BINDING_KIND = 30078;
const VALID_NAME = /^[a-z0-9_-]{1,32}$/;

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { name, pubkey, signedEvent } = body;

  // 1. Validate name format
  if (!name || !VALID_NAME.test(name)) return json({ error: "Invalid name. Use a-z, 0-9, _ or - (max 32 chars)" }, 400);

  // 2. Validate pubkey format
  if (!pubkey || !/^[0-9a-f]{64}$/.test(pubkey)) return json({ error: "Invalid pubkey" }, 400);

  // 3. Verify Nostr signature — proves caller controls the privkey for this pubkey
  if (!signedEvent || !verifyEvent(signedEvent)) return json({ error: "Invalid Nostr signature" }, 401);
  if (signedEvent.pubkey !== pubkey) return json({ error: "Signature pubkey mismatch" }, 401);
  if (signedEvent.kind !== 27235) return json({ error: "Expected kind 27235 auth event" }, 401);

  // 4. Check event is fresh (5 min TTL)
  if (Math.floor(Date.now() / 1000) - signedEvent.created_at > 300)
    return json({ error: "Auth event expired" }, 401);

  // 5. Require a published cashlet-did binding for this pubkey
  const bindings = await queryRelays(RELAYS, { kinds: [BINDING_KIND], authors: [pubkey], "#t": ["cashlet-did"], limit: 1 });
  if (!bindings.length) return json({ error: "No cashlet-did binding found. Publish a BCH–Nostr binding first." }, 403);

  // 6. First-come first-served — reject if name already taken
  const store = getStore("nip05");
  const existing = await store.get(name);
  if (existing && existing !== pubkey) return json({ error: `'${name}' is already registered` }, 409);

  // 7. Write
  await store.set(name, pubkey);
  return json({ ok: true, handle: `${name}@cashlet.netlify.app`, pubkey });
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export const config = { path: "/api/register-nip05" };
