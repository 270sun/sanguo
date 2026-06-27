﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <header class="hud-mini">
    <!-- 左：主公 + 季节小印 -->
    <div class="hud-left">
      <span class="lord-seal" :title="'主公·' + game.meta.lordName">{{ game.meta.lordName[0] }}</span>
      <div class="lord-info">
        <div class="lord-name">{{ game.meta.lordName }}</div>
        <div class="sub-line">
          <span class="year">{{ game.currentYear }}年</span>
          <span class="season-dot" :style="{ background: seasonObj.color }"></span>
          <span class="season-label">{{ seasonObj.label }}</span>
          <span class="day">·{{ game.currentSeasonDay }}日</span>
        </div>
      </div>
    </div>

    <!-- 右：账册抽屉触发 + 史册红印 + 静音 -->
    <div class="hud-right">
      <button
        class="ledger-btn"
        :class="{ open: ledgerOpen, alert: lowRes }"
        @click="toggleLedger"
        title="账册"
      >
        <span class="ledger-icon">册</span>
        <span v-if="lowRes" class="warn-dot"></span>
      </button>
      <router-link to="/chronicle" class="chronicle-pin" :class="{ alert: !!game.pendingEvent }" title="史册">
        <span class="pin-char">史</span>
        <span class="pin-count">{{ game.chronicle.length }}</span>
        <span v-if="game.pendingEvent" class="cb-dot"></span>
      </router-link>
      <button class="mute-btn" @click="game.toggleMute" :title="game.muted ? '已静音' : '声音开'">
        {{ game.muted ? '🔇' : '🔔' }}
      </button>
    </div>

    <!-- 账册抽屉：资源 + 精力 + 民心 -->
    <transition name="ledger">
      <div v-if="ledgerOpen" class="ledger-drawer" @click.self="ledgerOpen = false">
        <div class="ledger-panel" @wheel.stop>
          <div class="ledger-title">▸ 府库账册</div>
          <div class="res-grid">
            <div
              v-for="r in game.resourceList"
              :key="r.key"
              v-memo="[r.value, r.rate]"
              class="res-cell"
            >
              <AppIcon class="res-icon" :kind="r.iconKind || 'res'" :id="r.iconId || r.key" :size="20" />
              <div class="res-meta">
                <div class="res-val">{{ formatNum(r.value) }}</div>
                <div class="res-rate" :class="{ neg: r.rate < 0, pos: r.rate > 0 }">
                  {{ r.rate ? (r.rate >= 0 ? '+' : '') + r.rate + '/日' : '—' }}
                </div>
              </div>
            </div>
          </div>
          <div class="ledger-title sec">▸ 君主气象</div>
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
                <span class="bar-text">{{ moralePct }} / 100</span>
              </div>
            </div>
          </div>
          <div class="season-tip">{{ seasonTip }}</div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { computed, ref, onUnmounted, watch } from 'vue'
import { useGameStore } from '../stores/game'
import AppIcon from './AppIcon.vue'

const game = useGameStore()
const ledgerOpen = ref(false)
const seasonObj = computed(() => game.currentSeason)
const seasonTip = computed(() => `${seasonObj.value.flavor}（${game.seasonBuffText}）`)
const apPct = computed(() => Math.round((game.ap.cur / game.ap.max) * 100))
const moralePct = computed(() => Math.round(game.policy.morale))
const apTip = computed(() => `精力：执行内政/出征消耗，自动恢复`)
const moraleTip = computed(() => `民心：影响产出与赋税效率${moralePct.value < 70 ? '（< 70 易发生灾祸）' : ''}`)

const lowRes = computed(() =>
  game.resourceList.some((r) => r.value < 50 && r.rate < 0)
)

function toggleLedger() { ledgerOpen.value = !ledgerOpen.value }

let autoCloseTimer = null
function scheduleClose() {
  if (autoCloseTimer) clearTimeout(autoCloseTimer)
  autoCloseTimer = setTimeout(() => { ledgerOpen.value = false }, 4000)
}
watch(ledgerOpen, (v) => { if (v) scheduleClose(); else if (autoCloseTimer) clearTimeout(autoCloseTimer) })
onUnmounted(() => { if (autoCloseTimer) clearTimeout(autoCloseTimer) })

function formatNum(n) {
  const v = Math.floor(n)
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 10_000) return (v / 1000).toFixed(1) + 'K'
  return String(v)
}
</script>

<style scoped>
.hud-mini {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background:
    linear-gradient(180deg, rgba(20, 10, 4, .85) 0%, rgba(20, 10, 4, .55) 70%, transparent 100%);
  border-bottom: 1px solid rgba(232, 196, 104, .25);
  pointer-events: none;
}
.hud-left, .hud-right { display: flex; align-items: center; gap: 8px; pointer-events: auto; }

