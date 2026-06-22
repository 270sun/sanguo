<template>
  <span
    class="app-icon"
    :class="['ai-' + kind, 'ai-id-' + id, { 'ai-tone-gold': tone === 'gold', 'ai-tone-red': tone === 'red', 'ai-tone-ink': tone === 'ink' }]"
    :style="{ width: sizePx, height: sizePx, color: color }"
    v-html="svg"
  />
</template>

<script setup>
import { computed } from 'vue'
import { ICON_GROUPS, FALLBACK_ICON } from '../assets/icons.js'

const props = defineProps({
  kind: { type: String, required: true },
  id:   { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  color:{ type: String, default: '' },
  tone: { type: String, default: 'gold' }
})

const sizePx = computed(() => {
  const n = typeof props.size === 'number' ? props.size : parseFloat(props.size)
  return Number.isFinite(n) ? n + 'px' : props.size
})

const svg = computed(() => {
  const group = ICON_GROUPS[props.kind]
  if (!group) return FALLBACK_ICON
  return group[props.id] || FALLBACK_ICON
})
</script>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: -0.15em;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 0 rgba(0,0,0,.35));
  transition: transform .25s ease, filter .25s ease;
}
.app-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
.ai-tone-gold { color: #e9c46a; }
.ai-tone-red  { color: #c0392b; }
.ai-tone-ink  { color: #2c1810; }
.app-icon:hover { transform: translateY(-1px) scale(1.05); filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); }
</style>
