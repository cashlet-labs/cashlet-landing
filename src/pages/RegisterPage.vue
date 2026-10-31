<template>
  <main class="register-page">
    <div class="register-inner">
      <div class="page-header">
        <div class="badge">NIP-05 Handle</div>
        <h1>Claim your Cashlet handle</h1>
        <p class="sub">
          Register <strong>you@cashlet.netlify.app</strong> — a human-readable NIP-05 identity
          linked to your verified BCH address. Requires a published cashlet-did binding.
        </p>
      </div>

      <!-- Step 1: enter name + pubkey -->
      <div class="card">
        <div class="card-title"><span class="step">1</span> Choose a handle</div>
        <div class="input-row">
          <input v-model="name" placeholder="yourname" @input="name = name.toLowerCase().replace(/[^a-z0-9_-]/g,'')" maxlength="32" />
          <span class="handle-suffix">@cashlet.netlify.app</span>
        </div>
        <div class="input-row" style="margin-top:12px">
          <input v-model="npub" placeholder="npub1… or hex pubkey" />
        </div>
        <p class="hint">Must have a published cashlet-did binding. <router-link to="/verify">Verify yours →</router-link></p>
      </div>

      <!-- Step 2: sign with Nostr key -->
      <div class="card" :class="{ disabled: !name || !npub }">
        <div class="card-title"><span class="step">2</span> Prove key ownership</div>
        <p class="card-desc">
          Sign a one-time challenge with your Nostr key to prove you control this npub.
          Use a NIP-07 browser extension (Alby, nos2x) or paste your nsec below.
        </p>

        <div class="sign-options">
          <button class="btn-primary" @click="signWithExtension" :disabled="!name || !npub || signing">
            <span v-if="signing" class="spin">⟳</span>
            <span v-else>Sign with extension (NIP-07)</span>
          </button>
          <div class="divider">or</div>
          <input v-model="nsec" placeholder="nsec1… (stays in browser, never sent)" type="password" />
          <button class="btn-secondary" @click="signWithNsec" :disabled="!nsec || !name || !npub || signing">
            Sign with nsec
          </button>
        </div>

        <div v-if="signError" class="result-error">✗ {{ signError }}</div>
        <div v-if="signedEvent" class="result-ok">✓ Signed — ready to register</div>
      </div>

      <!-- Step 3: register -->
      <div class="card" :class="{ disabled: !signedEvent }">
        <div class="card-title"><span class="step">3</span> Register</div>
        <button class="btn-primary" @click="register" :disabled="!signedEvent || registering">
          <span v-if="registering" class="spin">⟳</span>
          <span v-else>Claim {{ name ? name + '@cashlet.netlify.app' : 'handle' }}</span>
        </button>
        <div v-if="registerError" class="result-error">✗ {{ registerError }}</div>
        <div v-if="registered" class="result-ok">
          <div class="check-row"><span class="check">✓</span> Handle registered: <strong>{{ registered }}</strong></div>
          <div class="check-row"><span class="check">✓</span> Anyone can now pay you via <code>resolveByNip05('{{ registered }}')</code></div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { nip19, finalizeEvent, generateSecretKey } from 'nostr-tools'

const name    = ref('')
const npub    = ref('')
const nsec    = ref('')
const signing = ref(false)
const signError = ref('')
const signedEvent = ref<any>(null)
const registering = ref(false)
const registerError = ref('')
const registered = ref('')

function resolvedPubkey(): string | null {
  const v = npub.value.trim()
  if (/^[0-9a-f]{64}$/.test(v)) return v
  try {
    const d = nip19.decode(v)
    return d.type === 'npub' ? d.data as string : null
  } catch { return null }
}

function buildAuthTemplate() {
  return {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["u", "/api/register-nip05"], ["method", "POST"]],
    content: `cashlet-did/nip05-register\n${name.value}`,
  }
}

async function signWithExtension() {
  signError.value = ''; signing.value = true
  try {
    const win = window as any
    if (!win.nostr) throw new Error('No NIP-07 extension found. Install Alby or nos2x.')
    signedEvent.value = await win.nostr.signEvent(buildAuthTemplate())
  } catch (e: any) {
    signError.value = e.message ?? 'Signing failed'
  } finally { signing.value = false }
}

async function signWithNsec() {
  signError.value = ''; signing.value = true
  try {
    const decoded = nip19.decode(nsec.value.trim())
    if (decoded.type !== 'nsec') throw new Error('Invalid nsec')
    signedEvent.value = finalizeEvent(buildAuthTemplate(), decoded.data as Uint8Array)
  } catch (e: any) {
    signError.value = e.message ?? 'Signing failed'
  } finally { signing.value = false }
}

async function register() {
  registerError.value = ''; registering.value = true
  try {
    const pubkey = resolvedPubkey()
    if (!pubkey) throw new Error('Invalid npub')
    const res = await fetch('/api/register-nip05', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value, pubkey, signedEvent: signedEvent.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Registration failed')
    registered.value = data.handle
  } catch (e: any) {
    registerError.value = e.message ?? 'Registration failed'
  } finally { registering.value = false }
}
</script>

<style scoped>
.register-page { min-height: 100vh; padding: 48px 24px; }
.register-inner { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
.page-header { text-align: center; margin-bottom: 8px; }
.badge { display: inline-block; background: rgba(0,255,163,0.1); color: var(--green); border: 1px solid rgba(0,255,163,0.2); border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 600; letter-spacing: .05em; margin-bottom: 16px; }
h1 { font-size: 28px; font-weight: 700; color: #edf4f8; margin: 0 0 12px; }
.sub { color: var(--soft); font-size: 15px; line-height: 1.6; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 24px; }
.card.disabled { opacity: 0.4; pointer-events: none; }
.card-title { font-size: 15px; font-weight: 600; color: #edf4f8; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
.card-desc { color: var(--soft); font-size: 13px; margin-bottom: 16px; line-height: 1.6; }
.step { background: var(--green); color: #070b10; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.input-row { display: flex; align-items: center; gap: 8px; }
.input-row input { flex: 1; background: #0d1520; border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; color: #edf4f8; font-size: 14px; outline: none; }
.input-row input:focus { border-color: var(--green); }
.handle-suffix { color: var(--soft); font-size: 14px; white-space: nowrap; }
.hint { color: var(--soft); font-size: 12px; margin-top: 10px; }
.hint a { color: var(--green); }
.sign-options { display: flex; flex-direction: column; gap: 10px; }
.divider { text-align: center; color: var(--soft); font-size: 12px; }
.btn-primary { background: var(--green); color: #070b10; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary { background: transparent; border: 1px solid var(--line); color: #edf4f8; border-radius: 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; }
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
.result-ok { background: rgba(0,255,163,0.06); border: 1px solid rgba(0,255,163,0.2); border-radius: 8px; padding: 12px 16px; margin-top: 12px; color: var(--green); font-size: 13px; }
.result-error { background: rgba(255,80,80,0.08); border: 1px solid rgba(255,80,80,0.2); border-radius: 8px; padding: 12px 16px; margin-top: 12px; color: #ff6b6b; font-size: 13px; }
.check-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.check { color: var(--green); }
.spin { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
</style>
