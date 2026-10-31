// Netlify function: POST /api/register-nip05
// Body: { name, bchAddress }
// - Looks up cashlet-did binding for the BCH address on relays
// - First-come first-served: rejects if name already taken
// - Writes name→pubkey to Netlify Blobs

import { getStore } from "@netlify/blobs";
import { queryRelays } from "did-beta-bch";

const RELAYS = ["wss://nos.lol", "wss://relay.damus.io", "wss://relay.nostr.band"];
const BINDING_KIND = 30078;
const VALID_NAME = /^[a-z0-9_-]{1,32}$/;

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { name, bchAddress } = body;

  if (!name || !VALID_NAME.test(name)) return json({ error: "Invalid name. Use a-z, 0-9, _ or - (max 32 chars)" }, 400);
  if (!bchAddress || !/^(bitcoincash|bchtest|bchreg):/.test(bchAddress)) return json({ error: "Invalid BCH address" }, 400);

  // Find a cashlet-did binding that contains this BCH address
  const bindings = await queryRelays(RELAYS, {
    kinds: [BINDING_KIND],
    "#t": ["cashlet-did"],
    "#bch": [bchAddress],
    limit: 1,
  });

  if (!bindings.length) return json({ error: "No cashlet-did binding found for this address. Publish a BCH–Nostr binding first." }, 403);

  const pubkey = bindings[0].pubkey;

  // First-come first-served
  const store = getStore("nip05");
  const existing = await store.get(name);
  if (existing && existing !== pubkey) return json({ error: `'${name}' is already registered` }, 409);

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
