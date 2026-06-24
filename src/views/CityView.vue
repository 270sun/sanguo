<template>
  <section class="view city-view">
    <!-- 顶部治理迷你条（治安/科技/文化/商业）：沿用原设计 -->
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

    <!-- 城池俯瞰图 + SVG 热区 -->
    <div class="map-stage" ref="stageEl">
      <svg
        class="city-map"
        viewBox="0 0 800 520"
        preserveAspectRatio="xMidYMid meet"
        @mousemove="onSvgMove"
      >
        <!-- 古地图羊皮纸底 -->
        <defs>
          <radialGradient id="parchment" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#f3e1ad" />
            <stop offset="65%" stop-color="#cfa86a" />
            <stop offset="100%" stop-color="#7a4f22" />
          </radialGradient>
          <pattern id="wave" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 7 Q3.5 3 7 7 T14 7" stroke="rgba(80,40,15,.25)" fill="none" stroke-width=".7" />
          </pattern>
          <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
            <feDisplacementMap in="SourceGraphic" scale="1.8" />
          </filter>
        </defs>

        <!-- 底色 + 水纹 -->
        <rect x="0" y="0" width="800" height="520" fill="url(#parchment)" />
        <rect x="0" y="0" width="800" height="520" fill="url(#wave)" opacity=".5" />

        <!-- 城墙轮廓（八边形） -->
        <polygon
          class="city-wall"
          points="120,80 680,80 760,180 760,400 680,460 120,460 40,400 40,180"
          fill="rgba(120,75,30,.18)"
          stroke="#5b3416"
          stroke-width="3.5"
          stroke-linejoin="round"
        />
        <!-- 城门四面 -->
        <g class="city-gate" stroke="#3d220f" stroke-width="2.5">
          <line x1="400" y1="78" x2="400" y2="120" />
          <line x1="400" y1="420" x2="400" y2="462" />
          <line x1="38" y1="270" x2="80" y2="270" />
          <line x1="720" y1="270" x2="762" y2="270" />
        </g>

        <!-- 道路网 -->
        <g class="road" stroke="#7c542a" stroke-width="6" fill="none" opacity=".55" stroke-linecap="round">
          <line x1="400" y1="100" x2="400" y2="440" />
          <line x1="60" y1="270" x2="740" y2="270" />
        </g>

        <!-- 9 个建筑热区 -->
        <g
          v-for="b in buildingHotspots"
          :key="b.key"
          class="hotspot"
          :class="{
            locked: !game.city[b.key],
            building: !!game.buildQueue.find((q) => q.key === b.key),
            flashing: flashKey === b.key,
            hover: hoverKey === b.key
          }"
          :transform="`translate(${b.x}, ${b.y})`"
          @click="open(b.key)"
          @mouseenter="hoverKey = b.key"
          @mouseleave="hoverKey = null"
        >
          <!-- 屋影：根据 type 切换形状 -->
          <g v-if="b.type === 'palace'">
            <!-- 主公府：双层飞檐宫殿 -->
            <polygon points="-44,18 -36,4 36,4 44,18" fill="#a13a2a" stroke="#3d150d" stroke-width="2" />
            <rect x="-32" y="18" width="64" height="22" fill="#caa468" stroke="#3d220f" stroke-width="1.5" />
            <polygon points="-32,-6 -22,-22 22,-22 32,-6" fill="#a13a2a" stroke="#3d150d" stroke-width="1.5" />
            <rect x="-22" y="-6" width="44" height="14" fill="#caa468" stroke="#3d220f" stroke-width="1" />
            <line x1="0" y1="-22" x2="0" y2="-38" stroke="#3d220f" stroke-width="1.8" />
            <polygon points="-7,-38 0,-44 7,-38 0,-32" fill="#d9a83a" stroke="#3d150d" stroke-width=".8" />
          </g>
          <g v-else-if="b.type === 'farm'">
            <!-- 农田：田字 + 麦穗 -->
            <rect x="-30" y="-18" width="60" height="36" fill="#9bc25e" stroke="#3d5510" stroke-width="2" />
            <line x1="0" y1="-18" x2="0" y2="18" stroke="#3d5510" stroke-width="1.5" />
            <line x1="-30" y1="0" x2="30" y2="0" stroke="#3d5510" stroke-width="1.5" />
            <g stroke="#d4a437" stroke-width="1" fill="none">
              <line x1="-22" y1="-10" x2="-22" y2="-4" /><line x1="-10" y1="-10" x2="-10" y2="-4" />
              <line x1="10" y1="6" x2="10" y2="12" /><line x1="22" y1="6" x2="22" y2="12" />
            </g>
          </g>
          <g v-else-if="b.type === 'market'">
            <!-- 市集：摊位 + 帐顶 -->
            <polygon points="-32,-4 0,-22 32,-4" fill="#c7382e" stroke="#3d150d" stroke-width="1.5" />
            <rect x="-28" y="-4" width="56" height="22" fill="#e8c468" stroke="#3d220f" stroke-width="1.5" />
            <line x1="-14" y1="-4" x2="-14" y2="18" stroke="#3d220f" stroke-width="1" />
            <line x1="14" y1="-4" x2="14" y2="18" stroke="#3d220f" stroke-width="1" />
            <text x="0" y="12" text-anchor="middle" fill="#3d150d" font-size="11" font-weight="700">市</text>
          </g>
          <g v-else-if="b.type === 'lumber'">
            <!-- 伐木：原木堆 -->
            <ellipse cx="-12" cy="0" rx="14" ry="7" fill="#8a5a2a" stroke="#3d220f" stroke-width="1.5" />
            <ellipse cx="12" cy="0" rx="14" ry="7" fill="#8a5a2a" stroke="#3d220f" stroke-width="1.5" />
            <ellipse cx="0" cy="-12" rx="14" ry="7" fill="#a17040" stroke="#3d220f" stroke-width="1.5" />
            <circle cx="-12" cy="0" r="3" fill="#5b3416" />
            <circle cx="12" cy="0" r="3" fill="#5b3416" />
            <circle cx="0" cy="-12" r="3" fill="#5b3416" />
          </g>
          <g v-else-if="b.type === 'barrack'">
            <!-- 兵营：营帐 + 旗 -->
            <polygon points="-26,18 0,-18 26,18" fill="#5a6b3e" stroke="#3d220f" stroke-width="2" />
            <line x1="0" y1="-18" x2="0" y2="-34" stroke="#3d220f" stroke-width="1.8" />
            <polygon points="0,-34 14,-30 0,-26" fill="#c7382e" stroke="#3d150d" stroke-width="1" />
          </g>
          <g v-else-if="b.type === 'academy'">
            <!-- 武馆：演武台 + 兵器架 -->
            <rect x="-28" y="-4" width="56" height="22" fill="#caa468" stroke="#3d220f" stroke-width="1.5" />
            <line x1="-20" y1="-4" x2="-20" y2="-22" stroke="#3d220f" stroke-width="2" />
            <line x1="20" y1="-4" x2="20" y2="-22" stroke="#3d220f" stroke-width="2" />
            <polygon points="-24,-22 -16,-22 -20,-30" fill="#5b3416" />
            <polygon points="16,-22 24,-22 20,-30" fill="#5b3416" />
            <line x1="-20" y1="-22" x2="20" y2="-22" stroke="#3d220f" stroke-width="1" />
          </g>
          <g v-else-if="b.type === 'inn'">
            <!-- 驿站：灯笼挂屋 -->
            <polygon points="-28,-2 -22,-16 22,-16 28,-2" fill="#a13a2a" stroke="#3d150d" stroke-width="1.5" />
            <rect x="-22" y="-2" width="44" height="20" fill="#caa468" stroke="#3d220f" stroke-width="1.5" />
            <ellipse cx="0" cy="22" rx="6" ry="8" fill="#e84a3a" stroke="#3d150d" stroke-width="1" />
            <line x1="0" y1="14" x2="0" y2="30" stroke="#3d220f" stroke-width=".5" />
          </g>
          <g v-else-if="b.type === 'strategist'">
            <!-- 军师府：卷轴 + 围栏 -->
            <rect x="-28" y="-12" width="56" height="28" fill="#caa468" stroke="#3d220f" stroke-width="1.5" />
            <polygon points="-32,-12 0,-26 32,-12" fill="#5a4a6b" stroke="#3d220f" stroke-width="1.5" />
            <rect x="-18" y="-4" width="36" height="10" fill="#f3e1ad" stroke="#3d220f" stroke-width=".8" />
            <line x1="-14" y1="0" x2="14" y2="0" stroke="#3d150d" stroke-width=".5" />
          </g>
          <g v-else-if="b.type === 'workshop'">
            <!-- 工坊：铁砧 + 烟囱 -->
            <rect x="-28" y="-4" width="56" height="22" fill="#6b5a3e" stroke="#3d220f" stroke-width="1.5" />
            <rect x="14" y="-22" width="8" height="20" fill="#3d220f" />
            <ellipse cx="18" cy="-26" rx="10" ry="5" fill="rgba(160,140,100,.5)" />
            <path d="M-14 8 L-6 8 L-10 0 Z" fill="#3d220f" />
          </g>

          <!-- 名牌 -->
          <g class="nameplate" :transform="`translate(0, ${b.type === 'palace' ? 56 : 38})`">
            <rect x="-32" y="-9" width="64" height="18" rx="2" fill="rgba(20,10,4,.82)" stroke="#e8c468" stroke-width=".8" />
            <text x="0" y="4" text-anchor="middle" fill="#f0d590" font-size="11" font-family="serif">
              {{ b.name }}<tspan dx="3" fill="#fff5cf">{{ game.city[b.key] || 0 }}</tspan>
            </text>
          </g>

          <!-- 建造中进度环 -->
          <g v-if="game.buildQueue.find((q) => q.key === b.key)" class="build-ring" transform="translate(0,0)">
            <circle r="32" fill="none" stroke="rgba(255,215,100,.25)" stroke-width="3" />
            <circle
              r="32"
              fill="none"
              stroke="#fff5cf"
              stroke-width="3"
              :stroke-dasharray="201"
              :stroke-dashoffset="201 - 201 * pctOf(game.buildQueue.find((q) => q.key === b.key)) / 100"
              transform="rotate(-90)"
            />
          </g>

          <!-- 驻守徽记 -->
          <g v-if="garrisonCountOf(b.key) > 0" class="garr-badge" :transform="`translate(28, -${b.type === 'palace' ? 38 : 24})`">
            <circle r="10" fill="#a8231a" stroke="#3d150d" stroke-width="1.5" />
            <text x="0" y="4" text-anchor="middle" fill="#fff1c2" font-size="11" font-weight="700">{{ garrisonCountOf(b.key) }}</text>
          </g>
        </g>

        <!-- 河流装饰 -->
        <path d="M40 360 Q 200 340 380 380 T 760 340" stroke="#4a8cbe" stroke-width="6" fill="none" opacity=".55" />
        <text x="120" y="100" fill="#5b3416" font-size="12" font-family="serif" opacity=".6">北门</text>
        <text x="660" y="100" fill="#5b3416" font-size="12" font-family="serif" opacity=".6">东门</text>
        <text x="380" y="455" fill="#5b3416" font-size="12" font-family="serif" opacity=".6">南门</text>
      </svg>

      <!-- hover 气泡（绝对定位、跟随热区） -->
      <transition name="tip-fade">
        <div v-if="hoverInfo" class="hover-tip" :style="hoverTipStyle">
          <div class="ht-title">{{ hoverInfo.name }} · Lv {{ game.city[hoverInfo.key] || 0 }}</div>
          <div class="ht-desc">{{ hoverInfo.desc }}</div>
          <div v-if="hoverInfo.locked" class="ht-locked">▎尚未建造，点击新建</div>
          <div v-else class="ht-meta">▎点击查看详情/升级/施令</div>
        </div>
      </transition>
    </div>

    <p class="city-foot">▎拖动城图·点击建筑·决策内政▎</p>

    <BuildingDetailModal :show="modalOpen" :building="activeKey" @close="modalOpen = false" />

    <transition name="flash">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'
