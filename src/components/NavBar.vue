<template>
  <nav class="nav">
    <div class="nav-inner">
      <router-link to="/" class="logo">
        <span class="logo-mark">₿</span>
        <span class="logo-text">Cashlet</span>
      </router-link>
      <div class="nav-links">
        <router-link to="/verify">Verify Identity</router-link>
        <router-link to="/register">Get a Handle</router-link>
        <router-link to="/docs">Docs</router-link>
        <a href="https://github.com" target="_blank">GitHub</a>
        <a href="/#download" class="btn-nav">Get Extension</a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(7, 11, 16, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}
.logo-mark {
  font-size: 22px;
  color: var(--green);
}
.logo-text {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: #edf4f8;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
  font-size: 14px;
  color: var(--soft);
}
.nav-links a { color: var(--soft); }
.nav-links a:hover { color: #edf4f8; text-decoration: none; }
.btn-nav {
  background: var(--green);
  color: #070b10 !important;
  font-weight: 600;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
}
.btn-nav:hover { background: var(--green2); text-decoration: none !important; }
</style>
