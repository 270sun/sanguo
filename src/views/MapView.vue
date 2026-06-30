<template>
  <section class="view map-view">
    <div class="overview-bar">
      <span class="pill pill-title">疆 域</span>
      <span class="pill pill-num">
        <span class="num">{{ game.territories.length }}</span>
        <span class="slash">/</span>
        <span class="total">{{ totalCount }}</span>
      </span>
      <span class="pill pill-title">特 产 加 成</span>
      <span v-if="game.territoryRates.grain" class="pill rate">
        <AppIcon kind="res" id="grain" :size="12" />+{{ game.territoryRates.grain }}
      </span>
      <span v-if="game.territoryRates.coin" class="pill rate">
        <AppIcon kind="res" id="coin" :size="12" />+{{ game.territoryRates.coin }}
      </span>
      <span v-if="game.territoryRates.wood" class="pill rate">
        <AppIcon kind="res" id="wood" :size="12" />+{{ game.territoryRates.wood }}
      </span>
      <span v-if="game.territoryRates.soldier" class="pill rate">
        <AppIcon kind="res" id="soldier" :size="12" />+{{ game.territoryRates.soldier }}
      </span>
      <span v-if="!hasSpecial" class="pill muted">尚 无</span>
    </div>

    <div class="map-stage">
      <ChinaMap
        :owned-ids="game.territories"
        :cooldown="game.territoryCooldown"
        @pick="onPick"
      />
    </div>

    <!-- 天下大事简报：显示最近 NPC 势力的攻伐 -->
    <div v-if="game.worldLog && game.worldLog.length" class="world-chronicle">
      <div class="wc-head">
        <AppIcon kind="misc" id="scroll" :size="12" tone="gold" />
        <span>天 下 大 事</span>
        <span class="wc-tip">NPC 势力实时攻伐</span>
      </div>
      <div class="wc-list">
        <div v-for="w in game.worldLog.slice(0, 4)" :key="w.id" class="wc-item" :class="w.type">
          <span class="wc-dot">·</span>
          <span class="wc-text">{{ w.text }}</span>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="detail" class="detail-mask" @click.self="closeDetail">
        <div class="detail-card">
          <div class="detail-head">
            <span class="d-name">{{ detail.name }}</span>
            <span class="d-tag" :style="{ background: detail.tierMeta.color }">{{ detail.tierMeta.label }}</span>
          </div>
          <div class="detail-rows">
            <div class="d-row">
              <span class="d-k">守 军</span>
              <span class="d-v">{{ detail.defender }} · <b class="num">{{ detail.power }}</b></span>
            </div>
            <div class="d-row">
              <span class="d-k">特 产</span>
              <span class="d-v specials">
                <template v-if="hasAnySpecial(detail.special)">
                  <span v-if="detail.special?.grain"><AppIcon kind="res" id="grain" :size="12" />+{{ detail.special.grain }}/s</span>
                  <span v-if="detail.special?.coin"><AppIcon kind="res" id="coin" :size="12" />+{{ detail.special.coin }}/s</span>
                  <span v-if="detail.special?.wood"><AppIcon kind="res" id="wood" :size="12" />+{{ detail.special.wood }}/s</span>
                  <span v-if="detail.special?.soldier"><AppIcon kind="res" id="soldier" :size="12" />+{{ detail.special.soldier }}/s</span>
                </template>
                <span v-else class="muted">无</span>
              </span>
            </div>
            <div v-if="detail.conqueredAt" class="d-row">
              <span class="d-k">占领时间</span>
              <span class="d-v">{{ formatTime(detail.conqueredAt) }}</span>
            </div>
            <div v-if="detail.desc" class="d-desc">{{ detail.desc }}</div>
          </div>
          <div class="detail-foot">
            <button class="btn-close" @click="closeDetail">关 闭</button>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { TERRITORIES, TIER_META } from '../data/territories'
import AppIcon from '../components/AppIcon.vue'
import ChinaMap from '../components/ChinaMap.vue'

const router = useRouter()
const game = useGameStore()
const totalCount = TERRITORIES.length

const hasSpecial = computed(() => {
  const r = game.territoryRates
  return r.grain > 0 || r.coin > 0 || r.wood > 0 || r.soldier > 0
})

const detail = ref(null)

function onPick(t) {
  const owned = game.territories.includes(t.id)
  if (owned) {
    const conqueredAt = game.territoryConqueredAt?.[t.id] || null
    detail.value = {
      ...t,
      tierMeta: TIER_META[t.tier] || TIER_META[1],
      conqueredAt
    }
  } else {
    router.push({ path: '/battle', query: { target: t.id } })
  }
}

function closeDetail() {
  detail.value = null
}