import { BUILDING_MAP } from '../data/buildings.js'
import BuildingDetailModal from '../components/BuildingDetailModal.vue'
import AppIcon from '../components/AppIcon.vue'

const game = useGameStore()

const modalOpen = ref(false)
const activeKey = ref('')
const flashKey = ref('')
const toast = ref(null)
const hoverKey = ref(null)
const stageEl = ref(null)
const mouseX = ref(0)
const mouseY = ref(0)

/** 9 个建筑在 800x520 viewBox 中的位置 + 视觉类型 */
const HOTSPOTS_LAYOUT = [
  { key: 'lordHall',   x: 400, y: 250, type: 'palace' },
  { key: 'farm',       x: 180, y: 170, type: 'farm' },
  { key: 'market',     x: 620, y: 170, type: 'market' },
  { key: 'barrack',    x: 180, y: 360, type: 'barrack' },
  { key: 'inn',        x: 620, y: 360, type: 'inn' },
  { key: 'lumber',     x: 110, y: 250, type: 'lumber' },
  { key: 'workshop',   x: 690, y: 250, type: 'workshop' },
  { key: 'academy',    x: 320, y: 130, type: 'academy' },
  { key: 'strategist', x: 480, y: 380, type: 'strategist' }
]
const buildingHotspots = computed(() =>
  HOTSPOTS_LAYOUT.map((p) => ({ ...p, ...(BUILDING_MAP[p.key] || {}) }))
)

