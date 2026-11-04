<template>
  <main class="docs">
    <aside class="docs-nav">
      <div class="docs-nav-title">cashlet-did</div>
      <nav>
        <a v-for="s in sections" :key="s.id" :href="'#' + s.id">{{ s.label }}</a>
      </nav>
    </aside>

    <div class="docs-content">

      <section id="overview">
        <h1>cashlet-did</h1>
        <p class="lead">Framework-agnostic TypeScript library for BCH–Nostr decentralised identity. Works in browsers, Node.js, and Chrome extensions.</p>
        <pre class="install">npm install did-beta-bch@3.1.1</pre>
        <div class="badges">
          <span class="badge">TypeScript</span>
          <span class="badge">ESM</span>
          <span class="badge">MIT</span>
          <span class="badge">NIP-01 · NIP-06 · NIP-07</span>
        </div>
      </section>

      <section id="quickstart">
        <h2>Quick start — pay by handle</h2>
        <p>Resolve a BCH address from any Nostr public key in one call:</p>
        <pre>import { resolveAddress } from 'did-beta-bch'

const address = await resolveAddress('npub1...')
if (address) {
  // address is token-aware (bitcoincash:z...)
  // works for BCH, CashTokens (FT), and NFTs
  wallet.sendTo(address, amountSats)
}</pre>
      </section>

      <section id="resolve">
        <h2>Resolution</h2>

        <h3>resolveAddress</h3>
        <p>Returns the BCH address for an npub, or <code>null</code> if no binding found.</p>
        <p class="note">The resolved address is always a token-aware <code>bitcoincash:z...</code> address (not the legacy <code>q</code> prefix). It can receive BCH, CashTokens (fungible), and NFTs without any conversion.</p>
        <pre>import { resolveAddress } from 'did-beta-bch'

const address = await resolveAddress('npub1abc...')
// → "bitcoincash:zq..."  or  null
// Token-aware: accepts BCH, CashTokens (FT), and NFTs</pre>

        <h3>resolveIdentity</h3>
        <p>Full resolution — returns binding metadata alongside the address.</p>
        <pre>import { resolveIdentity } from 'did-beta-bch'

const identity = await resolveIdentity('npub1abc...')
// identity.bchAddress  → "bitcoincash:zq..."
// identity.pubkey      → hex pubkey
// identity.bindingId   → SHA-256 of canonical binding
// identity.createdAt   → unix timestamp</pre>

        <h3>resolveByNip05</h3>
        <p>Resolve a BCH address from a NIP-05 handle (e.g. <code>user@cashlet.netlify.app</code>).</p>
        <pre>import { resolveByNip05 } from 'did-beta-bch'

const address = await resolveByNip05('user@cashlet.netlify.app')
// → "bitcoincash:zq..."  or  null</pre>

        <h3>resolveIdentityChain</h3>
        <p>Returns the full key rotation history, newest first.</p>
        <pre>import { resolveIdentityChain } from 'did-beta-bch'

const chain = await resolveIdentityChain('npub1abc...')
// chain[0] → current binding
// chain[1] → previous (superseded)</pre>
      </section>

      <section id="verify">
        <h2>Verification</h2>

        <h3>verifyIdentity</h3>
        <p>Verifies both the Nostr event signature and the BCH address ownership proof.</p>
        <pre>import { resolveIdentity, verifyIdentity } from 'did-beta-bch'

const identity = await resolveIdentity('npub1abc...')
const result = await verifyIdentity(identity)
// result.status → "verified" | "invalid_bch_sig" | "invalid_nostr_sig"
//                 | "id_mismatch" | "malformed" | "expired"

if (result.status === 'verified') {
  console.log('BCH address proven:', identity.bchAddress)
}</pre>

        <h3>verifyChallengeProof</h3>
        <p>Verify a BCH-only challenge-response proof. For full BCH+Nostr dual-key authentication see <a href="#dualauth">Dual-key authentication</a>.</p>
        <pre>import { verifyChallengeProof } from 'did-beta-bch'

const ok = verifyChallengeProof(
  { signature, payload, address },
  nonce,
  'https://cashlet.netlify.app/verify',
  challengeIssuedAt, // Unix seconds issued by this verifier
)
// true → live BCH key control confirmed</pre>
        <p class="note">The verifier must supply its expected audience and trusted challenge issue time; do not trust those values from the submitted proof.</p>
      </section>

      <section id="dualauth">
        <h2>Dual-key authentication</h2>
        <p>Prove simultaneous control of both the BCH key and the Nostr key. Used by the <a href="/verify">/verify</a> page and any server that needs cryptographic login.</p>

        <h3>nostrChallengeTemplate</h3>
        <p>Build the Nostr event template the wallet must sign (kind 27235). Pass to <code>window.nostr.signEvent</code>.</p>
        <pre>import { nostrChallengeTemplate } from 'did-beta-bch'

