<template>
  <section class="view city-view">
    <!-- 顶部治理迷你条（治安/科技/文化/商业） -->
    <div class="gov-section">
      <div class="gov-head">
        <AppIcon kind="misc" id="scroll" :size="12" tone="gold" />
        <span class="gh-title">民生治理</span>
        <span class="gh-tip">数值 0-100，影响产出与事件</span>
      </div>
      <div class="gov-strip">
        <div
          v-for="g in game.governanceList"
          :key="g.key"
          class="gov-pill"
          :style="{ borderColor: g.color }"
          :title="govTipOf(g.key)"
        >
          <div class="gp-top">
            <AppIcon class="gp-icon" kind="gov" :id="g.iconId || g.key" :size="13" :color="g.color" />
            <span class="gp-label">{{ g.label }}</span>
            <span class="gp-num" :style="{ color: g.color }">{{ g.value }}<span class="gp-num-max">/100</span></span>
          </div>
          <span class="gp-bar">
            <span class="gp-fill" :style="{ width: g.value + '%', background: g.color }"></span>
          </span>
        </div>
      </div>
    </div>

    <!-- 建造队列摘要条 -->
    <div class="queue-strip" v-if="game.buildQueue.length">
      <span class="qs-label">
        <AppIcon kind="misc" id="build" :size="13" />
        营造
      </span>
      <div v-for="q in game.buildQueue" :key="q.key" class="qs-item" @click="open(q.key)">
        <AppIcon class="qs-icon" kind="building" :id="q.key" :size="14" />
        <span class="qs-bar">
          <span class="qs-fill" :style="{ width: pctOf(q) + '%' }"></span>
        </span>
        <span class="qs-time">{{ remainOf(q) }}s</span>
      </div>
      <span class="qs-cap">{{ game.buildQueue.length }}/{{ game.parallelBuildCap }}</span>
    </div>

    <!-- 3×3 建筑宫格（一屏可见） -->
    <div class="build-grid">
      <div
        v-for="(b, i) in buildings"
        :key="b.key"
        class="b-cell"
        :class="{
          locked: !game.city[b.key],
          building: !!game.buildQueue.find((q) => q.key === b.key),
          flashing: flashKey === b.key
        }"
        :style="{ '--i': i }"
        @click="open(b.key)"
      >
        <img
          v-if="!bImgFailed[b.key]"
          class="b-bg"
          :class="{ loaded: bImgLoaded[b.key] }"
          :src="buildingImage(b.key)"
          :alt="b.name"
          loading="lazy"
          @load="bImgLoaded[b.key] = true"
          @error="bImgFailed[b.key] = true"
        />
        <div class="b-shade"></div>
        <div class="b-name">{{ b.name }}</div>
        <div class="b-lv">Lv {{ game.city[b.key] || 0 }}</div>
        <div v-if="game.buildQueue.find((q) => q.key === b.key)" class="b-progress">
          <div class="bp-fill" :style="{ width: pctOf(game.buildQueue.find((q) => q.key === b.key)) + '%' }"></div>
        </div>
        <div v-if="garrisonCountOf(b.key) > 0" class="b-garr">
          <AppIcon kind="misc" id="flag" :size="10" /> {{ garrisonCountOf(b.key) }}
        </div>
      </div>
    </div>

    <p class="city-foot">▎点击建筑·决策内政·派将驻守▎</p>

    <BuildingDetailModal :show="modalOpen" :building="activeKey" @close="modalOpen = false" />

    <transition name="flash">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </transition>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'
import { BUILDING_MAP } from '../data/buildings.js'
import BUILDINGS from '../data/buildings.js'
import BuildingDetailModal from '../components/BuildingDetailModal.vue'
import AppIcon from '../components/AppIcon.vue'
import { BUILDING_ICONS } from '../assets/icons.js'
import { buildingImage } from '../utils/aiImage.js'

const game = useGameStore()
const buildings = BUILDINGS

const modalOpen = ref(false)
const activeKey = ref('')
const flashKey = ref('')
const toast = ref(null)

/** 建筑底图加载状态 */
const bImgLoaded = reactive({})
const bImgFailed = reactive({})

