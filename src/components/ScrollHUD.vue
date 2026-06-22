<template>
  <header class="scroll-hud">
    <!-- 卷轴顶杆 -->
    <div class="scroll-rod top">
      <div class="rod-cap left"></div>
      <div class="rod-bar"></div>
      <div class="rod-cap right"></div>
    </div>

    <!-- 卷轴纸面 -->
    <div class="scroll-paper">
      <!-- 朱红印章 -->
      <div class="seal-stamp">
        <span class="seal-char">汉</span>
      </div>

      <!-- 主公标签 -->
      <div class="lord-row">
        <span class="lord-name">{{ game.meta.lordName }}</span>
        <span class="lord-title">·诸侯</span>
        <span
          class="season-chip"
          :style="{ '--sc': seasonObj.color, borderColor: seasonObj.color }"
          :title="seasonTip"
        >
          <span class="sc-label" :style="{ color: seasonObj.color }">{{ seasonObj.label }}</span>
          <span class="sc-date">{{ game.currentYear }}年·{{ game.currentSeasonDay }}日</span>
          <span class="sc-progress">
            <span class="sc-fill" :style="{ width: seasonPct + '%', background: seasonObj.color }"></span>
          </span>
        </span>
        <router-link to="/chronicle" class="chronicle-pin" :class="{ alert: !!game.pendingEvent }">
          <AppIcon kind="misc" id="scroll" :size="12" />
          <span>{{ game.chronicle.length }}</span>
          <span v-if="game.pendingEvent" class="cb-dot"></span>
        </router-link>
      </div>

      <!-- 资源行 -->
      <div class="res-row">
        <div v-for="r in game.resourceList" :key="r.key" class="res-pill">
          <AppIcon class="res-icon" :kind="r.iconKind || 'res'" :id="r.iconId || r.key" :size="16" />
          <span class="res-val" :key="Math.floor(r.value)">{{ formatNum(r.value) }}</span>
          <span v-if="r.rate" class="res-rate" :class="{ neg: r.rate < 0 }">
            {{ r.rate >= 0 ? '+' : '' }}{{ r.rate }}
          </span>
        </div>
      </div>

      <!-- 精力 / 民心条 -->
      <div class="status-row">
        <div class="status-bar" :title="apTip">
          <span class="s-label">精力</span>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: apPct + '%', background: game.apTier.color }"></div>
            <span class="bar-text">{{ Math.round(game.ap.cur) }} / {{ game.ap.max }}</span>
          </div>
        </div>
        <div class="status-bar" :title="moraleTip">
          <span class="s-label" :class="{ warn: moralePct < 70 }">民心</span>
          <div class="bar-track">
            <div class="bar-fill morale" :style="{ width: moralePct + '%' }"></div>
            <span class="bar-text">{{ Math.round(game.policy.morale) }} / 100</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 卷轴底部丝穗 -->
    <div class="scroll-tassels">
      <span class="tassel"></span>
      <span class="tassel"></span>
      <span class="tassel"></span>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import AppIcon from './AppIcon.vue'

const game = useGameStore()
const seasonObj = computed(() => game.currentSeason)
const seasonPct = computed(() => Math.round(game.seasonProgress * 100))
const seasonTip = computed(() => {
  const s = seasonObj.value
  return `${s.label}季 · ${game.currentYear}年第 ${game.currentSeasonDay} 日\n${s.flavor}\n当前加成：${game.seasonBuffText}`
})
const apPct = computed(() => Math.round((game.ap.cur / game.ap.max) * 100))
const moralePct = computed(() => Math.round(game.policy.morale))
const apTip = computed(() => `精力：执行内政/出征消耗，自动恢复（当前 ${Math.round(game.ap.cur)}/${game.ap.max}）`)
const moraleTip = computed(() => {
  const m = Math.round(game.policy.morale)
  let warn = ''
  if (m < 70) warn = '；< 70 易发生灾祸'
  return `民心：影响产出与赋税效率（${m}/100${warn}）`
})

function formatNum(n) {
  const v = Math.floor(n)
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 10_000) return (v / 1000).toFixed(1) + 'K'
  return String(v)
}
</script>

<style scoped>
.scroll-hud {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 96%;
  max-width: 460px;
  z-index: 50;
  pointer-events: none;
  animation: hud-down .7s cubic-bezier(.2,.8,.25,1.05) backwards;
}
@keyframes hud-down {
  from { transform: translate(-50%, -100%); opacity: 0; }
  to   { transform: translate(-50%, 0); opacity: 1; }
}

