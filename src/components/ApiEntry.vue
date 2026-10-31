<template>
  <div class="api-entry">
    <div class="api-header">
      <span class="api-name">{{ name }}</span>
    </div>
    <div class="api-sig"><code>{{ signature }}</code></div>
    <p class="api-desc">{{ desc }}</p>
    <CodeBlock :code="code" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from './CodeBlock.vue'
defineProps<{ name: string; signature: string; desc: string; code: string }>()
</script>

<style scoped>
.api-entry {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #111e28;
}
.api-entry:last-child { border-bottom: none; }

.api-name {
  font-family: monospace;
  font-size: 16px;
  font-weight: 700;
  color: #e2eaf0;
}

.api-sig {
  margin: 8px 0 10px;
  font-size: 12px;
  word-break: break-all;
}

.api-sig code {
  background: none;
  padding: 0;
  color: #8293a2;
  font-size: 12px;
}

.api-desc { font-size: 13px; color: #8293a2; margin-bottom: 4px; }
</style>