function open(key) {
  activeKey.value = key
  modalOpen.value = true
}
function iconOfBuilding(key) {
  return BUILDING_MAP[key]?.icon || '🏗'
}
function svgOfBuilding(key) {
  return BUILDING_ICONS[key] || ''
}
function garrisonCountOf(key) {
  return (game.garrison[key] || []).length
}
const GOV_TIPS = {
  security: '治安：越低越易触发匪患/民变事件；建议保持 60 以上',
  tech:     '科技：每 1 点 +0.1% 全资源产出（粮/钱/木/兵）',
  culture:  '文化：每 1 点 +0.05% 全资源产出，同时影响民心恢复',
  commerce: '商业：每 1 点 +0.15% 铜钱产出，是主要的财政支柱'
}
function govTipOf(key) { return GOV_TIPS[key] || key }

const tickNow = ref(Date.now())
let timer = null
onMounted(() => {
  timer = setInterval(() => { tickNow.value = Date.now() }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

function pctOf(q) {
  void tickNow.value
  if (!q) return 0
  const total = q.totalSec * 1000
  const elapsed = Date.now() - q.startAt
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}
function remainOf(q) {
  void tickNow.value
  return Math.max(0, Math.ceil((q.doneAt - Date.now()) / 1000))
}
</script>

<style scoped>
.city-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100%;
}

/* 治理条 */
.gov-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gov-head {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 2px;
}
.gh-title {
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 700;
  color: var(--c-gold);
  letter-spacing: .12em;
}
.gh-tip {
  font-size: 10px;
  color: var(--c-paper-dark);
  opacity: .75;
  margin-left: auto;
}
.gov-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.gov-pill {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 6px 5px;
  background:
    linear-gradient(180deg, rgba(40, 24, 14, .82), rgba(20, 10, 4, .88));
  border: 1px solid rgba(232, 196, 104, .45);
  border-left-width: 3px;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .5), inset 0 0 0 1px rgba(0, 0, 0, .35);
  cursor: help;
}
.gp-top {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}
.gp-icon { font-size: 12px; flex: 0 0 auto; }
.gp-label {
  font-size: 11px;
  color: var(--c-gold-light);
  font-family: var(--font-title);
  letter-spacing: .04em;
  flex: 1;
}
.gp-num {
  font-family: var(--font-num);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}
.gp-num-max {
  font-size: 9px;
  font-weight: 400;
  color: var(--c-paper-dark);
  opacity: .7;
  margin-left: 1px;
}
.gp-bar {
  display: block;
  height: 4px;
  background: rgba(0,0,0,.45);
  border-radius: 1px;
  overflow: hidden;
}
.gp-fill { display: block; height: 100%; transition: width .35s; }

/* 建造队列 */
.queue-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background:
    linear-gradient(180deg, rgba(60, 30, 10, .85), rgba(30, 14, 6, .9));
  border: 1px solid var(--c-gold-dark);
  border-radius: 2px;
  font-size: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .55);
}
.qs-label { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-title); letter-spacing: 2px; color: var(--c-gold-light); flex-shrink: 0; }
.qs-item { display: flex; align-items: center; gap: 3px; flex: 1; cursor: pointer; min-width: 0; }
.qs-icon { font-size: 14px; flex-shrink: 0; color: var(--c-gold); }
.qs-bar { flex: 1; height: 5px; background: rgba(0,0,0,.55); border: 1px solid var(--c-gold-dark); min-width: 30px; overflow: hidden; }
.qs-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #b8862e, #d4af37, #fff5cf);
  background-size: 200% 100%;
  animation: build-flow 2.5s linear infinite;
  transition: width .4s;
}
@keyframes build-flow {
  0% { background-position: 0 0; }
  100% { background-position: -200% 0; }
}
.qs-time { font-family: var(--font-num); color: var(--c-gold-light); flex-shrink: 0; }
.qs-cap { font-family: var(--font-num); color: var(--c-muted); flex-shrink: 0; }

