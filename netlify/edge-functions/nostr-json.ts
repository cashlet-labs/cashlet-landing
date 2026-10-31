// Netlify edge function: serves NIP-05 /.well-known/nostr.json
// Reads registrations from Netlify Blobs (written by /api/register-nip05)
import { getStore } from "@netlify/blobs";

const RELAYS = ["wss://nos.lol", "wss://relay.damus.io", "wss://relay.nostr.band"];

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export default async (request: Request, context: any) => {
  const name = new URL(request.url).searchParams.get("name")?.toLowerCase();
  if (!name) return new Response(JSON.stringify({ names: {}, relays: {} }), { headers: CORS });

  const store = getStore({ name: "nip05", consistency: "strong", ...context });
  const pubkey = await store.get(name);

  if (!pubkey) return new Response(JSON.stringify({ names: {}, relays: {} }), { headers: CORS });

  return new Response(
    JSON.stringify({ names: { [name]: pubkey }, relays: { [pubkey]: RELAYS } }),
    { headers: CORS },
  );
};

export const config = { path: "/.well-known/nostr.json" };
