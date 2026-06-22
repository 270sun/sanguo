<template>
  <div class="china-map" :class="{ compact }">
    <svg class="map-svg" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
      <!-- 背景：宣纸/烟雾 -->
      <defs>
        <radialGradient id="map-bg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#2a1a0c" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#0a0503" stop-opacity="0.7" />
        </radialGradient>
        <filter id="ink-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <rect width="500" height="500" fill="url(#map-bg)" />

      <!-- 简化中国大陆轮廓（仅东汉十三州大致范围，写意笔法） -->
      <g class="continent" filter="url(#ink-blur)">
        <path d="
          M 60 180
          Q 80 130 130 110
          Q 200 80 280 90
          Q 360 95 420 130
          Q 460 160 450 220
          Q 440 280 400 320
          Q 360 370 300 400
          Q 240 430 180 425
          Q 110 415 80 370
          Q 50 320 55 260
          Q 58 220 60 180 Z
        " fill="rgba(60, 36, 18, 0.45)" stroke="rgba(232, 196, 104, 0.55)" stroke-width="1.5" />
        <!-- 长江写意 -->
        <path d="M 80 320 Q 200 310 320 340 Q 380 350 420 340"
              fill="none" stroke="rgba(100, 160, 200, 0.5)" stroke-width="2" stroke-linecap="round" />
        <!-- 黄河写意 -->
        <path d="M 90 230 Q 200 210 280 240 Q 360 260 420 230"
              fill="none" stroke="rgba(212, 175, 80, 0.45)" stroke-width="2" stroke-linecap="round" />
      </g>

      <!-- 雾纱粒子 -->
      <g class="mist">
        <circle cx="120" cy="160" r="2" fill="rgba(212,175,80,0.3)" />
        <circle cx="380" cy="200" r="1.5" fill="rgba(212,175,80,0.25)" />
        <circle cx="250" cy="380" r="2" fill="rgba(212,175,80,0.3)" />
      </g>

      <!-- 州热点（连线 - 我方 territories 的版图） -->
      <g v-if="ownedIds && ownedIds.length > 1" class="owned-lines">
        <line v-for="seg in ownedSegments" :key="seg.k"
              :x1="seg.x1" :y1="seg.y1" :x2="seg.x2" :y2="seg.y2"
              stroke="rgba(232, 196, 104, 0.55)" stroke-width="1.2" stroke-dasharray="3 3" />
      </g>

      <!-- 州热点 -->
      <g class="hotspots">
        <g v-for="t in territories" :key="t.id"
           class="hotspot"
           :class="[`tier-${t.tier}`, { owned: isOwned(t.id), selected: selectedId === t.id, locked: isLocked(t.id) }]"
           :transform="`translate(${pos(t).x}, ${pos(t).y})`"
           @click="$emit('pick', t)">
          <!-- 旗杆（仅 owned） -->
          <line v-if="isOwned(t.id)" x1="0" y1="0" x2="0" y2="-22"
                stroke="#d4af37" stroke-width="1.5" />
          <!-- 旗面（仅 owned） -->
          <path v-if="isOwned(t.id)"
                d="M 0 -22 L 12 -19 L 9 -14 L 12 -9 L 0 -12 Z"
                fill="#a8231a" stroke="#4a0808" stroke-width="0.6" />

          <!-- 外发光圈 -->
          <circle r="14" class="halo" :fill="tierColor(t.tier)" opacity="0.18" />
          <!-- 主点 -->
          <circle r="8" class="dot-main"
                  :fill="isOwned(t.id) ? '#a8231a' : 'rgba(20,10,4,0.85)'"
                  :stroke="tierColor(t.tier)" stroke-width="1.6" />
          <!-- 内点 -->
          <circle r="3" :fill="tierColor(t.tier)" />

          <!-- 名字 -->
          <text class="t-text" :y="22" text-anchor="middle">{{ shortName(t.name) }}</text>
          <!-- 选中环 -->
          <circle v-if="selectedId === t.id" r="16" class="sel-ring"
                  fill="none" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="4 3" />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TERRITORIES, TIER_META } from '../data/territories.js'

