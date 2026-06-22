<template>
  <transition name="modal">
    <div v-if="show" class="modal-mask" @click.self="$emit('close')">
      <div class="modal-panel ink-frame">
        <header class="m-head">
          <div class="m-title">
            <span class="m-icon">{{ cfg.icon }}</span>
            <div class="m-name-wrap">
              <div class="m-name">{{ cfg.name }}</div>
              <div class="m-sub">Lv {{ curLv }}<span v-if="building">·驻守 {{ garrisonCount }}/{{ garrisonCap }}</span></div>
            </div>
          </div>
          <button class="m-close" @click="$emit('close')">✕</button>
        </header>

        <!-- 升级 / 建造进度 -->
        <section class="m-sec build-sec">
          <div v-if="buildRemain >= 0" class="build-bar-row">
            <div class="build-info">
              <span class="b-label">营造中 Lv{{ curLv }} → Lv{{ curLv + 1 }}</span>
              <span class="b-time">{{ formatSec(buildRemain) }}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill build" :style="{ width: buildPct + '%' }"></div>
            </div>
            <div class="build-actions">
              <button class="btn small ghost" @click="onCancel">放弃·退50%</button>
              <button class="btn small primary" @click="onRush" :disabled="game.resources.jadeShard < 1">急造·💎1</button>
            </div>
          </div>
          <div v-else class="upgrade-row">
            <div class="upgrade-cost">
              <span class="u-label">升级耗：</span>
              <span v-for="(v, k) in upgradeCost" :key="k" class="u-cost" :class="{ lack: !canAfford(k, v) }">
                {{ iconOf(k) }}{{ v }}
              </span>
              <span class="u-time">⏳{{ formatSec(upgradeTime) }}</span>
            </div>
            <button class="btn primary upgrade-btn" :disabled="!canStart.ok" @click="onUpgrade">
              {{ canStart.ok ? `开始营造 Lv${curLv + 1}` : canStart.reason }}
            </button>
          </div>
        </section>

        <!-- 主动操作 -->
        <section v-if="cfg.actions && cfg.actions.length" class="m-sec actions-sec">
          <div class="sec-title">▸ 主动决策</div>
          <div class="actions-grid">
            <div
              v-for="a in cfg.actions"
              :key="a.key"
              class="action-card"
              :class="{ disabled: !canRunAction(a) }"
              @click="onRunAction(a)"
            >
              <div class="ac-head">
                <span class="ac-icon">{{ a.icon }}</span>
                <span class="ac-name">{{ a.name }}</span>
                <span class="ac-ap">精{{ a.apCost }}</span>
              </div>
              <div class="ac-desc">{{ a.desc }}</div>
              <div class="ac-status">
                <span v-if="actionRemain(a) > 0" class="ac-cd">冷却 {{ formatSec(actionRemain(a)) }}</span>
                <span v-else class="ac-ready">▸ 可执行</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 驻守武将 -->
        <section v-if="garrisonCap > 0" class="m-sec garrison-sec">
          <div class="sec-title">▸ 武将驻守 <span class="cap">{{ garrisonCount }}/{{ garrisonCap }}</span></div>
          <div class="garr-list">
            <div v-for="hid in garrisonHeroes" :key="hid" class="garr-slot occupied">
              <span class="g-avatar">{{ findHero(hid)?.avatar || '？' }}</span>
              <span class="g-name">{{ findHero(hid)?.name }}</span>
              <button class="g-btn" @click="onUnassign(hid)">撤回</button>
            </div>
            <div v-if="garrisonCount < garrisonCap" class="garr-slot empty" @click="pickerOpen = !pickerOpen">
              <span class="plus">＋</span>
              <span class="hint">点此派遣</span>
            </div>
          </div>
          <div v-if="pickerOpen" class="garr-picker">
            <div v-if="freeHeroes.length === 0" class="picker-empty">暂无可派遣武将</div>
            <div
              v-for="h in freeHeroes"
              :key="h.id"
              class="picker-card"
              @click="onAssign(h.id)"
            >
              <span class="p-avatar">{{ h.meta.avatar }}</span>
              <span class="p-name">{{ h.meta.name }}</span>
              <span class="p-lv">Lv{{ h.level }}</span>
            </div>
          </div>
          <div class="garr-tip">每位武将提供 ~30% 产出加成（按品质浮动）</div>
        </section>

        <!-- 历史科普 -->
        <section v-if="cfg.lore" class="m-sec lore-sec">
          <div class="lore-head" @click="loreOpen = !loreOpen">
            <span>🕮 {{ cfg.lore.title }}</span>
            <span class="lore-toggle">{{ loreOpen ? '▾' : '▸' }}</span>
          </div>
          <p v-if="loreOpen" class="lore-text">{{ cfg.lore.text }}</p>
        </section>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'
