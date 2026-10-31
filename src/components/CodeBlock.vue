<template>
  <div class="code-block">
    <button class="copy-btn" @click="copy">{{ copied ? '✓' : 'Copy' }}</button>
    <div v-html="highlighted"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { createHighlighter } from 'shiki'

const props = defineProps<{ code: string; lang?: string }>()
const highlighted = ref('')
const copied = ref(false)

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({ themes: ['github-dark'], langs: ['typescript', 'json'] })
  }
  return highlighterPromise
}

async function highlight() {
  const hl = await getHighlighter()
  highlighted.value = hl.codeToHtml(props.code, {
    lang: props.lang ?? 'typescript',
    theme: 'github-dark',
  })
}

onMounted(highlight)
watch(() => props.code, highlight)

function copy() {
  navigator.clipboard.writeText(props.code).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  })
}
</script>

<style scoped>
.code-block {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  margin: 12px 0;
  border: 1px solid #1a2a36;
}

.code-block :deep(pre) {
  margin: 0;
  padding: 16px 18px;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  background: #1a2a36;
  border: none;
  color: #8293a2;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 5px;
  cursor: pointer;
  z-index: 1;
  transition: color 0.15s;
}
.copy-btn:hover { color: #39e6a0; }
</style>