const props = defineProps({
  ownedIds: { type: Array, default: () => [] },
  cooldown: { type: Object, default: () => ({}) },
  selectedId: { type: String, default: null },
  compact: { type: Boolean, default: false }
})

defineEmits(['pick'])

const territories = computed(() => TERRITORIES)

function pos(t) {
  const col = t.grid?.col || 3
  const row = t.grid?.row || 3
  const x = 60 + (col - 1) * 95
  const y = 110 + (row - 1) * 72
  return { x, y }
}

function isOwned(id) {
  return props.ownedIds.includes(id)
}

function isLocked(id) {
  const ts = props.cooldown[id] || 0
  return ts > Date.now()
}

function tierColor(tier) {
  return TIER_META[tier]?.color || '#d4af37'
}

function shortName(name) {
  return name.replace(/^.+·/, '').slice(0, 3)
}

const ownedSegments = computed(() => {
  const arr = []
  const owned = territories.value.filter((t) => isOwned(t.id))
  for (let i = 0; i < owned.length; i++) {
    for (let j = i + 1; j < owned.length; j++) {
      const a = pos(owned[i])
      const b = pos(owned[j])
      const dx = a.x - b.x
      const dy = a.y - b.y
      if (Math.hypot(dx, dy) < 140) {
        arr.push({ k: owned[i].id + '-' + owned[j].id, x1: a.x, y1: a.y, x2: b.x, y2: b.y })
      }
    }
  }
  return arr
})
</script>

<style scoped>
.china-map {
  width: 100%;
  aspect-ratio: 1;
  max-height: 56vh;
  position: relative;
  border: 1px solid rgba(232, 196, 104, 0.45);
  background:
    radial-gradient(ellipse at center, rgba(40, 22, 10, 0.45), rgba(10, 5, 3, 0.85)),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0 0.15  0 0 0 0.22 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: cover, 160px 160px;
  box-shadow:
    inset 0 0 18px rgba(0, 0, 0, 0.55),
    0 4px 12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.china-map.compact {
  max-height: 48vh;
}
.map-svg {
  width: 100%;
  height: 100%;
  display: block;
}
.hotspot {
  cursor: pointer;
}
.hotspot .dot-main,
.hotspot .halo {
  transition: r 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
}
.hotspot:hover .dot-main {
  filter: drop-shadow(0 0 6px #ffd86b) brightness(1.2);
}
.hotspot:hover .halo {
  opacity: 0.55 !important;
}
.hotspot.owned .dot-main {
  filter: drop-shadow(0 0 4px rgba(168, 35, 26, 0.85));
}
.hotspot.owned:hover .dot-main {
  filter: drop-shadow(0 0 7px #ff7a6e) brightness(1.15);
}
.hotspot.locked {
  opacity: 0.45;
}
.hotspot.selected .dot-main {
  filter: drop-shadow(0 0 6px #d4af37);
}
.halo {
  transform-box: fill-box;
  transform-origin: center;
  animation: halo-pulse 2.4s ease-in-out infinite;
}
@keyframes halo-pulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50%      { opacity: 0.35; transform: scale(1.18); }
}
.t-text {
  font-family: var(--font-title);
  font-size: 11px;
  fill: #ffd86b;
  font-weight: 700;
  paint-order: stroke;
  stroke: #0a0503;
  stroke-width: 2.5;
  stroke-linejoin: round;
  letter-spacing: 1px;
}
.hotspot.owned .t-text {
  fill: #ffe89a;
  stroke-width: 3;
}
.sel-ring {
  transform-box: fill-box;
  transform-origin: center;
  animation: ring-spin 6s linear infinite;
}
@keyframes ring-spin {
  to { transform: rotate(360deg); }
}
</style>
