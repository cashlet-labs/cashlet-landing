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

      <!-- Step 1: choose handle -->
      <div class="card">
        <div class="card-title"><span class="step">1</span> Choose a handle</div>
        <div class="input-row">
          <input v-model="name" placeholder="yourname" @input="name = name.toLowerCase().replace(/[^a-z0-9_-]/g,'')" maxlength="32" />
          <span class="handle-suffix">@cashlet.netlify.app</span>
        </div>
        <p class="hint">Must have a published cashlet-did binding. <router-link to="/verify">Verify yours →</router-link></p>
      </div>

      <!-- Step 2: connect wallet via WizardConnect -->
      <div class="card" :class="{ disabled: !name }">
        <div class="card-title"><span class="step">2</span> Connect your wallet</div>
        <p class="card-desc">Scan with your BCH wallet. The wallet proves key ownership by completing the encrypted handshake.</p>

        <div v-if="!walletConnected">
          <div v-if="wizUri" class="qr-wrap">
            <img :src="qrUrl" alt="WizardConnect QR" class="qr" />
            <p class="card-desc" style="margin-top:8px;margin-bottom:4px;text-align:center">Waiting for wallet to connect…</p>
            <div class="address-row" style="margin-top:4px">
              <span class="address-text" style="font-size:11px;word-break:break-all">{{ wizUri }}</span>
              <button class="btn-copy" @click="copyUri">{{ copiedUri ? '✓' : 'Copy' }}</button>
            </div>
          </div>
          <button v-else class="btn-primary" @click="startWizard" :disabled="!name || connecting">
            <span v-if="connecting" class="spin">⟳</span>
            <span v-else>Connect wallet</span>
          </button>
          <div v-if="connectError" class="result-error">✗ {{ connectError }}</div>
        </div>

        <div v-else class="result-ok">
          <div class="check-row"><span class="check">✓</span> Wallet connected — {{ walletName }}</div>
          <div class="check-row"><span class="check">✓</span> BCH address proven: <span class="mono">{{ bchAddress }}</span></div>
        </div>
      </div>

      <!-- Step 3: register -->
      <div class="card" :class="{ disabled: !walletConnected }">
        <div class="card-title"><span class="step">3</span> Register</div>
        <button class="btn-primary" @click="register" :disabled="!walletConnected || registering">
          <span v-if="registering" class="spin">⟳</span>
          <span v-else>Claim {{ name ? name + '@cashlet.netlify.app' : 'handle' }}</span>
        </button>
        <div v-if="registerError" class="result-error">✗ {{ registerError }}</div>
        <div v-if="registered" class="result-ok">
          <div class="check-row"><span class="check">✓</span> Handle registered: <strong>{{ registered }}</strong></div>
          <div class="check-row"><span class="check">✓</span> Resolvable via <code>resolveByNip05('{{ registered }}')</code></div>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,255,163,0.15);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:12px;color:#8293a2">NIP-05 handle:</span>
            <code style="flex:1;font-size:11px">{{ registered }}</code>
            <button class="btn-copy" @click="copyHandle">{{ copiedHandle ? '✓' : 'Copy' }}</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { initiateDappRelay } from '@wizardconnect/core'
import { DappConnectionManager } from '@wizardconnect/dapp'
import { encodeCashAddress, hash160, CashAddressType } from '@bitauth/libauth'

const name         = ref('')
const connecting   = ref(false)
const connectError = ref('')
const wizUri       = ref('')
const walletConnected = ref(false)
const walletName   = ref('')
const bchAddress   = ref('')
const pubkeyHex    = ref('')
const registering  = ref(false)
const registerError = ref('')
const registered   = ref('')
const copiedUri    = ref(false)
const copiedHandle = ref(false)

let relay: ReturnType<typeof initiateDappRelay> | null = null
let mgr: DappConnectionManager | null = null

const qrUrl = computed(() =>
  wizUri.value ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wizUri.value)}` : ''
)

function copyUri() {
  navigator.clipboard.writeText(wizUri.value)
  copiedUri.value = true; setTimeout(() => { copiedUri.value = false }, 2000)
}
function copyHandle() {
  navigator.clipboard.writeText(registered.value)
  copiedHandle.value = true; setTimeout(() => { copiedHandle.value = false }, 2000)
}

async function startWizard() {
  connectError.value = ''; connecting.value = true
  try {
    mgr = new DappConnectionManager('Cashlet Landing', 'https://cashlet.netlify.app/favicon.ico', { session: false })

    relay = initiateDappRelay((payload) => {
      mgr!.updateConnection(payload.client, payload.status)
    })
    mgr.attachRelay(relay)
    wizUri.value = relay.uri

    mgr.on('walletready', (msg) => {
      walletName.value = msg.wallet_name ?? 'Wallet'
      // derive first receive address (childIndex=0, index=0)
      const pubkey = mgr!.getPubkey(0, 0n)
      if (pubkey) {
        const pkh = hash160(pubkey)
        const result = encodeCashAddress({ prefix: 'bitcoincash', type: CashAddressType.p2pkh, payload: pkh })
        if (typeof result === 'object') {
          bchAddress.value = result.address
          pubkeyHex.value = Array.from(pubkey).map(b => b.toString(16).padStart(2, '0')).join('')
        }
      }
      walletConnected.value = true
      wizUri.value = ''
    })

    mgr.on('disconnect', () => {
      walletConnected.value = false
      wizUri.value = ''
      relay?.cleanup()
    })
  } catch (e: any) {
    connectError.value = e.message ?? 'Failed to start WizardConnect'
  } finally {
    connecting.value = false
  }
}

async function register() {
  registerError.value = ''; registering.value = true
  try {
    const res = await fetch('/api/register-nip05', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value, bchAddress: bchAddress.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Registration failed')
    registered.value = data.handle
    relay?.cleanup()
  } catch (e: any) {
    registerError.value = e.message ?? 'Registration failed'
  } finally {
    registering.value = false
  }
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
.qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.qr { width: 180px; height: 180px; border-radius: 8px; }
.address-row { display: flex; align-items: center; gap: 8px; width: 100%; }
.address-text { flex: 1; color: var(--soft); }
.btn-primary { background: var(--green); color: #070b10; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-copy { background: transparent; border: 1px solid var(--line); color: #edf4f8; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.result-ok { background: rgba(0,255,163,0.06); border: 1px solid rgba(0,255,163,0.2); border-radius: 8px; padding: 12px 16px; margin-top: 12px; color: var(--green); font-size: 13px; }
.result-error { background: rgba(255,80,80,0.08); border: 1px solid rgba(255,80,80,0.2); border-radius: 8px; padding: 12px 16px; margin-top: 12px; color: #ff6b6b; font-size: 13px; }
.check-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.check { color: var(--green); }
.mono { font-family: monospace; font-size: 11px; word-break: break-all; }
.spin { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
</style>
