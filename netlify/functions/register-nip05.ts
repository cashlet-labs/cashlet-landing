// Netlify function: POST /api/register-nip05
// Body: { name, bchAddress }
// - Looks up cashlet-did binding for the BCH address on relays
// - First-come first-served: rejects if name already taken
// - Writes name→pubkey to Netlify Blobs

import { getStore } from "@netlify/blobs";
import { nip19 } from "nostr-tools";
import { queryRelays, resolveIdentity, verifyIdentity } from "did-beta-bch";
import { RELAYS } from "../lib/auth.js";

const BINDING_KIND = 30078;
const VALID_NAME = /^[a-z0-9_-]{1,32}$/;

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { name, bchAddress } = body;

  if (!name || !VALID_NAME.test(name)) return json({ error: "Invalid name. Use a-z, 0-9, _ or - (max 32 chars)" }, 400);
  if (!bchAddress || !/^(bitcoincash|bchtest|bchreg):/.test(bchAddress)) return json({ error: "Invalid BCH address" }, 400);

  // Verify relay candidates cryptographically before reserving a NIP-05 name.
  const bindings = await queryRelays(RELAYS, {
    kinds: [BINDING_KIND],
    "#t": ["cashlet-did"],
    "#bch": [bchAddress],
    limit: 50,
  });
  let pubkey: string | null = null;
  for (const candidate of bindings) {
    if (!/^[0-9a-f]{64}$/.test(candidate.pubkey)) continue;
    const identity = await resolveIdentity(nip19.npubEncode(candidate.pubkey), RELAYS);
    if (!identity || identity.rawEvent.id !== candidate.id || identity.bchAddress !== bchAddress)
      continue;
    if ((await verifyIdentity(identity)).status === "verified") {
      pubkey = identity.pubkey;
      break;
    }
  }
  if (!pubkey)
    return json({ error: "No valid v3 cashlet-did binding found for this address. Publish a verified BCH–Nostr binding first." }, 403);

  const store = getStore("nip05");
  const existing = await store.getWithMetadata(name, { consistency: "strong", type: "text" });
  if (existing?.data === pubkey)
    return json({ ok: true, handle: `${name}@cashlet.netlify.app`, pubkey });
  if (existing?.data)
    return json({ error: `'${name}' is already registered` }, 409);

  const reserved = await store.set(name, pubkey, { onlyIfNew: true });
  if (!reserved.modified) {
    const winner = await store.get(name, { consistency: "strong", type: "text" });
    if (winner !== pubkey) return json({ error: `'${name}' is already registered` }, 409);
  }
  return json({ ok: true, handle: `${name}@cashlet.netlify.app`, pubkey });
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export const config = { path: "/api/register-nip05" };
