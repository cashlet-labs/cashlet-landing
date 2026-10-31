<template>
  <NavBar />
  <router-view />
  <FooterBar />
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import FooterBar from './components/FooterBar.vue'
</script>