const template = nostrChallengeTemplate(
  nonce,
  'https://cashlet.netlify.app/verify', // audience
  'https://cashlet.netlify.app/api/auth/verify', // endpoint
  issuedAt, // Unix seconds
)
const nostrEvent = await window.nostr.signEvent(template)</pre>

        <h3>verifyDualChallengeProof</h3>
        <p>Server-side: verify both the BCH signature and the Nostr event in one call.</p>
        <pre>import { verifyDualChallengeProof } from 'did-beta-bch'

const ok = verifyDualChallengeProof(
  { signature, payload, address, nostrEvent },
  {
    nonce,
    audience: 'https://cashlet.netlify.app/verify',
    endpoint: 'https://cashlet.netlify.app/api/auth/verify',
    issuedAt,
    address: identity.bchAddress,
    pubkey: identity.pubkey,
  }
)
// true → both BCH and Nostr key control confirmed</pre>

        <h3>bchChallengePayload</h3>
        <p>The exact text the BCH key must sign. Useful for building custom signers.</p>
        <pre>import { bchChallengePayload } from 'did-beta-bch'

const text = bchChallengePayload(nonce, audience)
// → "cashlet-did/challenge/v3.0.0\n{nonce}\n{audience}"</pre>
      </section>

      <section id="binding">
        <h2>Binding construction</h2>
        <p>For wallets that want to publish their own identity binding.</p>

        <h3>buildBinding</h3>
        <pre>import { buildBinding, bchSigningPayload, signBchMessage, nostrEventTemplate } from 'did-beta-bch'
import { finalizeEvent } from 'nostr-tools'

// 1. Build the canonical binding
const binding = await buildBinding(
  'bitcoincash:zq...',  // BCH address
  'mainnet',
  hexNostrPubkey,
  paymentCode,          // optional BIP47
  previousBindingId,    // optional — for key rotation
)

// 2. Sign the exact v2 message with the BCH key
const message = bchSigningPayload(binding)
const signatureBase64 = await signBchMessage(walletSigner, message)

// 3. Build + sign Nostr event
const template = nostrEventTemplate(binding, { message, signatureBase64 })
const event = finalizeEvent(template, nostrPrivkey)

// 4. Publish
await publishToRelays(DEFAULT_RELAYS, event)</pre>
      </section>

      <section id="anchor">
        <h2>BCH-backed commitments</h2>
        <p>Anchor a binding to the BCH blockchain via OP_RETURN for a tamper-evident on-chain timestamp.</p>
        <pre>import { buildAnchorTx } from 'did-beta-bch'

const { txHex } = await buildAnchorTx(binding.bindingId, {
  txid: utxo.txid,
  vout: utxo.vout,
  valueSats: utxo.valueSats,
  lockingBytecode,  // Uint8Array — P2PKH locking script
  privateKey,       // Uint8Array — BCH private key
  feeSats: 500,     // optional, defaults to 500
})

// Broadcast txHex to BCH network
// OP_RETURN output contains: "cashlet-did:&lt;bindingId&gt;"</pre>
        <p class="note">The binding's Nostr event will include a <code>["bch-anchor", txid]</code> tag after anchoring, allowing verifiers to independently confirm on-chain.</p>
      </section>

      <section id="credentials">
        <h2>Verifiable credentials</h2>
        <p>Any Nostr keypair can issue a signed attestation about a subject identity (kind 30085).</p>

        <h3>issueCredential</h3>
        <pre>import { issueCredential } from 'did-beta-bch'

const { credential } = await issueCredential(
  'npub1subject...',
  'merchant',
  issuerPrivkey,   // Uint8Array — issuer's Nostr private key
  { verified_since: '2024-01-01', platform: 'BCH Guru' }
)
// credential.id     → Nostr event id
// credential.issuer → issuer hex pubkey</pre>

        <h3>issueRating</h3>
        <p>Issue a 1–5 star rating with an optional comment and transaction reference.</p>
        <pre>import { issueRating } from 'did-beta-bch'

const { credential } = await issueRating(
  'npub1subject...',
  5,               // 1–5
  issuerPrivkey,
  { comment: 'Fast and reliable', txid: 'abc123...', network: 'mainnet' }
)</pre>

        <h3>resolveCredentials</h3>
        <pre>import { resolveCredentials } from 'did-beta-bch'

