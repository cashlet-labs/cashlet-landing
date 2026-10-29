<template>
  <main>
    <section class="hero">
      <div class="hero-inner">
        <div class="badge">Bitcoin Cash · Nostr Identity</div>
        <h1>Your BCH wallet.<br><span class="accent">Your identity.</span></h1>
        <p class="sub">Cashlet is a self-custodial Bitcoin Cash wallet with decentralised Nostr identity. Send BCH to anyone by their Nostr handle — no address copy-paste required.</p>
        <div class="coming-soon">
          <span class="dot"></span>
          Extension coming soon
        </div>
      </div>
      <div class="glow"></div>
    </section>

    <section class="features">
      <div class="features-inner">
        <div class="feature-card" v-for="f in features" :key="f.title">
          <div class="feature-icon">{{ f.icon }}</div>
          <div class="feature-title">{{ f.title }}</div>
          <div class="feature-desc">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <footer>
      <p>Built by <a href="https://github.com/cashlet-labs" target="_blank">cashlet-labs</a> · Open source · MIT</p>
    </footer>
  </main>
</template>

<script setup lang="ts">
const features = [
  { icon: '🔑', title: 'Self-custodial', desc: 'Your keys, your coins. Mnemonics encrypted with AES-GCM-256, never leave your device.' },
  { icon: '🪪', title: 'Nostr Identity', desc: 'Bind your BCH address to a Nostr public key. Anyone can pay you by npub handle.' },
  { icon: '🪙', title: 'CashTokens', desc: 'Full support for fungible tokens and NFTs on Bitcoin Cash.' },
  { icon: '🔌', title: 'NIP-07 Signer', desc: 'Use Cashlet as a Nostr signer on any compatible web app — Primal, Damus, nostrudel.' },
  { icon: '🔗', title: 'WizardConnect', desc: 'Connect to BCH dApps via WizardConnect and CashConnect protocols.' },
  { icon: '📦', title: 'cashlet-did', desc: 'The identity layer is a standalone npm library any BCH wallet can integrate.' },
]
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: 100px 24px 80px;
  text-align: center;
}
.hero-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }

.badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--green);
  border: 1px solid var(--green);
  border-radius: 20px;
  padding: 4px 14px;
  margin-bottom: 24px;
}

h1 {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 6vw, 3.5rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 20px;
}
.accent { color: var(--green); }

.sub {
  font-size: 1.05rem;
  color: var(--soft);
  line-height: 1.7;
  margin-bottom: 36px;
}

.coming-soon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: var(--soft);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--amber);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(57,230,160,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.features { padding: 40px 24px 80px; }
.features-inner {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.feature-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
}
.feature-icon { font-size: 24px; margin-bottom: 12px; }
.feature-title { font-family: var(--font-display); font-weight: 600; margin-bottom: 6px; }
.feature-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }

footer {
  text-align: center;
  padding: 24px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
}
</style>
