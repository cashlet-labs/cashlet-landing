<template>
  <div class="pay-page">
    <!-- Loading -->
    <div v-if="state === 'loading'" class="card center">
      <div class="spinner" />
      <p class="muted">Resolving identity…</p>
    </div>

    <!-- Not found -->
    <div v-else-if="state === 'notfound'" class="card center">
      <p class="error-icon">✕</p>
      <h2>No payment handle found</h2>
      <p class="muted">This npub hasn't published a Cashlet identity binding yet.</p>
      <p class="npub-display">{{ npub }}</p>
    </div>

    <!-- Found -->
    <div v-else-if="state === 'found'" class="card">
      <!-- Header -->
      <div class="identity-header">
        <div class="avatar">₿</div>
        <div>
          <div class="npub-short">{{ shortNpub }}</div>
          <span :class="['network-badge', network === 'mainnet' || network === 'chipnet' ? (isTestnet ? 'badge-amber' : 'badge-green') : 'badge-amber']">
            {{ isTestnet ? '⚠ Testnet' : '● Mainnet' }}
          </span>
        </div>
      </div>

      <!-- Address -->
      <div class="section">
        <label class="section-label">BCH Address</label>
        <div class="address-row">
          <span class="address-text">{{ address }}</span>
          <button class="btn-copy" @click="copy(address!, 'address')">
            {{ copied === 'address' ? '✓' : 'Copy' }}
          </button>
        </div>
      </div>

      <!-- QR -->
      <div class="section center">
        <img :src="qrUrl" alt="QR code" class="qr" />
        <p class="muted qr-hint">Scan with any BCH wallet</p>
      </div>

      <!-- Connect options -->
      <div class="section">
        <label class="section-label">Pay with your wallet</label>
        <div class="connect-options">
          <a :href="cashletUri" class="connect-btn btn-primary">
            Open in Cashlet
          </a>
          <button class="connect-btn btn-secondary" @click="showWizard = !showWizard">
            Any wallet (WizardConnect)
          </button>
          <a :href="bip21Uri" class="connect-btn btn-secondary">
            BIP-21 / copy address
          </a>
        </div>

        <!-- WizardConnect URI -->
        <div v-if="showWizard" class="wizard-box">
          <p class="muted" style="font-size:13px;margin-bottom:8px">Paste this URI into any WizardConnect-compatible wallet</p>
          <div class="address-row">
            <span class="address-text" style="font-size:12px;word-break:break-all">{{ wizardUri }}</span>
            <button class="btn-copy" @click="copy(wizardUri, 'wizard')">
              {{ copied === 'wizard' ? '✓' : 'Copy' }}
            </button>
          </div>
        </div>

        <div style="margin-top:14px">
          <router-link :to="`/verify?npub=${npub}`" class="verify-link">Verify this identity →</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { resolveIdentity, resolveByNip05 } from 'did-beta-bch'

const route = useRoute()
const npub = route.params.npub as string

// Support NIP-05 handles passed as npub param (e.g. /pay/alice@cashlet.com)
const isNip05 = npub.includes('@')

const state = ref<'loading' | 'found' | 'notfound'>('loading')
const address = ref<string | null>(null)
const network = ref<string>('mainnet')
const copied = ref<string | null>(null)
const showWizard = ref(false)

const isTestnet = computed(() => network.value !== 'mainnet')
const shortNpub = computed(() => npub ? `${npub.slice(0, 12)}…${npub.slice(-6)}` : '')
const bip21Uri = computed(() => address.value ? `bitcoincash:${address.value.replace('bitcoincash:', '')}` : '')
const cashletUri = computed(() => address.value ? `https://cashlet.netlify.app/pay/${npub}` : '')
const wizardUri = computed(() => address.value ? `wizardconnect:${address.value}` : '')
const qrUrl = computed(() => address.value
  ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bip21Uri.value)}`
  : '')

async function copy(text: string, key: string) {
  await navigator.clipboard.writeText(text)
  copied.value = key
  setTimeout(() => { copied.value = null }, 2000)
}

onMounted(async () => {
  try {
    let addr: string | null = null
    if (isNip05) {
      addr = await resolveByNip05(npub)
    } else {
      const identity = await resolveIdentity(npub)
      addr = identity?.bchAddress ?? null
      if (identity) network.value = identity.network
    }
    if (!addr) { state.value = 'notfound'; return }
    address.value = addr
    state.value = 'found'
  } catch {
    state.value = 'notfound'
  }
})
</script>

<style scoped>
.pay-page {
  max-width: 480px;
  margin: 48px auto;
  padding: 0 16px;
}
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.center { align-items: center; text-align: center; }
.identity-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar {
  width: 48px; height: 48px;
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: var(--green);
}
.npub-short { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
.network-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
}
.badge-green { background: rgba(57,230,160,0.12); color: var(--green); }
.badge-amber { background: rgba(251,191,36,0.12); color: var(--amber); }
.section { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.section-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.address-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
}
.address-text {
  flex: 1;
  font-size: 13px;
  color: var(--soft);
  word-break: break-all;
  font-family: monospace;
}
.btn-copy {
  background: var(--line);
  border: none;
  color: var(--soft);
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.btn-copy:hover { background: var(--green2); color: #fff; }
.qr { width: 180px; height: 180px; border-radius: 10px; }
.qr-hint { font-size: 12px; margin-top: 6px; }
.connect-options { display: flex; flex-direction: column; gap: 10px; }
.connect-btn {
  display: block;
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  border: none;
}
.btn-primary { background: var(--green); color: #070b10; }
.btn-primary:hover { background: var(--green2); }
.btn-secondary { background: var(--panel2); color: var(--soft); border: 1px solid var(--line); }
.btn-secondary:hover { border-color: var(--green); color: var(--green); }
.wizard-box {
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px;
  margin-top: 4px;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--line);
  border-top-color: var(--green);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 32px; color: var(--red); }
.muted { color: var(--muted); font-size: 14px; }
.verify-link { color: var(--green); font-size: 13px; font-weight: 600; text-decoration: none; }
.verify-link:hover { text-decoration: underline; }
.npub-display { font-size: 12px; color: var(--muted); font-family: monospace; word-break: break-all; margin-top: 8px; }
</style>
