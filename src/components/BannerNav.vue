<template>
  <nav class="dragon-bar">
    <router-link
      v-for="t in tabs"
      :key="t.path"
      :to="t.path"
      class="d-tab"
      active-class="active"
    >
      <span class="d-glyph">{{ t.glyph }}</span>
      <span class="d-name">{{ t.title }}</span>
      <span class="d-underline"></span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 篆刻字形（每个 tab 用 1 个字代表，强调铭文质感）
const GLYPH = {
  '/city': '城',
  '/heroes': '将',
  '/world': '图',
  '/profile': '主',
  '/chronicle': '史'
}

const tabs = computed(() =>
  router.options.routes
    .filter((r) => r.meta && r.meta.title)
    .map((r) => ({
      path: r.path,
      title: r.meta.title,
      glyph: GLYPH[r.path] || r.meta.title[0]
    }))
)
</script>

<style scoped>
.dragon-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  z-index: 80;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  padding: 0 4px;
  background:
    linear-gradient(180deg, transparent 0%, rgba(20, 10, 4, .55) 35%, rgba(20, 10, 4, .92) 100%);
  border-top: 1px solid rgba(232, 196, 104, .35);
  /* 暗刻龙骨纹理：极淡的菱形纹 */
  background-image:
    linear-gradient(180deg, transparent 0%, rgba(20, 10, 4, .55) 35%, rgba(20, 10, 4, .92) 100%),
    repeating-linear-gradient(45deg, transparent 0 6px, rgba(232, 196, 104, .04) 6px 7px);
}
.d-tab {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #b09870;
  text-decoration: none;
  font-family: var(--font-title);
  letter-spacing: 1px;
  cursor: pointer;
  transition: color .18s, transform .15s;
}
.d-tab:hover { color: #f0d590; }
.d-glyph {
  font-size: var(--fs-3xl);
  line-height: 1;
  color: inherit;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
  transition: transform .18s;
}
.d-name {
  font-size: var(--fs-2xs);
  letter-spacing: 2px;
  color: inherit;
  opacity: 1;
}
.d-underline {
  position: absolute;
  bottom: 6px;
  width: 14px;
  height: 2px;
  background: transparent;
  border-radius: var(--r-sm);
  transition: background .18s, width .25s cubic-bezier(.2,.8,.25,1.05);
}

/* 选中态：印章感 */
.d-tab.active {
  color: #fff1c2;
}
.d-tab.active .d-glyph {
  color: #fff1c2;
  text-shadow: 0 0 8px rgba(232, 196, 104, .75), 0 1px 2px rgba(0, 0, 0, .9);
  transform: translateY(-1px) scale(1.06);
}
.d-tab.active .d-underline {
  width: 26px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #e8c468, transparent);
  box-shadow: 0 0 6px rgba(232, 196, 104, .6);
}
.d-tab.active::before {
  content: '';
  position: absolute;
  inset: 4px 8px;
  background: radial-gradient(ellipse at center, rgba(232, 196, 104, .22) 0%, transparent 65%);
  border-radius: 50%;
  pointer-events: none;
}
.d-tab:active .d-glyph { transform: translateY(1px) scale(.96); }

@media (max-width: 768px), (pointer: coarse) {
  .d-tab:hover { color: #b09870; }
}
</style>