const hoverInfo = computed(() => {
  if (!hoverKey.value) return null
  const cfg = BUILDING_MAP[hoverKey.value]
  if (!cfg) return null
  return {
    key: hoverKey.value,
    name: cfg.name,
    desc: cfg.desc,
    locked: !game.city[hoverKey.value]
  }
})

const hoverTipStyle = computed(() => ({
  left: mouseX.value + 'px',
  top: (mouseY.value - 8) + 'px'
}))

function onSvgMove(e) {
  if (!stageEl.value) return
  const rect = stageEl.value.getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
}

function open(key) {
  activeKey.value = key
  modalOpen.value = true
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

/* ============== 治理条 ============== */
.gov-section { display: flex; flex-direction: column; gap: 4px; }
.gov-head { display: flex; align-items: center; gap: 5px; padding: 0 2px; }
.gh-title { font-family: var(--font-title); font-size: 12px; font-weight: 700; color: var(--c-gold); letter-spacing: .12em; }
.gh-tip { font-size: 10px; color: var(--c-paper-dark); opacity: .75; margin-left: auto; }
.gov-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.gov-pill {
  display: flex; flex-direction: column; gap: 3px; padding: 4px 6px 5px;
  background: linear-gradient(180deg, rgba(40,24,14,.82), rgba(20,10,4,.88));
  border: 1px solid rgba(232,196,104,.45); border-left-width: 3px; border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,0,0,.35); cursor: help;
}
.gp-top { display: flex; align-items: center; gap: 4px; line-height: 1; }
.gp-icon { font-size: 12px; flex: 0 0 auto; }
.gp-label { font-size: 11px; color: var(--c-gold-light); font-family: var(--font-title); letter-spacing: .04em; flex: 1; }
.gp-num { font-family: var(--font-num); font-size: 12px; font-weight: 700; text-align: right; }
.gp-num-max { font-size: 9px; font-weight: 400; color: var(--c-paper-dark); opacity: .7; margin-left: 1px; }
.gp-bar { display: block; height: 4px; background: rgba(0,0,0,.45); border-radius: 1px; overflow: hidden; }
.gp-fill { display: block; height: 100%; transition: width .35s; }

