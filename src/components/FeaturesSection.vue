<template>
  <section class="features">
    <div class="features-inner">
      <h2>Everything in one extension</h2>
      <p class="section-sub">Built on open standards. No accounts. No servers.</p>
      <div class="grid">
        <div class="card" v-for="f in features" :key="f.title">
          <div class="card-icon" :style="{ background: f.bg, color: f.color }">
            <span v-html="f.icon"/>
          </div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    title: "BCH Wallet",
    desc: "Send and receive Bitcoin Cash with full UTXO control. BIP39/BIP44 HD wallet, encrypted with AES-GCM-256.",
    icon: "₿",
    bg: "rgba(57,230,160,0.1)", color: "var(--green)",
  },
  {
    title: "CashTokens",
    desc: "Send and receive fungible tokens and NFTs. Full BCMR metadata — names, icons, decimals resolved automatically.",
    icon: "◈",
    bg: "rgba(251,191,36,0.1)", color: "var(--amber)",
  },
  {
    title: "Nostr Identity",
    desc: "Cryptographically bind your BCH address to a Nostr keypair. Publish to relays. Pay anyone by npub.",
    icon: "⚡",
    bg: "rgba(92,157,255,0.1)", color: "var(--blue)",
  },
  {
    title: "NIP-07 Signer",
    desc: "Works as a window.nostr provider on any Nostr web app — Snort, nostrudel, Primal. Sign events with one click.",
    icon: "✍",
    bg: "rgba(57,230,160,0.1)", color: "var(--green)",
  },
  {
    title: "WizardConnect",
    desc: "Connect to BCH dapps via WizardConnect protocol. Approve transactions directly from the extension popup.",
    icon: "🔗",
    bg: "rgba(92,157,255,0.1)", color: "var(--blue)",
  },
  {
    title: "Identity Verifier",
    desc: "Independent on-chain verification of BCH–Nostr identity bindings. No central authority required.",
    icon: "🛡",
    bg: "rgba(248,113,113,0.1)", color: "var(--red)",
  },
]
</script>

<style scoped>
.features {
  border-top: 1px solid var(--line);
  padding: 80px 24px;
}
.features-inner {
  max-width: 1100px;
  margin: 0 auto;
}
h2 {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 700;
  text-align: center;
  margin-bottom: 10px;
}
.section-sub {
  text-align: center;
  color: var(--muted);
  font-size: 15px;
  margin-bottom: 48px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
  transition: border-color 0.2s;
}
.card:hover { border-color: var(--green); }
.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 14px;
}
.card h3 {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #edf4f8;
}
.card p {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
}
</style>
