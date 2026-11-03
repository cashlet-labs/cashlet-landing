import {
  SESSION_TTL_SECONDS,
  jsonResponse,
  sessionStore,
  type AuthSession,
} from "../lib/auth.js";

export default async (req: Request) => {
  if (req.method !== "GET") return jsonResponse({ error: "Method not allowed" }, 405);
  const sessionId = req.headers.get("cookie")
    ?.split(";")
    .map(part => part.trim())
    .find(part => part.startsWith("cashlet_did_session="))
    ?.slice("cashlet_did_session=".length);
  if (!sessionId || !/^[0-9a-f]{64}$/.test(sessionId))
    return jsonResponse({ authenticated: false }, 401);

  const entry = await sessionStore().getWithMetadata<AuthSession>(sessionId, {
    consistency: "strong",
    type: "json",
  });
  if (!entry?.data || !entry.etag || entry.data.expiresAt <= Math.floor(Date.now() / 1000))
    return jsonResponse(
      { authenticated: false },
      401,
      { "Set-Cookie": `cashlet_did_session=; Path=/api/auth; Max-Age=0; HttpOnly; Secure; SameSite=Strict` },
    );

  return jsonResponse({
    authenticated: true,
    pubkey: entry.data.pubkey,
    address: entry.data.address,
    bindingId: entry.data.bindingId,
    expiresAt: entry.data.expiresAt,
    expiresIn: SESSION_TTL_SECONDS,
  });
};

export const config = { path: "/api/auth/session" };