/* ============== 队列条 ============== */
.queue-strip {
  display: flex; align-items: center; gap: 6px; padding: 4px 8px;
  background: linear-gradient(180deg, rgba(60,30,10,.85), rgba(30,14,6,.9));
  border: 1px solid var(--c-gold-dark); border-radius: 2px; font-size: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,.55);
}
.qs-label { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-title); letter-spacing: 2px; color: var(--c-gold-light); flex-shrink: 0; }
.qs-item { display: flex; align-items: center; gap: 3px; flex: 1; cursor: pointer; min-width: 0; }
.qs-icon { font-size: 14px; flex-shrink: 0; color: var(--c-gold); }
.qs-bar { flex: 1; height: 5px; background: rgba(0,0,0,.55); border: 1px solid var(--c-gold-dark); min-width: 30px; overflow: hidden; }
.qs-fill { display: block; height: 100%; background: linear-gradient(90deg, #b8862e, #d4af37, #fff5cf); background-size: 200% 100%; animation: build-flow 2.5s linear infinite; transition: width .4s; }
@keyframes build-flow { 0% { background-position: 0 0; } 100% { background-position: -200% 0; } }
.qs-time { font-family: var(--font-num); color: var(--c-gold-light); flex-shrink: 0; }
.qs-cap { font-family: var(--font-num); color: var(--c-muted); flex-shrink: 0; }

/* ============== 城池地图 ============== */
.map-stage {
  position: relative;
  flex: 1;
  min-height: 360px;
  background:
    radial-gradient(ellipse at center, rgba(20,10,4,.35), rgba(20,10,4,.55) 90%);
  border: 1px solid var(--c-gold-dark);
  border-radius: 4px;
  box-shadow: 0 4px 14px rgba(0,0,0,.55), inset 0 0 16px rgba(0,0,0,.45);
  overflow: hidden;
}
.city-map {
  display: block;
  width: 100%;
  height: 100%;
  cursor: default;
}

/* 城墙/道路/水纹基础样式（无效互动） */
.city-wall { pointer-events: none; }
.city-gate, .road { pointer-events: none; }

/* 热区 */
.hotspot { cursor: pointer; transition: transform .25s cubic-bezier(.2,.8,.25,1.1); }
.hotspot:hover { transform-origin: center; }
.hotspot:hover g { filter: drop-shadow(0 0 6px rgba(255,215,100,.85)); }
.hotspot.locked g { opacity: .42; filter: grayscale(.7); }
.hotspot.building g { filter: drop-shadow(0 0 8px rgba(255,215,100,.85)); }
.hotspot.flashing g { animation: hot-flash 1s ease 2; }
@keyframes hot-flash {
  0%, 100% { filter: none; }
  50% { filter: drop-shadow(0 0 12px rgba(255,215,100,1)) brightness(1.4); }
}
.nameplate text { letter-spacing: 2px; }

/* hover 气泡 */
.hover-tip {
  position: absolute;
  pointer-events: none;
  z-index: 20;
  transform: translate(-50%, -100%);
  min-width: 150px;
  max-width: 240px;
  padding: 6px 10px;
  background: linear-gradient(180deg, rgba(40,22,10,.96), rgba(20,10,4,.96));
  border: 1px solid var(--c-gold);
  border-radius: 3px;
  box-shadow: 0 6px 14px rgba(0,0,0,.65), 0 0 12px rgba(232,196,104,.4);
  font-size: 11px;
  color: var(--c-paper);
}
.ht-title {
  font-family: var(--font-title);
  font-size: 12px;
  color: #fff5cf;
  letter-spacing: 2px;
  margin-bottom: 3px;
}
.ht-desc { color: var(--c-paper); opacity: .85; line-height: 1.45; }
.ht-locked { color: #f0a060; margin-top: 4px; font-size: 10px; letter-spacing: 1px; }
.ht-meta { color: var(--c-gold-light); margin-top: 4px; font-size: 10px; letter-spacing: 1px; }
.tip-fade-enter-active, .tip-fade-leave-active { transition: opacity .15s, transform .15s; }
.tip-fade-enter-from { opacity: 0; transform: translate(-50%, -94%); }
.tip-fade-leave-to { opacity: 0; transform: translate(-50%, -94%); }

.city-foot {
  text-align: center;
  font-family: var(--font-title);
  letter-spacing: 3px;
  color: var(--c-gold-light);
  font-size: 10px;
  margin: 4px 0 0;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,.85), 0 0 6px rgba(0,0,0,.5);
  opacity: .85;
}

.toast {
  position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
  z-index: 300; padding: 8px 18px;
  font-family: var(--font-title); font-size: 14px; letter-spacing: 3px;
  border: 1px solid var(--c-gold-dark);
  background: linear-gradient(180deg, #fff5cf, #d8a04a);
  color: var(--c-ink);
  box-shadow: 0 0 12px rgba(232,196,104,.6), 0 4px 10px rgba(0,0,0,.4);
}
.toast.err { background: linear-gradient(180deg, #f7c9c5, #b8362c); border-color: var(--c-red-dark); color: #fff1c2; }
.flash-enter-active, .flash-leave-active { transition: opacity .25s, transform .25s; }
.flash-enter-from { opacity: 0; transform: translate(-50%, -8px); }
.flash-leave-to { opacity: 0; transform: translate(-50%, -8px); }

@media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .hotspot:hover g { filter: none; }
  .map-stage { min-height: 300px; }
}
</style>