/* 3×3 宫格 */
.build-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  min-height: 0;
  align-content: start;
}
.b-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background:
    linear-gradient(180deg, rgba(255, 245, 210, .94), rgba(220, 195, 140, .94));
  border: 1.5px solid var(--c-line);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .45),
    0 2px 0 #6e4a20;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .25s ease;
  padding: 4px 2px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(10px) scale(.96);
  animation: cell-in .55s cubic-bezier(.2,.8,.25,1.2) forwards;
  animation-delay: calc(var(--i, 0) * 60ms);
}
@keyframes cell-in {
  0% { opacity: 0; transform: translateY(12px) scale(.94); }
  60% { opacity: 1; transform: translateY(-2px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.b-cell:hover { transform: translateY(-2px); box-shadow: 0 0 10px rgba(232, 196, 104, .65), 0 2px 0 #6e4a20; }
.b-cell.locked { filter: grayscale(.55) brightness(.85); }
.b-cell.building {
  border-color: var(--c-gold-dark);
  box-shadow: 0 0 8px rgba(255, 215, 100, .55), inset 0 0 8px rgba(255, 215, 100, .35), 0 2px 0 #6e4a20;
}
.b-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity .6s ease, transform 6s ease;
  z-index: 0;
  pointer-events: none;
  transform: scale(1);
}
.b-bg.loaded { opacity: .88; }
.b-cell:hover .b-bg.loaded { transform: scale(1.06); }
.b-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgba(20, 10, 5, .65) 100%);
  pointer-events: none;
}
.b-cell.flashing { animation: gold-flash .8s ease, cell-in .55s cubic-bezier(.2,.8,.25,1.2) backwards; }
@keyframes gold-flash {
  0% { box-shadow: inset 0 0 0 rgba(255, 215, 100, 0), 0 2px 0 #6e4a20; }
  50% { box-shadow: inset 0 0 20px rgba(255, 215, 100, .9), 0 0 18px rgba(255, 215, 100, .8), 0 2px 0 #6e4a20; }
  100% { box-shadow: inset 0 0 0 rgba(255, 215, 100, 0), 0 2px 0 #6e4a20; }
}
.b-name { position: relative; z-index: 2; font-family: var(--font-title); font-size: 12px; letter-spacing: 2px; color: #fff5cf; margin-top: 2px; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,.85), 0 0 6px rgba(0,0,0,.6); }
.b-lv {
  position: relative;
  z-index: 2;
  font-family: var(--font-num);
  font-size: 10px;
  color: #fff1c2;
  background: rgba(168, 35, 26, .92);
  padding: 0 4px;
  margin-top: 2px;
  border: 1px solid #6a1410;
  box-shadow: 0 1px 2px rgba(0,0,0,.4);
}
.b-progress {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: rgba(0,0,0,.25);
  z-index: 3;
}
.bp-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #b8862e, #fff5cf);
  background-size: 200% 100%;
  animation: build-flow 2.5s linear infinite;
  transition: width .4s;
}
.b-garr {
  position: absolute;
  top: 2px; right: 2px;
  z-index: 3;
  font-size: 9px;
  background: var(--c-red);
  color: #fff1c2;
  padding: 0 4px;
  border: 1px solid var(--c-red-dark);
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.city-foot {
  text-align: center;
  font-family: var(--font-title);
  letter-spacing: 3px;
  color: var(--c-gold-light);
  font-size: 10px;
  margin: 4px 0 0;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85), 0 0 6px rgba(0, 0, 0, .5);
  opacity: .85;
}

.toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  padding: 8px 18px;
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 3px;
  border: 1px solid var(--c-gold-dark);
  background: linear-gradient(180deg, #fff5cf, #d8a04a);
  color: var(--c-ink);
  box-shadow: 0 0 12px rgba(232, 196, 104, .6), 0 4px 10px rgba(0,0,0,.4);
}
.toast.err {
  background: linear-gradient(180deg, #f7c9c5, #b8362c);
  border-color: var(--c-red-dark);
  color: #fff1c2;
}
.flash-enter-active, .flash-leave-active { transition: opacity .25s, transform .25s; }
.flash-enter-from { opacity: 0; transform: translate(-50%, -8px); }
.flash-leave-to { opacity: 0; transform: translate(-50%, -8px); }

/* 移动端：禁用 hover 状态（避免 sticky-hover 残留高亮）+ 简化建造进度条 */
@media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .b-cell:hover { transform: none; box-shadow: 0 2px 4px rgba(0, 0, 0, .5), inset 0 0 0 1px rgba(0, 0, 0, .35); }
  .bar-fill.build, .bar-fill.build-mini {
    animation: none;
    background: linear-gradient(90deg, #b8862e, #d4af37);
  }
}
</style>