import { BUILDING_MAP } from '../data/buildings.js'
import { findHero } from '../data/heroes.js'

const props = defineProps({
  show: Boolean,
  building: String
})
const emit = defineEmits(['close'])

const game = useGameStore()
const cfg = computed(() => BUILDING_MAP[props.building] || {})
const curLv = computed(() => game.city[props.building] || 0)

const garrisonHeroes = computed(() => game.garrison[props.building] || [])
const garrisonCount = computed(() => garrisonHeroes.value.length)
const garrisonCap = computed(() => cfg.value.garrisonCap ? cfg.value.garrisonCap(curLv.value) : 0)

const pickerOpen = ref(false)
const loreOpen = ref(false)

const ICON_MAP = { grain: '🌾', coin: '💰', wood: '🪵', soldier: '⚔️' }
function iconOf(k) { return ICON_MAP[k] || '' }
function canAfford(k, v) { return (game.resources[k] || 0) >= v }
function formatSec(s) {
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m}m${r}s` : `${m}m`
}

const upgradeCost = computed(() => cfg.value.cost ? cfg.value.cost(curLv.value) : {})
const upgradeTime = computed(() => cfg.value.upgradeTimeSec ? cfg.value.upgradeTimeSec(curLv.value) : 0)

const canStart = computed(() => {
  if (curLv.value >= (cfg.value.maxLevel || 0)) return { ok: false, reason: '已达极限' }
  const lordLv = game.city.lordHall || 0
  if (props.building !== 'lordHall' && curLv.value + 1 > lordLv) return { ok: false, reason: `需主公府 Lv${curLv.value + 1}` }
  if (lordLv < (cfg.value.requireLord || 0)) return { ok: false, reason: `需主公府 Lv${cfg.value.requireLord}` }
  for (const k in upgradeCost.value) {
    if (!canAfford(k, upgradeCost.value[k])) return { ok: false, reason: `${iconOf(k)}不足` }
  }
  if (game.buildQueue.find((q) => q.key === props.building)) return { ok: false, reason: '已在建造' }
  if (game.buildQueue.length >= game.parallelBuildCap) return { ok: false, reason: `名额满 ${game.buildQueue.length}/${game.parallelBuildCap}` }
  return { ok: true }
})

// 进度
const now = ref(Date.now())
let timer = null
onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const buildRemain = computed(() => {
  void now.value
  return game.buildRemainOf(props.building)
})
const buildPct = computed(() => {
  void now.value
  const item = game.buildQueue.find((q) => q.key === props.building)
  if (!item) return 0
  const total = item.totalSec * 1000
  const elapsed = Date.now() - item.startAt
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
})

function actionRemain(a) {
  void now.value
  return game.actionRemainOf(props.building, a.key)
}
function canRunAction(a) {
  return actionRemain(a) === 0 && game.ap.cur >= (a.apCost || 0)
}

const freeHeroes = computed(() => {
  return game.heroes
    .filter((h) => !game.heroGarrisonOf(h.id) && !h.task)
    .map((h) => ({ ...h, meta: findHero(h.id) }))
})

function onUpgrade() {
  const r = game.startBuild(props.building)
  if (!r.ok) showToast(r.reason || '失败', 'err')
  else showToast('开始营造！', 'ok')
}
function onRush() {
  const r = game.rushBuild(props.building)
  if (!r.ok) showToast(r.reason || '失败', 'err')
  else showToast('一夜成型！', 'ok')
}
function onCancel() {
  const r = game.cancelBuild(props.building)
  if (!r.ok) showToast(r.reason || '失败', 'err')
  else showToast('已停工·退还半数', 'ok')
}
function onRunAction(a) {
  const r = game.runBuildingAction(props.building, a.key)
  if (!r.ok) showToast(r.reason || '失败', 'err')
  else showToast(r.msg || '已执行', 'ok')
}
function onAssign(hid) {
  const r = game.assignGarrison(props.building, hid)
  if (!r.ok) showToast(r.reason || '失败', 'err')
  else { showToast('武将就位', 'ok'); pickerOpen.value = false }
}
function onUnassign(hid) {
  const r = game.unassignGarrison(props.building, hid)
  if (!r.ok) showToast(r.reason || '失败', 'err')
  else showToast('已撤回', 'ok')
}

const toast = ref(null)
let toastTimer = null
function showToast(msg, type = 'ok') {
  toast.value = { msg, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 1400)
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .65);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  padding: 8px;
}
.modal-panel {
  width: 100%;
  max-width: 460px;
  max-height: 88vh;
  overflow-y: auto;
  background:
    linear-gradient(180deg, rgba(255, 245, 210, .98), rgba(220, 195, 140, .98));
  border: 2px solid var(--c-gold-dark);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .55),
    0 -8px 24px rgba(0, 0, 0, .55);
  padding: 10px 12px 14px;
}
.modal-enter-active, .modal-leave-active { transition: opacity .22s ease, transform .25s ease; }
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel { transform: translateY(20px); }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.m-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1.5px solid var(--c-line);
  padding-bottom: 6px;
  margin-bottom: 8px;
}
.m-title { display: flex; align-items: center; gap: 8px; }
.m-icon { font-size: 30px; }
.m-name { font-family: var(--font-title); font-size: 16px; letter-spacing: 3px; color: var(--c-ink); }
.m-sub { font-size: 11px; color: var(--c-muted); letter-spacing: 1px; }
.m-close {
  background: transparent;
  border: 1px solid var(--c-muted);
  width: 26px; height: 26px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  color: var(--c-muted);
}
.m-close:hover { color: var(--c-red); border-color: var(--c-red); }

.m-sec { margin-bottom: 10px; }
.sec-title {
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 3px;
  color: var(--c-red);
  margin-bottom: 6px;
  border-left: 2px solid var(--c-red);
  padding-left: 6px;
}
.sec-title .cap { font-size: 10px; color: var(--c-muted); letter-spacing: 1px; }

/* 升级 */
.upgrade-row { display: flex; align-items: center; gap: 8px; }
.upgrade-cost { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; font-size: 11px; align-items: center; }
.u-label { color: var(--c-muted); }
.u-cost { color: var(--c-ink); }
.u-cost.lack { color: var(--c-red); text-decoration: line-through; }
.u-time { margin-left: 4px; color: var(--c-gold-dark); font-family: var(--font-num); font-size: 11px; }
.upgrade-btn { font-size: 11px; padding: 5px 12px; letter-spacing: 1px; white-space: nowrap; }

.build-bar-row { background: rgba(255, 240, 200, .55); border: 1px dashed var(--c-line); padding: 6px 8px; }
.build-info { display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px; }
.b-label { color: var(--c-ink); letter-spacing: 1px; font-weight: 600; }
.b-time { font-family: var(--font-num); color: var(--c-gold-dark); }
.bar-track { height: 10px; background: rgba(0,0,0,.3); border: 1px solid var(--c-gold-dark); border-radius: 2px; overflow: hidden; position: relative; }
.bar-fill.build {
  height: 100%;
  background: linear-gradient(90deg, #b8862e 0%, #d4af37 50%, #fff5cf 100%);
  background-size: 200% 100%;
  animation: build-flow 2.5s linear infinite;
  transition: width .4s;
}
@keyframes build-flow {
  0%   { background-position: 0% 0; }
  100% { background-position: -200% 0; }
}
.build-actions { display: flex; gap: 6px; margin-top: 6px; }
.btn.small { font-size: 10px; padding: 3px 8px; }
.btn.ghost {
  background: transparent;
  border: 1px solid var(--c-muted);
  color: var(--c-muted);
}
.btn.ghost:hover { border-color: var(--c-red); color: var(--c-red); }

/* 操作 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.action-card {
  border: 1px solid var(--c-line);
  background: rgba(255, 245, 210, .55);
  padding: 6px;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.action-card:not(.disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 0 8px rgba(232, 196, 104, .55);
}
.action-card.disabled { opacity: .55; cursor: not-allowed; }
.ac-head { display: flex; align-items: center; gap: 4px; }
.ac-icon { font-size: 16px; }
.ac-name { font-family: var(--font-title); font-size: 12px; letter-spacing: 2px; color: var(--c-ink); font-weight: 700; }
.ac-ap { margin-left: auto; font-size: 9px; padding: 1px 4px; background: var(--c-red); color: #fff1c2; }
.ac-desc { font-size: 10px; color: var(--c-muted); margin: 2px 0; line-height: 1.35; }
.ac-status { font-size: 10px; font-family: var(--font-num); }
.ac-ready { color: var(--c-green); }
.ac-cd { color: var(--c-red); }

/* 驻守 */
.garr-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
.garr-slot {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border: 1px solid var(--c-line);
  background: rgba(255, 245, 210, .35);
  min-width: 100px;
}
.garr-slot.empty {
  border-style: dashed;
  color: var(--c-muted);
  cursor: pointer;
  justify-content: center;
}
.garr-slot.empty:hover { color: var(--c-red); border-color: var(--c-red); }
.g-avatar { font-size: 16px; }
.g-name { font-size: 11px; color: var(--c-ink); font-family: var(--font-title); letter-spacing: 1px; }
.g-btn {
  margin-left: auto;
  border: 1px solid var(--c-muted);
  background: transparent;
  font-size: 10px;
  padding: 1px 5px;
  cursor: pointer;
  color: var(--c-muted);
}
.g-btn:hover { color: var(--c-red); border-color: var(--c-red); }
.plus { font-size: 18px; line-height: 1; }
.hint { font-size: 10px; }
.garr-picker {
  border: 1px solid var(--c-gold-dark);
  background: rgba(232, 196, 104, .15);
  padding: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
.picker-empty { font-size: 11px; color: var(--c-muted); padding: 4px; }
.picker-card {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  border: 1px solid var(--c-line);
  background: rgba(255, 245, 210, .85);
  cursor: pointer;
  font-size: 11px;
}
.picker-card:hover { background: rgba(255, 215, 100, .55); }
.p-avatar { font-size: 14px; }
.p-name { font-family: var(--font-title); letter-spacing: 1px; }
.p-lv { color: var(--c-gold-dark); font-family: var(--font-num); font-size: 9px; }
.garr-tip { font-size: 10px; color: var(--c-muted); text-align: center; }

/* lore */
.lore-sec {
  border-top: 1px dashed var(--c-line);
  padding-top: 6px;
}
.lore-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--c-gold-dark);
}
.lore-text {
  font-size: 11px;
  color: var(--c-ink);
  letter-spacing: 0.5px;
  line-height: 1.65;
  margin: 6px 0 0;
  padding: 6px 8px;
  background: rgba(255, 240, 200, .6);
  border-left: 2px solid var(--c-gold-dark);
}
</style>