function hasAnySpecial(s) {
  if (!s) return false
  return !!(s.grain || s.coin || s.wood || s.soldier)
}

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.map-view {
  /* 贴合 .app-main 的可视高度（外层已是滚动容器） */
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.overview-bar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .55);
  border-radius: var(--r-sm);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 14px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703,
    0 3px 6px rgba(0, 0, 0, .5);
  overflow-x: auto;
  flex-shrink: 0;
}
.overview-bar::-webkit-scrollbar { height: 0; display: none; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--c-gold-light);
  background: rgba(20, 10, 4, .55);
  border: 1px solid rgba(232, 196, 104, .4);
  border-radius: var(--r-lg);
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.pill-title {
  font-family: var(--font-title);
  letter-spacing: 2px;
  color: var(--c-gold);
  background: rgba(40, 22, 10, .7);
  border-color: rgba(232, 196, 104, .65);
}
.pill-num .num {
  font-size: 14px;
  color: var(--c-gold);
  font-weight: 700;
}
.pill-num .slash {
  opacity: .55;
  margin: 0 1px;
}
.pill-num .total { opacity: .75; }
.pill.rate { color: #b3e5a3; }
.pill.muted { opacity: .55; }

.map-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
}
.world-chronicle {
  margin: 6px 0 4px;
  padding: 6px 8px 7px;
  background: linear-gradient(180deg, rgba(40, 24, 14, .82), rgba(20, 10, 4, .9));
  border: 1px solid rgba(232, 196, 104, .35);
  border-left: 3px solid var(--c-red-dark);
  border-radius: var(--r-sm);
  box-shadow: 0 2px 5px rgba(0,0,0,.55), inset 0 0 0 1px rgba(0,0,0,.35);
}
.wc-head {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--c-gold);
  letter-spacing: .12em;
}
.wc-tip { font-size: 12px; color: var(--c-paper-dark); opacity: .65; margin-left: auto; letter-spacing: 0; }
.wc-list { display: flex; flex-direction: column; gap: 2px; }
.wc-item { font-size: 13px; line-height: 1.4; color: var(--c-paper); display: flex; gap: 4px; }
.wc-item.war .wc-dot { color: var(--c-red-dark); font-weight: 700; }
.wc-item.truce .wc-dot { color: var(--c-paper-dark); opacity: .6; }
.wc-text { flex: 1; }
.map-stage :deep(.china-map) {
  width: 100%;
  height: 100%;
  max-height: 100%;
  aspect-ratio: auto;
}

.detail-mask {
  position: fixed;
  inset: 0;
  background: rgba(8, 4, 2, .65);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.detail-card {
  width: min(86vw, 360px);
  background: var(--panel-bg-deep-strong);
  border: 1px solid var(--c-gold);
  border-radius: var(--r-sm);
  padding: 14px 16px 12px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .18),
    inset 0 0 24px rgba(0, 0, 0, .6),
    0 4px 0 #0e0703,
    0 12px 28px rgba(0, 0, 0, .7);
  color: var(--c-gold-light);
}
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px dashed rgba(232, 196, 104, .35);
}
.d-name {
  font-family: var(--font-title);
  font-size: 17px;
  letter-spacing: 3px;
  color: var(--c-gold);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.d-tag {
  font-family: var(--font-title);
  font-size: 12px;
  color: #fff1c2;
  padding: 1px 6px;
  border: 1px solid rgba(0, 0, 0, .55);
  letter-spacing: 1px;
  box-shadow: inset 0 0 0 1px rgba(255, 240, 200, .25);
}
.detail-rows { display: flex; flex-direction: column; gap: 6px; }
.d-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.d-k {
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--c-gold);
  min-width: 56px;
}
.d-v { color: var(--c-gold-light); }
.d-v .num { color: #ff8a78; font-weight: 700; }
.d-v.specials {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #b3e5a3;
}
.d-v.specials span {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.d-v .muted { color: var(--c-gold-light); opacity: .55; }
.d-desc {
  font-size: 13px;
  opacity: .8;
  margin-top: 2px;
  padding-top: 6px;
  border-top: 1px dashed rgba(232, 196, 104, .25);
  letter-spacing: 1px;
}

.detail-foot {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}
.btn-close {
  font-family: var(--font-title);
  letter-spacing: 4px;
  font-size: 14px;
  color: #fff5cf;
  background: linear-gradient(180deg, #d75a52, #8e1a14);
  border: 1px solid var(--c-red-dark);
  padding: 6px 22px;
  cursor: pointer;
  border-radius: var(--r-sm);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .3),
    0 2px 0 #0e0703;
  transition: filter .15s;
}
.btn-close:hover { filter: brightness(1.1); }
.btn-close:active { transform: translateY(1px); box-shadow: inset 0 0 0 1px rgba(255, 240, 200, .3); }

.fade-enter-active, .fade-leave-active { transition: opacity .18s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .detail-mask {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(8, 4, 2, .82);
  }
}
</style>
