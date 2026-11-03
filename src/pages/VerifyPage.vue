<template>
  <main class="verify-page">
    <div class="verify-inner">
      <div class="page-header">
        <div class="badge">Independent Verifier</div>
        <h1>Verify a Cashlet Identity</h1>
        <p class="sub">
          Cryptographically verify the binding between a Nostr identity and a Bitcoin Cash address.
          No central identity server or authority. Verification runs in your browser and queries public relays.
        </p>
      </div>

      <!-- Step 1: lookup -->
      <div class="card">
        <div class="card-title"><span class="step">1</span> Resolve Identity</div>
        <p class="card-desc">Enter a Nostr public key to fetch the published BCH–Nostr binding from public relays.</p>
        <div class="input-row">
          <input v-model="npub" placeholder="npub1…" @keydown.enter="resolve" />
          <button class="btn-primary" @click="resolve" :disabled="resolving || !npub.trim()">
            <span v-if="resolving" class="spin">⟳</span>
            <span v-else>Resolve</span>
          </button>
        </div>
        <div v-if="resolveError" class="result-error">✗ {{ resolveError }}</div>
        <div v-if="resolved" class="result-ok">
          <div class="result-row"><span class="label">BCH Address</span><span class="mono">{{ resolved.bchAddress }}</span></div>
          <div class="result-row"><span class="label">Network</span><span>{{ resolved.network }}</span></div>
          <div class="result-row"><span class="label">Nostr Pubkey</span><span class="mono">{{ resolved.pubkey }}</span></div>
          <div class="result-row"><span class="label">Binding ID</span><span class="mono small">{{ resolved.bindingId }}</span></div>
          <div class="result-row"><span class="label">Created</span><span>{{ new Date(resolved.createdAt * 1000).toLocaleString() }}</span></div>
        </div>
      </div>

      <!-- Step 2: verify binding signatures -->
      <div class="card" :class="{ disabled: !resolved }">
        <div class="card-title"><span class="step">2</span> Verify Binding Signatures</div>
        <p class="card-desc">Verify the BCH signature and Nostr event signature that prove control of both keys.</p>
        <button class="btn-primary" @click="verifyBinding" :disabled="!resolved || verifying">
          <span v-if="verifying" class="spin">⟳</span>
          <span v-else>Verify Signatures</span>
        </button>
        <div v-if="bindingVerified === true" class="result-ok">
          <div class="check-row"><span class="check">✓</span> BCH signature valid — address ownership proven</div>
          <div class="check-row"><span class="check">✓</span> Nostr event signature valid — npub ownership proven</div>
          <div class="check-row"><span class="check">✓</span> Binding payload integrity confirmed</div>
          <div class="check-row"><span class="check">✓</span> Not revoked — no NIP-09 deletion event found</div>
        </div>
        <div v-if="bindingVerified === false" class="result-error">✗ {{ verifyError }}</div>
      </div>

      <!-- Step 3: challenge-response -->
      <div class="card" :class="{ disabled: !bindingVerified }">
        <div class="card-title"><span class="step">3</span> Live Authentication</div>
        <p class="card-desc">
          Generate a one-time challenge. The identity owner signs it with their BCH key in Cashlet
          (Identity → Advanced → Prove your identity), then pastes the proof here. Cashlet's own
          wallet is the default signer; an optional connected wallet can also sign.
        </p>
        <p class="card-note">The verifier checks the bound BCH address and the fixed audience https://cashlet.netlify.app/verify. Challenges expire after five minutes.</p>
        <button class="btn-secondary" @click="generateChallenge" :disabled="!bindingVerified">
          Generate Challenge
        </button>
        <div v-if="nonce" class="nonce-box">
          <div class="mono small">{{ nonce }}</div>
          <button class="copy-btn" @click="copy(nonce)">{{ copied ? '✓' : 'Copy' }}</button>
        </div>
        <div v-if="nonce" style="margin-top:12px">
          <p class="card-desc" style="margin-bottom:8px">Paste the signed proof from Cashlet:</p>
          <textarea v-model="proofJson" placeholder='{"signature":"…","payload":"…","address":"…"}' rows="4" />
          <button class="btn-primary" style="margin-top:8px;width:100%" @click="verifyChallenge" :disabled="!proofJson.trim() || authVerifying">
            <span v-if="authVerifying" class="spin">⟳</span>
            <span v-else>Verify Proof</span>
          </button>
        </div>
        <div v-if="authVerified === true" class="result-ok">
          <div class="check-row"><span class="check">✓</span> Live key control proven</div>
          <div class="check-row"><span class="check">✓</span> Signature matches bound BCH address</div>
          <div class="check-row"><span class="check">✓</span> Identity authenticated</div>
        </div>
        <div v-if="authVerified === false" class="result-error">✗ {{ authError }}</div>
      </div>

      <!-- Step 4: rotation history -->
      <div class="card" :class="{ disabled: !resolved }">
        <div class="card-title"><span class="step">4</span> Rotation History</div>
        <p class="card-desc">Full binding chain for this identity, newest first.</p>
        <button class="btn-secondary" @click="loadChain" :disabled="!resolved || loadingChain">
          <span v-if="loadingChain" class="spin">⟳</span>
          <span v-else>Load History</span>
        </button>
        <div v-if="chain.length" style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
          <div v-for="(entry, i) in chain" :key="entry.bindingId"
            style="border:1px solid #2a3a46;border-radius:8px;padding:10px;font-size:11px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="color:#8293a2">{{ i === 0 ? 'Current' : `Superseded #${i}` }}</span>
              <span>{{ new Date(entry.createdAt * 1000).toLocaleDateString() }}</span>
            </div>
            <div class="mono small" style="color:#b7c5ce;overflow-wrap:anywhere">{{ entry.bchAddress }}</div>
            <div class="mono small" style="color:#556677;margin-top:2px">{{ entry.bindingId.slice(0,16) }}…</div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { resolveIdentity, verifyIdentity, verifyChallengeProof, resolveIdentityChain, type ResolvedIdentity } from 'did-beta-bch'

