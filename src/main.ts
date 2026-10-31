import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import HomePage from './pages/HomePage.vue'
import VerifyPage from './pages/VerifyPage.vue'
import DocsPage from './pages/DocsPage.vue'
import PayPage from './pages/PayPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/verify', component: VerifyPage },
    { path: '/docs', component: DocsPage },
    { path: '/pay/:npub', component: PayPage },
  ],
})

createApp(App).use(router).mount('#app')