const creds = await resolveCredentials('npub1abc...')
for (const c of creds) {
  console.log(c.payload.type)    // "merchant" | "rating" | ...
  console.log(c.issuer)          // issuer hex pubkey
  console.log(c.payload.claims)  // { verified_since: "2024-01-01" }
}</pre>

        <h3>revokeCredential</h3>
        <p>Publish a NIP-09 deletion event to revoke a previously issued credential.</p>
        <pre>import { revokeCredential } from 'did-beta-bch'

await revokeCredential(credential.id, issuerPrivkey)</pre>

        <h3>scoreReputation</h3>
        <p>Compute a 0–100 reputation score from all credentials issued to an npub.</p>
        <pre>import { scoreReputation } from 'did-beta-bch'

const rep = await scoreReputation('npub1abc...')
// rep.score          → 0–100
// rep.averageRating  → 1–5 or null
// rep.credentialCount → total credentials
// rep.uniqueIssuers  → number of distinct issuers</pre>
      </section>

      <section id="disclosure">
        <h2>Selective disclosure</h2>
        <p>Commit to identity attributes with individual hashes. Reveal only chosen ones to a verifier.</p>
        <pre>import { buildDisclosure, verifyDisclosure } from 'did-beta-bch'

// Holder: commit to attributes
const d = await buildDisclosure({
  merchant: 'true',
  country: 'AU',
  member: 'BCH Guru',
})
// Store d.commitments in binding event tags

// Reveal only selected attributes to verifier
const revealed = d.reveal(['merchant', 'country'])
// → { merchant: 'true', country: 'AU' }

// Verifier: check against published commitments
const { verified, failed } = await verifyDisclosure(revealed, d.commitments)
// verified → ['merchant', 'country']
// failed   → []</pre>
        <p class="note">Hash format: <code>SHA-256("cashlet-did/attr/{key}:{value}")</code></p>
      </section>

      <section id="nip98">
        <h2>NIP-98 HTTP Auth</h2>
        <p>Attach a Nostr-signed Authorization header to HTTP requests, optionally resolving the signer's BCH binding for full identity verification.</p>

        <h3>buildHttpAuthEventAsync</h3>
        <p>Client-side: build the event template, sign it with <code>window.nostr.signEvent</code>, then base64-encode and send as <code>Authorization: Nostr &lt;base64&gt;</code>.</p>
        <pre>import { buildHttpAuthEventAsync } from 'did-beta-bch'

const template = await buildHttpAuthEventAsync(url, 'POST', bodyBytes)
const signed = await window.nostr.signEvent(template)
const header = 'Nostr ' + btoa(JSON.stringify(signed))</pre>

        <h3>verifyHttpAuth</h3>
        <p>Server-side: verify the Authorization header. Set <code>verifyBch: true</code> to also resolve and verify the signer's BCH binding.</p>
        <pre>import { verifyHttpAuth } from 'did-beta-bch'

const result = await verifyHttpAuth(
  req.headers.authorization,
  'https://example.com/api/endpoint',
  'POST',
  { body: bodyBytes, verifyBch: true }
)
// result.valid      → boolean
// result.pubkey     → signer hex pubkey
// result.bchAddress → resolved BCH address (if verifyBch: true)</pre>
      </section>

      <section id="nip89">
        <h2>NIP-89 App Handler</h2>
        <p>Advertise your app as a handler for cashlet-did identity events (kind 30078) so Nostr clients can route users to it.</p>
        <pre>import { buildAppHandlerEvent } from 'did-beta-bch'
import { finalizeEvent } from 'nostr-tools'

const template = buildAppHandlerEvent(
  'My BCH App',
  'https://myapp.example.com',
  'BCH wallet with decentralised identity'
)
const event = finalizeEvent(template, nostrPrivkey)
await publishToRelays(DEFAULT_RELAYS, event)</pre>
      </section>

      <section id="relay">
        <h2>Relay client</h2>
        <pre>import { publishToRelays, queryRelays, DEFAULT_RELAYS } from 'did-beta-bch'

// Publish a signed Nostr event
const results = await publishToRelays(DEFAULT_RELAYS, signedEvent)
// results[0] → { relay: 'wss://nos.lol', ok: true }