const route = useRoute()
const verifierAudience = 'https://cashlet.netlify.app/verify'
const npub = ref('')
const resolving = ref(false)
const resolveError = ref('')
const resolved = ref<ResolvedIdentity | null>(null)

const verifying = ref(false)
const bindingVerified = ref<boolean | null>(null)

onMounted(() => {
  const q = route.query.npub as string | undefined
  if (q) { npub.value = q; resolve() }
})
const verifyError = ref('')

const nonce = ref('')
const challengeIssuedAt = ref<number | null>(null)
const copied = ref(false)
const proofJson = ref('')
const authVerifying = ref(false)
const authVerified = ref<boolean | null>(null)
const authError = ref('')

const chain = ref<ResolvedIdentity[]>([])
const loadingChain = ref(false)

async function resolve() {
  resolveError.value = ''; resolved.value = null; bindingVerified.value = null; authVerified.value = null
  if (!npub.value.trim()) return
  resolving.value = true
  try {
    const result = await resolveIdentity(npub.value.trim())
    if (!result) { resolveError.value = 'No binding found on relays'; return }
    resolved.value = result
  } catch (e: any) {
    resolveError.value = e.message ?? 'Failed to resolve'
  } finally { resolving.value = false }
}

async function verifyBinding() {
  verifyError.value = ''; bindingVerified.value = null; verifying.value = true
  try {
    const result = await verifyIdentity(resolved.value!)
    if (result.status !== 'verified') throw new Error(result.details)
    bindingVerified.value = true
  } catch (e: any) {
    verifyError.value = e.message ?? 'Verification failed'
    bindingVerified.value = false
  } finally { verifying.value = false }
}

function generateChallenge() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  nonce.value = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
  challengeIssuedAt.value = Math.floor(Date.now() / 1000)
  proofJson.value = ''; authVerified.value = null
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}

