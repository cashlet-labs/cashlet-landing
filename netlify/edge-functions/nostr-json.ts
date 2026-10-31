// Netlify edge function: serves NIP-05 /.well-known/nostr.json

const RELAYS = ["wss://nos.lol", "wss://relay.damus.io", "wss://relay.nostr.band"];

export default async (request: Request) => {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");

  // CORS required by NIP-05
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (!name) {
    return new Response(JSON.stringify({ names: {}, relays: {} }), { headers });
  }

  // Look up stored npub→pubkey mapping from relay
  // For cashlet.netlify.app we resolve the "cashlet" name from a well-known npub
  // stored as a kind-0 metadata event with nip05 field, or fall back to env var
  const knownPubkey = Netlify.env.get(`NIP05_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`);

  if (!knownPubkey) {
    return new Response(JSON.stringify({ names: {}, relays: {} }), { headers });
  }

  return new Response(
    JSON.stringify({
      names: { [name]: knownPubkey },
      relays: {
        [knownPubkey]: RELAYS,
      },
    }),
    { headers },
  );
};

export const config = { path: "/.well-known/nostr.json" };