// Query events
const events = await queryRelays(DEFAULT_RELAYS, {
  kinds: [30078],
  authors: [hexPubkey],
  limit: 5,
})</pre>
        <p class="note"><code>DEFAULT_RELAYS</code> — nos.lol · relay.damus.io · relay.nostr.band</p>
      </section>

      <section id="protocol">
        <h2>Protocol spec</h2>

        <h3>Nostr event kinds</h3>
        <table>
          <tr><td><code>30078</code></td><td>Identity binding — BCH address + Nostr pubkey + BCH ownership proof</td></tr>
          <tr><td><code>30079</code></td><td>Verifiable credential — third-party attestation about a subject npub</td></tr>
          <tr><td><code>30080</code></td><td>Rotation authorization — authorises a new binding to supersede the current one</td></tr>
          <tr><td><code>30085</code></td><td>Credential (kind used by issueCredential / issueRating)</td></tr>
          <tr><td><code>27235</code></td><td>Nostr challenge — signed by wallet during dual-key authentication</td></tr>
          <tr><td><code>31990</code></td><td>NIP-89 App Handler — advertises app support for kind 30078</td></tr>
        </table>

        <h3>Binding event tags</h3>
        <table>
          <tr><td><code>["d", bindingId]</code></td><td>Addressable event identifier</td></tr>
          <tr><td><code>["bch", address, network]</code></td><td>BCH address and network</td></tr>
          <tr><td><code>["bch-proof", format, message, signatureBase64]</code></td><td>BCH key ownership proof</td></tr>
          <tr><td><code>["protocol", "cashlet-did", version]</code></td><td>Protocol identifier</td></tr>
          <tr><td><code>["supersedes", previousBindingId]</code></td><td>Key rotation link</td></tr>
          <tr><td><code>["bch-anchor", txid]</code></td><td>On-chain OP_RETURN anchor</td></tr>
        </table>

        <h3>Canonical binding JSON</h3>
        <pre>{
  "protocol": "cashlet-did",
  "version": "3.0.0",
  "bindingId": "&lt;sha256-of-this-object-without-bindingId&gt;",
  "bch": { "address": "bitcoincash:zq...", "network": "mainnet" },
  "nostr": { "pubkey": "&lt;hex&gt;" },
  "createdAt": 1234567890,
  "nonce": "&lt;32-byte-random-hex&gt;",
  "purpose": "identity-binding-v3"
}</pre>
        <p class="note">Version 3 uses a typed compact Bitcoin Signed Message proof. Verifiers must reject v1/v2 proof formats rather than interpreting them as v3.</p>
      </section>

    </div>
  </main>
</template>

<script setup lang="ts">
const sections = [
  { id: 'overview',    label: 'Overview' },
  { id: 'quickstart',  label: 'Quick start' },
  { id: 'resolve',     label: 'Resolution' },
  { id: 'verify',      label: 'Verification' },
  { id: 'dualauth',    label: 'Dual-key auth' },
  { id: 'binding',     label: 'Binding construction' },
  { id: 'anchor',      label: 'BCH commitments' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'disclosure',  label: 'Selective disclosure' },
  { id: 'nip98',       label: 'NIP-98 HTTP Auth' },
  { id: 'nip89',       label: 'NIP-89 App Handler' },
  { id: 'relay',       label: 'Relay client' },
  { id: 'protocol',    label: 'Protocol spec' },
]
</script>

<style scoped>
.docs {
  display: flex;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
  gap: 48px;
}

.docs-nav {
  width: 190px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  height: fit-content;
  padding-top: 48px;
}

.docs-nav-title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: var(--green);
  margin-bottom: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.docs-nav a {
  display: block;
  font-size: 13px;
  color: var(--muted);
  padding: 5px 10px;
  border-radius: 6px;
  border-left: 2px solid transparent;
  text-decoration: none;
  transition: color 0.15s;
}
.docs-nav a:hover { color: #e2eaf0; border-left-color: var(--line); }

.docs-content {
  flex: 1;
  padding: 48px 0 80px;
  min-width: 0;
}

section { margin-bottom: 52px; }

h1 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
}

h2 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

h3 {
  font-size: 14px;
  font-weight: 600;
  color: #e2eaf0;
  margin: 20px 0 6px;
}

p { color: #b7c5ce; line-height: 1.7; margin-bottom: 10px; }
.lead { font-size: 1.05rem; color: #d0dde6; }
.note { font-size: 12px; color: var(--muted); }

pre {
  background: #0d1820;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px 18px;
  font-size: 13px;
  line-height: 1.65;
  overflow-x: auto;
  color: #c9d8e3;
  margin: 10px 0;
  white-space: pre;
}

pre.install {
  font-size: 15px;
  color: var(--green);
  padding: 14px 18px;
}

code {
  font-family: monospace;
  font-size: 12px;
  background: #0d1820;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--green);
}

.badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid var(--line);
  color: var(--muted);
}

table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0; }
td { padding: 7px 10px; border-bottom: 1px solid var(--line); color: #b7c5ce; vertical-align: top; }
td:first-child { white-space: nowrap; padding-right: 24px; }
tr:last-child td { border-bottom: none; }

@media (max-width: 700px) {
  .docs-nav { display: none; }
}
</style>
