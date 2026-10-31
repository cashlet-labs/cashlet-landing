<template>
  <section class="hero">
    <div class="hero-inner">
      <div class="badge">Bitcoin Cash · Nostr · Self-Sovereign</div>
      <h1>Your keys.<br/>Your identity.<br/><span class="accent">Your wallet.</span></h1>
      <p class="sub">
        Cashlet is a self-custodial Bitcoin Cash wallet with built-in Nostr identity,
        NIP-07 signing, CashToken support, and decentralized identity verification —
        no accounts, no servers, no compromise.
      </p>
      <div class="hero-actions">
        <a href="/verify" class="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Verify an Identity
        </a>
        <a href="/register" class="btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Claim your handle
        </a>
      </div>
      <div class="hero-note">Open source · Non-custodial · Powered by Cashlet extension</div>
    </div>
    <div class="hero-visual">
      <div class="phone-mock">
        <div class="mock-bar">
          <span class="mock-dot" style="background:#f87171"/>
          <span class="mock-dot" style="background:#fbbf24"/>
          <span class="mock-dot" style="background:#39e6a0"/>
        </div>
        <div class="mock-body">
          <div class="mock-label">Balance</div>
          <div class="mock-balance">1.24800000 <span>BCH</span></div>
          <div class="mock-fiat">≈ $312.40 USD</div>
          <div class="mock-divider"/>
          <div class="mock-row">
            <span class="mock-pill green">↓ Received</span>
            <span class="mock-amount">+0.05 BCH</span>
          </div>
          <div class="mock-row">
            <span class="mock-pill blue">⚡ Nostr DID</span>
            <span class="mock-amount muted">Bound</span>
          </div>
          <div class="mock-row">
            <span class="mock-pill amber">◈ Token</span>
            <span class="mock-amount">1,000 PayronUSD</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 24px 60px;
  display: flex;
  align-items: center;
  gap: 60px;
}
.hero-inner { flex: 1; }
.badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: var(--green);
  background: rgba(57,230,160,0.1);
  border: 1px solid rgba(57,230,160,0.25);
  border-radius: 20px;
  padding: 4px 12px;
  margin-bottom: 24px;
  letter-spacing: 0.04em;
}
h1 {
  font-family: var(--font-display);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 20px;
  color: #edf4f8;
}
.accent { color: var(--green); }
.sub {
  font-size: 16px;
  color: var(--soft);
  line-height: 1.7;
  max-width: 480px;
  margin-bottom: 32px;
}
.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--green);
  color: #070b10;
  font-weight: 700;
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
}
.btn-primary:hover { background: var(--green2); text-decoration: none; }
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel);
  color: #edf4f8;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 10px;
  border: 1px solid var(--line);
  text-decoration: none;
}
.btn-secondary:hover { border-color: var(--green); text-decoration: none; }
.hero-note { font-size: 12px; color: var(--muted); }

/* mock wallet */
.hero-visual { flex-shrink: 0; }
.phone-mock {
  width: 260px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
}
.mock-bar {
  display: flex;
  gap: 6px;
  padding: 12px 14px 8px;
  border-bottom: 1px solid var(--line);
}
.mock-dot { width: 10px; height: 10px; border-radius: 50%; }
.mock-body { padding: 20px 18px; }
.mock-label { font-size: 11px; color: var(--muted); margin-bottom: 6px; }
.mock-balance { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: #edf4f8; }
.mock-balance span { font-size: 14px; color: var(--muted); }
.mock-fiat { font-size: 12px; color: var(--muted); margin-bottom: 18px; }
.mock-divider { height: 1px; background: var(--line); margin-bottom: 14px; }
.mock-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.mock-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
}
.mock-pill.green { background: rgba(57,230,160,0.12); color: var(--green); }
.mock-pill.blue  { background: rgba(92,157,255,0.12); color: var(--blue); }
.mock-pill.amber { background: rgba(251,191,36,0.12); color: var(--amber); }
.mock-amount { font-size: 12px; font-weight: 600; color: #edf4f8; }
.mock-amount.muted { color: var(--muted); }

@media (max-width: 768px) {
  .hero { flex-direction: column; padding: 48px 20px 40px; gap: 40px; }
  .hero-visual { width: 100%; display: flex; justify-content: center; }
}
</style>