async function verifyChallenge() {
  authError.value = ''; authVerified.value = null; authVerifying.value = true
  try {
    const proof = JSON.parse(proofJson.value)
    if (!resolved.value || proof.address !== resolved.value.bchAddress)
      throw new Error('Proof address does not match the BCH address in the published identity')
    if (challengeIssuedAt.value === null)
      throw new Error('Generate a fresh challenge before verifying the proof')
    const ok = verifyChallengeProof(
      proof,
      nonce.value,
      verifierAudience,
      challengeIssuedAt.value,
    )
    if (!ok) throw new Error('Signature does not match bound BCH address')
    authVerified.value = true
    nonce.value = ''
    challengeIssuedAt.value = null
    proofJson.value = ''
  } catch (e: any) {
    authError.value = e.message ?? 'Verification failed'
    authVerified.value = false
  } finally { authVerifying.value = false }
}

async function loadChain() {
  loadingChain.value = true
  try { chain.value = await resolveIdentityChain(npub.value.trim()) }
  catch { chain.value = [] }
  finally { loadingChain.value = false }
}
</script>

<style scoped>
.verify-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 24px 80px;
}
.verify-inner { display: flex; flex-direction: column; gap: 20px; }
.page-header { margin-bottom: 12px; }
.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: var(--blue);
  background: rgba(92,157,255,0.1);
  border: 1px solid rgba(92,157,255,0.25);
  border-radius: 20px;
  padding: 3px 10px;
  margin-bottom: 16px;
}
h1 {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 700;
  margin-bottom: 10px;
}
.sub { color: var(--muted); font-size: 15px; line-height: 1.6; max-width: 560px; }

.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
  transition: border-color 0.2s;
}
.card.disabled { opacity: 0.45; pointer-events: none; }
.card-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.step {
  width: 24px; height: 24px;
  background: rgba(57,230,160,0.15);
  color: var(--green);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.card-desc { font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }

.input-row { display: flex; gap: 8px; margin-bottom: 12px; }
.input-row input { flex: 1; background: var(--panel2); border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; color: #edf4f8; font-size: 13px; }
.input-row input:focus { outline: 2px solid var(--green); border-color: transparent; }

textarea {
  width: 100%;
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 9px 12px;
  color: #edf4f8;
  font-size: 12px;
  font-family: monospace;
  resize: vertical;
}
textarea:focus { outline: 2px solid var(--green); border-color: transparent; }

.btn-primary {
  background: var(--green); color: #070b10; font-weight: 700;
  padding: 9px 20px; border-radius: 8px; font-size: 13px; border: none; cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: var(--green2); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--panel2); color: #edf4f8; font-weight: 600;
  padding: 9px 20px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--line); cursor: pointer;
}
.btn-secondary:hover:not(:disabled) { border-color: var(--green); }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.result-ok {
  margin-top: 14px;
  background: rgba(57,230,160,0.06);
  border: 1px solid rgba(57,230,160,0.2);
  border-radius: 10px;
  padding: 14px;
}
.result-error {
  margin-top: 12px;
  background: rgba(248,113,113,0.06);
  border: 1px solid rgba(248,113,113,0.2);
  border-radius: 10px;
  padding: 12px;
  color: var(--red);
  font-size: 13px;
}
.result-row {
  display: flex; gap: 12px; align-items: baseline;
  font-size: 12px; margin-bottom: 6px;
}
.result-row:last-child { margin-bottom: 0; }
.label { color: var(--muted); min-width: 100px; flex-shrink: 0; }
.mono { font-family: monospace; word-break: break-all; color: #edf4f8; }
.mono.small { font-size: 10px; }
.check-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #edf4f8; margin-bottom: 6px; }
.check-row:last-child { margin-bottom: 0; }
.check { color: var(--green); font-weight: 700; }
.action-link { color: var(--green); font-size: 13px; font-weight: 600; text-decoration: none; }
.action-link:hover { text-decoration: underline; }
.card-note { font-size: 12px; color: var(--amber, #fbbf24); margin-bottom: 14px; }

.nonce-box {
  margin-top: 10px;
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.copy-btn {
  background: transparent; border: 1px solid var(--line); border-radius: 6px;
  color: var(--muted); font-size: 11px; padding: 3px 10px; cursor: pointer; flex-shrink: 0;
}
.copy-btn:hover { border-color: var(--green); color: var(--green); }
.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
