<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span class="logo-mark">₿</span>
        <span class="logo-text">Cashlet</span>
        <span class="footer-copy">© 2025 · Open source · MIT</span>
      </div>
      <div class="footer-links">
        <a href="/verify">Verify Identity</a>
        <a href="https://github.com" target="_blank">GitHub</a>
        <a href="https://t.me" target="_blank">Telegram</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--line);
  padding: 28px 24px;
}
.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-mark { font-size: 18px; color: var(--green); }
.logo-text { font-family: var(--font-display); font-weight: 700; font-size: 15px; }
.footer-copy { font-size: 12px; color: var(--muted); margin-left: 8px; }
.footer-links {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: var(--muted);
}
.footer-links a { color: var(--muted); }
.footer-links a:hover { color: var(--green); text-decoration: none; }
</style>