/* 卷轴顶杆 */
.scroll-rod {
  display: flex;
  align-items: center;
  height: 12px;
  pointer-events: auto;
}
.rod-bar {
  flex: 1;
  height: 9px;
  background:
    linear-gradient(180deg, #3a2410 0%, #6e4a20 40%, #d4a849 50%, #6e4a20 60%, #1a0e07 100%);
  border-top: 1px solid #8a5c1a;
  border-bottom: 1px solid #1a0e07;
  box-shadow: 0 2px 6px rgba(0,0,0,.5);
}
.rod-cap {
  width: 22px;
  height: 14px;
  background:
    radial-gradient(ellipse at 30% 30%, #fff1c2 0%, #d4a849 30%, #6e4a20 100%);
  border: 1px solid #1a0e07;
  border-radius: 50%;
  box-shadow:
    inset 0 1px 0 rgba(255,240,200,.55),
    0 2px 4px rgba(0,0,0,.5);
}

/* 卷轴纸面 */
.scroll-paper {
  position: relative;
  background:
    /* 暗角 */
    radial-gradient(ellipse at center, transparent 40%, rgba(80, 40, 10, .25) 100%),
    /* 颗粒 */
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0 0.15  0 0 0 0.22 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"),
    /* 米黄基 */
    linear-gradient(180deg, #f0dfb0 0%, #e3ce95 60%, #c9a96a 100%);
  background-size: cover, 160px 160px, cover;
  border-left: 1px solid #8a5c1a;
  border-right: 1px solid #8a5c1a;
  padding: 8px 14px 10px;
  pointer-events: auto;
  box-shadow:
    inset 0 6px 10px rgba(80, 40, 10, .25),
    inset 0 -2px 4px rgba(80, 40, 10, .35),
    0 4px 12px rgba(0,0,0,.5);
}

/* 朱印 */
.seal-stamp {
  position: absolute;
  right: 10px;
  top: 6px;
  width: 30px;
  height: 30px;
  background: var(--c-red);
  color: #fff1c2;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #4a0808;
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  box-shadow:
    inset 0 0 0 1px rgba(255,240,200,.4),
    0 0 6px rgba(168, 35, 26, .85),
    0 2px 4px rgba(0,0,0,.4);
  transform: rotate(-8deg);
  opacity: .92;
}
.seal-char { text-shadow: 0 0 2px rgba(255,240,200,.4); }

/* 主公标签 */
.lord-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-title);
  color: #2a1810;
  font-size: 13px;
  letter-spacing: 2px;
  margin-bottom: 6px;
  padding-right: 42px;
}
.lord-name {
  font-weight: 700;
  color: #6e1410;
  text-shadow: 0 1px 0 rgba(255,245,210,.6);
}
.lord-title { font-size: 11px; color: #7a5a3a; }
.season-chip {
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border: 1px solid var(--c-red-dark);
  border-left-width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(40, 24, 14, .78), rgba(20, 10, 4, .9));
  cursor: help;
  font-size: 10px;
  line-height: 1.4;
  letter-spacing: .03em;
}
.sc-label {
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 700;
}
.sc-date {
  color: var(--c-paper-dark);
  opacity: .85;
  font-family: var(--font-num);
}
.sc-progress {
  display: inline-block;
  width: 26px;
  height: 3px;
  background: rgba(0,0,0,.55);
  border-radius: 1px;
  overflow: hidden;
}
.sc-fill { display: block; height: 100%; transition: width .35s; }
.chronicle-pin {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  background: rgba(40, 24, 14, .15);
  border: 1px solid var(--c-line);
  color: #2a1810;
  text-decoration: none;
  font-size: 11px;
  font-family: var(--font-num);
  position: relative;
  transition: all .2s;
}
.chronicle-pin:hover { background: rgba(168, 35, 26, .25); color: var(--c-red-dark); }
.chronicle-pin .cb-dot {
  position: absolute;
  top: -3px; right: -3px;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--c-red);
  box-shadow: 0 0 6px rgba(255, 70, 60, .9);
  animation: cb-blink 1.2s infinite;
}
@keyframes cb-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: .4; transform: scale(.7); }
}

/* 资源行 */
.res-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 6px;
}
.res-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 2px 4px;
  background:
    linear-gradient(180deg, rgba(255, 245, 210, .55), rgba(220, 195, 140, .55));
  border: 1px solid rgba(110, 74, 32, .35);
  border-radius: 2px;
  font-size: 11px;
}
.res-icon { color: #6e1410; }
.res-val {
  font-family: var(--font-num);
  font-weight: 700;
  color: #2a1810;
  font-size: 12px;
  animation: val-pop .3s ease;
}
@keyframes val-pop {
  0% { transform: scale(1.15); color: var(--c-red); }
  100% { transform: scale(1); }
}
.res-rate {
  font-size: 9px;
  color: #4d7a4c;
}
.res-rate.neg { color: #d75a52; }

/* 状态条 */
.status-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.status-bar {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
}
.s-label {
  color: var(--c-red-dark);
  font-family: var(--font-title);
  letter-spacing: 1px;
  flex-shrink: 0;
  font-weight: 700;
  width: 26px;
}
.s-label.warn {
  color: #ff5a4e;
  animation: warn-blink 1.6s infinite;
}
@keyframes warn-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: .55; }
}
.bar-track {
  flex: 1;
  position: relative;
  height: 12px;
  background: rgba(0, 0, 0, .55);
  border: 1px solid rgba(110, 74, 32, .55);
  border-radius: 2px;
  overflow: hidden;
}
.bar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-family: var(--font-num);
  font-weight: 700;
  color: #fff1c2;
  text-shadow: 0 0 3px #000, 0 1px 2px rgba(0,0,0,.9);
  letter-spacing: 0;
  z-index: 2;
}
.bar-fill {
  height: 100%;
  transition: width .35s ease, background .25s;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .25);
}
.bar-fill.morale {
  background: linear-gradient(90deg, #a8231a 0%, #d4af37 100%);
}

/* 底部丝穗 */
.scroll-tassels {
  position: relative;
  height: 18px;
  display: flex;
  justify-content: center;
  gap: 28px;
  pointer-events: none;
}
.tassel {
  width: 2px;
  height: 18px;
  background: linear-gradient(180deg, #a8231a 0%, #6e1410 70%, transparent 100%);
  border-radius: 0 0 2px 2px;
  animation: tassel-sway 3.6s ease-in-out infinite;
  transform-origin: top center;
}
.tassel:nth-child(2) { animation-delay: .3s; }
.tassel:nth-child(3) { animation-delay: .6s; }
@keyframes tassel-sway {
  0%, 100% { transform: rotate(-4deg); }
  50%      { transform: rotate(4deg); }
}
</style>