/* 主公印 */
.lord-seal {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #c52a2a, #7a1414);
  color: #fff1c2;
  font-family: var(--font-title);
  font-size: 18px;
  border: 1.5px solid #f0d590;
  box-shadow: 0 0 6px rgba(212, 175, 55, .55);
  border-radius: var(--r-md);
  letter-spacing: 0;
}
.lord-info { display: flex; flex-direction: column; line-height: 1.15; }
.lord-name {
  font-family: var(--font-title);
  font-size: 15px;
  color: #fff1c2;
  letter-spacing: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .8);
}
.sub-line {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px;
  color: #d4c082;
  letter-spacing: 1px;
}
.year { color: #e8c468; font-family: var(--font-num); }
.season-dot { width: 6px; height: 6px; border-radius: 50%; }
.season-label { font-family: var(--font-title); }
.day { color: #b0a070; font-family: var(--font-num); }

/* 右侧三件套 */
.ledger-btn, .chronicle-pin, .mute-btn {
  position: relative;
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 240, 200, .12);
  border: 1px solid rgba(232, 196, 104, .55);
  color: #fff1c2;
  border-radius: var(--r-sm);
  cursor: pointer;
  font-family: var(--font-title);
  font-size: 15px;
  text-decoration: none;
  letter-spacing: 0;
  transition: background .15s, color .15s;
}
.ledger-btn.open {
  background: rgba(232, 196, 104, .35);
  color: #1a0e07;
}
.chronicle-pin { gap: 2px; }
.pin-char { font-size: 13px; }
.pin-count { font-size: 13px; font-family: var(--font-num); color: var(--c-gold); }
.chronicle-pin.alert .pin-char { color: #ff9c4a; }
.cb-dot, .warn-dot {
  position: absolute;
  top: 2px; right: 2px;
  width: 8px; height: 8px;
  background: var(--c-red);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 70, 60, .9);
}
.mute-btn { font-size: 15px; background: transparent; }

/* 账册抽屉 */
.ledger-drawer {
  position: absolute;
  top: 56px;
  left: 0; right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, .35);
  z-index: 90;
  display: flex;
  justify-content: flex-end;
  padding: 0 12px;
  pointer-events: auto;
}
.ledger-panel {
  margin-top: 6px;
  width: 100%;
  max-width: 320px;
  background: linear-gradient(180deg, rgba(255, 245, 210, .98), rgba(220, 195, 140, .98));
  border: 1.5px solid var(--c-gold-dark);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .65);
  padding: 10px 12px;
  max-height: 100%;
  overflow-y: auto;
  border-radius: 0 0 4px 4px;
}
.ledger-title {
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--c-red);
  letter-spacing: 3px;
  border-left: 2px solid var(--c-red);
  padding-left: 6px;
  margin-bottom: 6px;
}
.ledger-title.sec { margin-top: 8px; }
.res-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 8px; margin-bottom: 4px; }
.res-cell {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 6px;
  background: rgba(255, 240, 200, .55);
  border: 1px solid var(--c-line);
}
.res-meta { display: flex; flex-direction: column; line-height: 1.15; }
.res-val { font-family: var(--font-num); font-size: 14px; color: var(--c-ink); font-weight: 700; }
.res-rate { font-size: 12px; color: var(--c-muted); font-family: var(--font-num); }
.res-rate.pos { color: var(--c-green); }
.res-rate.neg { color: var(--c-red); }
.status-row { display: flex; flex-direction: column; gap: 4px; }
.status-bar { display: flex; align-items: center; gap: 6px; }
.s-label { font-size: 13px; color: var(--c-muted); letter-spacing: 1px; font-family: var(--font-title); min-width: 28px; }
.s-label.warn { color: var(--c-red); }
.bar-track {
  flex: 1; height: 12px;
  background: rgba(20, 10, 4, .35);
  border: 1px solid var(--c-line);
  position: relative;
  border-radius: var(--r-sm);
  overflow: hidden;
}
.bar-fill { height: 100%; transition: width .4s; background: var(--c-gold); }
.bar-fill.morale { background: linear-gradient(90deg, #b8362c, #d4a849); }
.bar-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  font-family: var(--font-num);
  color: #fff1c2;
  text-shadow: 0 0 2px #000;
  letter-spacing: 0;
}
.season-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--c-muted);
  font-style: italic;
  letter-spacing: 0.5px;
  line-height: 1.5;
}

/* 抽屉动画 */
.ledger-enter-active, .ledger-leave-active { transition: opacity .2s; }
.ledger-enter-from, .ledger-leave-to { opacity: 0; }
.ledger-enter-active .ledger-panel, .ledger-leave-active .ledger-panel { transition: transform .25s cubic-bezier(.2,.8,.25,1.05); }
.ledger-enter-from .ledger-panel { transform: translateY(-12px); }
.ledger-leave-to .ledger-panel { transform: translateY(-12px); }

@media (max-width: 768px), (pointer: coarse) {
  .lord-seal { box-shadow: none; }
}
</style>
