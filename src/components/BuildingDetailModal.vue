<template>
  <transition name="modal">
    <div v-if="show" class="modal-mask" @click.self="$emit('close')">
      <div class="modal-panel ink-frame" @wheel.stop>
        <header class="m-head">
          <div class="m-title">
            <span class="m-icon-seal"><span class="m-icon-emoji">{{ cfg.icon }}</span></span>
            <div class="m-name-wrap">
              <div class="m-name">{{ cfg.name }}</div>
              <div class="m-sub">
                <span class="m-sub-pill m-sub-lv"><span class="m-sub-k">Lv</span><span class="m-sub-v">{{ curLv }}</span></span>
                <span v-if="building && garrisonCap > 0" class="m-sub-pill m-sub-gar">
                  <AppIcon kind="misc" id="star" :size="11" tone="gold" />
                  <span class="m-sub-k">驻守</span><span class="m-sub-v">{{ garrisonCount }}/{{ garrisonCap }}</span>
                </span>
              </div>
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
              <button class="btn small primary rush-btn" @click="onRush" :disabled="game.resources.jadeShard < 1">
                <span>急造·</span><AppIcon kind="res" id="jadeShard" :size="11" tone="gold" /><span>1</span>
              </button>
            </div>
          </div>
          <div v-else class="upgrade-row">
            <div class="upgrade-cost">
              <span class="u-label">升级耗</span>
              <span v-for="(v, k) in upgradeCost" :key="k" class="u-cost" :class="{ lack: !canAfford(k, v) }">
                <AppIcon kind="res" :id="k" :size="12" tone="gold" /><span class="u-cost-v">{{ v }}</span>
              </span>
              <span class="u-time">
                <AppIcon kind="misc" id="hourglass" :size="11" tone="gold" />
                <span>{{ formatSec(upgradeTime) }}</span>
              </span>
            </div>
            <button class="btn primary upgrade-btn" :disabled="!canStart.ok" @click="onUpgrade">
              {{ canStart.ok ? `开始营造 Lv${curLv + 1}` : canStart.reason }}
            </button>
          </div>
        </section>

        <!-- 主动操作 -->
        <section v-if="cfg.actions && cfg.actions.length" class="m-sec actions-sec">
          <div class="sec-title"><span class="sec-title-text">主 动 决 策</span></div>
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
                <span class="ac-ap">
                  <AppIcon kind="res" id="ap" :size="10" />
                  <span class="ac-ap-v">{{ a.apCost }}</span>
                </span>
              </div>
              <div class="ac-desc">{{ a.desc }}</div>
              <div class="ac-status">
                <span v-if="actionRemain(a) > 0" class="ac-cd">冷却 {{ formatSec(actionRemain(a)) }}</span>
                <span v-else class="ac-ready">可 执 行</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 驻守武将 -->
        <section v-if="garrisonCap > 0" class="m-sec garrison-sec">
          <div class="sec-title">
            <span class="sec-title-text">武 将 驻 守</span>
            <span class="cap">{{ garrisonCount }}/{{ garrisonCap }}</span>
          </div>
          <div class="garr-list">
            <div v-for="hid in garrisonHeroes" :key="hid" class="garr-slot occupied">
              <span class="g-avatar">
                <img
                  v-if="hasLocalAsset('hero', hid)"
                  class="g-art"
                  :src="heroImage(hid)"
                  :alt="findHero(hid)?.name || ''"
                />
                <span v-else class="g-emoji">{{ findHero(hid)?.avatar || '？' }}</span>
              </span>
              <span class="g-name">{{ findHero(hid)?.name }}</span>
              <button class="g-btn" @click="onUnassign(hid)">撤回</button>
            </div>
            <div v-if="garrisonCount < garrisonCap" class="garr-slot empty" @click="pickerOpen = !pickerOpen">
              <span class="plus">＋</span>
              <span class="hint">点 此 派 遣</span>
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
              <span class="p-avatar">
                <img
                  v-if="hasLocalAsset('hero', h.id)"
                  class="p-art"
                  :src="heroImage(h.id)"
                  :alt="h.meta?.name || ''"
                />
                <span v-else class="p-emoji">{{ h.meta?.avatar }}</span>
              </span>
              <span class="p-name">{{ h.meta?.name }}</span>
              <span class="p-lv">Lv{{ h.level }}</span>
            </div>
          </div>
          <div class="garr-tip">每位武将提供 ~30% 产出加成（按品质浮动）</div>
        </section>

        <!-- 历史科普 -->
        <section v-if="cfg.lore" class="m-sec lore-sec">
          <div class="lore-head" @click="loreOpen = !loreOpen">
            <span class="lore-title">
              <AppIcon kind="misc" id="scroll" :size="12" tone="gold" />
              <span>{{ cfg.lore.title }}</span>
            </span>
            <span class="lore-toggle">{{ loreOpen ? '收 起' : '展 开' }}</span>
          </div>
          <p v-if="loreOpen" class="lore-text">{{ cfg.lore.text }}</p>
        </section>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { BUILDING_MAP } from '../data/buildings.js'
import { findHero } from '../data/heroes.js'
import AppIcon from './AppIcon.vue'
import { heroImage, hasLocalAsset } from '../utils/aiImage.js'

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

// 进度（仅在弹窗显示时跑 setInterval，避免后台空转）
const now = ref(Date.now())
let timer = null
function startTick() {
  if (timer) return
  timer = setInterval(() => { now.value = Date.now() }, 1000)
}
function stopTick() {
  if (timer) { clearInterval(timer); timer = null }
}
onMounted(() => { if (props.show) startTick() })
onUnmounted(stopTick)
watch(() => props.show, (v) => { v ? startTick() : stopTick() })

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
  background: rgba(0, 0, 0, .72);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  padding: var(--sp-2);
}

/* 羊皮纸卷宗面板：浅米黄 + 鎏金描边 + 朱砂阴影；与 .evt-panel 同主题 */
.modal-panel {
  width: 100%;
  max-width: 460px;
  max-height: 88vh;
  overflow-y: auto;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(255, 245, 210, .55) 0%, transparent 60%),
    linear-gradient(180deg, rgba(255, 245, 210, .98), rgba(220, 195, 140, .98));
  border: 1px solid var(--c-gold);
  border-radius: var(--r-md);
  box-shadow:
    inset 0 0 0 1px rgba(232, 196, 104, .55),
    inset 0 0 16px rgba(168, 122, 40, .18),
    0 -8px 28px rgba(0, 0, 0, .55),
    0 0 22px rgba(232, 196, 104, .25);
  padding: var(--sp-3) var(--sp-3) var(--sp-3);
  color: #2a1810;
}
.modal-enter-active, .modal-leave-active { transition: opacity .22s ease, transform .25s ease; }
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel { transform: translateY(20px); }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* 关键：弹窗全域强制墨黑色兜底，覆盖 body 的鎏金 color 级联，
   —— 避免任何未显式声明 color 的子节点落入“浅底浅字”陷阱 */
.modal-panel,
.modal-panel * {
  color: #2a1810;
}
/* 例外：保留必须的强调色（深色背景上的元素，如关闭按钮/朱砂胶囊） */
.modal-panel .m-close,
.modal-panel .m-close * { color: #fff1c2; }
.modal-panel .ac-ap,
.modal-panel .ac-ap * { color: #fff1c2; }
.modal-panel .rush-btn,
.modal-panel .rush-btn * { color: #fff1c2; }
.modal-panel .u-cost.lack,
.modal-panel .u-cost.lack * { color: #a8231a; }
.modal-panel .ac-cd { color: #a8231a; }
.modal-panel .ac-ready { color: #2d6a1f; }
.modal-panel .m-head,
.modal-panel .m-head * { color: #fff5cf; }
.modal-panel .m-head .m-sub-k { color: #f5d98c; }
.modal-panel .m-head .m-sub-v { color: #fff5cf; }
.modal-panel .m-name { color: #fff5cf; }
.modal-panel .lore-head,
.modal-panel .lore-toggle { color: #7a4a14; }
.modal-panel .plus { color: #a87a28; }
.modal-panel .p-lv { color: #7a4a14; }
.modal-panel .sec-title { color: #7a4a14; }
/* 标题栏：sticky 吸顶，深底鎏金 */
.m-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(232, 196, 104, .55);
  box-shadow: 0 1px 0 rgba(232, 196, 104, .15);
  padding: var(--sp-1) var(--sp-3) var(--sp-2);
  margin: calc(var(--sp-3) * -1) calc(var(--sp-3) * -1) var(--sp-2);
  position: sticky;
  top: calc(var(--sp-3) * -1);
  z-index: 3;
  background: linear-gradient(180deg, rgba(20, 10, 4, .98) 88%, rgba(40, 22, 10, .92));
  backdrop-filter: blur(2px);
}
.m-title { display: flex; align-items: center; gap: var(--sp-2); }

/* 印章式建筑大图标 */
.m-icon-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--c-gold);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(232, 196, 104, .25), rgba(20, 10, 4, .9) 70%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .35),
    inset 0 0 6px rgba(0, 0, 0, .55),
    0 0 6px rgba(232, 196, 104, .35);
  flex-shrink: 0;
}
.m-icon-emoji {
  font-size: var(--fs-xl);
  line-height: 1;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .65));
}
.m-name {
  font-family: var(--font-title);
  font-size: 19px;
  letter-spacing: 3px;
  color: var(--c-gold);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85), 0 0 8px rgba(232, 196, 104, .25);
}
.m-sub {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-top: 3px;
}
.m-sub-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  font-size: var(--fs-3xs);
  letter-spacing: 1px;
  border: 1px solid rgba(232, 196, 104, .65);
  border-radius: var(--r-pill);
  background: rgba(40, 22, 10, .55);
  color: #f5d98c;
}
.m-sub-k { color: #f5d98c; letter-spacing: 1px; opacity: .85; }
.m-sub-v {
  font-family: var(--font-num);
  color: #fff5cf;
  font-weight: 700;
  margin-left: 2px;
}

/* 关闭按钮：朱砂红章方块 */
.m-close {
  position: relative;
  background: linear-gradient(180deg, var(--c-red-light), var(--c-red));
  border: 1px solid var(--c-red-dark);
  width: 36px; height: 36px;
  font-size: var(--fs-lg);
  line-height: 1;
  cursor: pointer;
  padding: 0;
  color: #fff1c2;
  border-radius: var(--r-md);
  flex-shrink: 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 240, 200, .35),
    inset 0 0 0 1px rgba(0, 0, 0, .35),
    0 1px 3px rgba(0, 0, 0, .55);
  transition: background .15s, transform .15s, box-shadow .15s;
}
.m-close::before {
  content: '';
  position: absolute;
  inset: -6px;
}
.m-close:hover {
  transform: scale(1.05);
  box-shadow:
    inset 0 1px 0 rgba(255, 240, 200, .55),
    0 0 10px rgba(168, 35, 26, .65),
    0 1px 4px rgba(0, 0, 0, .6);
}
.m-close:active { transform: scale(.95); }

.m-sec { margin-bottom: var(--sp-3); }

/* 章节标题：正中四字 + 上下金线（浅底版） */
.sec-title {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin: var(--sp-2) 0 var(--sp-2);
  padding: 4px 8px;
  border-top: 1px solid rgba(168, 122, 40, .55);
  border-bottom: 1px solid rgba(168, 122, 40, .55);
  font-family: var(--font-title);
  font-size: var(--fs-xs);
  letter-spacing: 4px;
  color: #7a4a14;
  text-shadow: 0 1px 0 rgba(255, 245, 210, .55);
}
.sec-title-text {
  flex: 1;
  text-align: center;
  padding-left: 40px;
}
.sec-title .cap {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(168, 122, 40, .14);
  border: 1px solid rgba(168, 122, 40, .35);
  font-size: var(--fs-2xs);
  font-family: var(--font-num);
  color: #5a3a1c;
  opacity: .92;
  letter-spacing: 1px;
  white-space: nowrap;
  min-width: 40px;
  text-align: center;
}

/* 升级行：暗羊皮内嵌 + 鎏金 */
.upgrade-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) 0;
}
.upgrade-cost {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: var(--fs-xs);
  align-items: center;
}
.u-label {
  color: #5a3a1c;
  opacity: .85;
  letter-spacing: 1px;
}
.u-cost {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #2a1810;
  font-family: var(--font-num);
}
.u-cost-v { margin-left: 1px; }
.u-cost.lack { color: #a8231a; text-decoration: line-through; }
.u-time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 4px;
  color: #7a4a14;
  font-family: var(--font-num);
  font-size: var(--fs-xs);
}
.upgrade-btn {
  font-size: var(--fs-xs);
  padding: 5px 12px;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* 升级条 / 建造行 */
.build-bar-row {
  background:
    linear-gradient(180deg, rgba(255, 245, 210, .55), rgba(220, 195, 140, .45));
  border: 1px solid rgba(168, 122, 40, .55);
  border-radius: var(--r-sm);
  box-shadow:
    inset 0 0 0 1px rgba(232, 196, 104, .35),
    inset 0 0 8px rgba(168, 122, 40, .15);
  padding: 7px 10px;
}
.build-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--fs-xs);
  margin-bottom: 4px;
}
.b-label {
  color: #2a1810;
  letter-spacing: 1px;
  font-weight: 600;
}
.b-time {
  font-family: var(--font-num);
  color: #7a4a14;
}
.bar-track {
  height: 14px;
  background: rgba(40, 22, 10, .35);
  border: 1px solid var(--c-gold);
  border-radius: var(--r-sm);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, .55);
}
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
.build-actions {
  display: flex;
  gap: 6px;
  margin-top: 7px;
}
.rush-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* action-card：浅米黄底 + 暗赭描边 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.action-card {
  position: relative;
  border: 1px solid rgba(168, 122, 40, .55);
  background: linear-gradient(180deg, rgba(255, 245, 210, .85), rgba(232, 205, 150, .85));
  border-radius: var(--r-sm);
  padding: 6px 8px;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px rgba(255, 245, 210, .65),
    inset 0 0 8px rgba(168, 122, 40, .15);
  transition: transform .15s, box-shadow .15s;
}
.action-card:not(.disabled):hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 0 0 1px rgba(232, 196, 104, .65),
    inset 0 0 8px rgba(168, 122, 40, .2),
    0 0 10px rgba(232, 196, 104, .55);
}
.action-card.disabled {
  opacity: .55;
  cursor: not-allowed;
  border-color: rgba(122, 90, 58, .45);
}
.ac-head {
  display: flex;
  align-items: center;
  gap: 5px;
}
.ac-icon {
  font-size: var(--fs-lg);
  filter: drop-shadow(0 1px 0 rgba(255, 245, 210, .65));
}
.ac-name {
  font-family: var(--font-title);
  font-size: var(--fs-sm);
  letter-spacing: 2px;
  color: #2a1810;
  font-weight: 700;
}
.ac-ap {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--fs-2xs);
  font-family: var(--font-num);
  padding: 1px 5px;
  background: linear-gradient(180deg, #c8423a, #8e1a14);
  color: #fff1c2;
  border-radius: 3px;
  border: 1px solid #6e1410;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .25),
    inset 0 0 4px rgba(60, 8, 6, .55),
    0 1px 2px rgba(0, 0, 0, .35);
  text-shadow: 0 1px 1px rgba(60, 8, 6, .85);
}
.ac-ap-v { font-weight: 700; color: #fff5cf; }
.ac-desc {
  font-size: var(--fs-2xs);
  color: #5a3a1c;
  opacity: .9;
  margin: 3px 0;
  line-height: 1.4;
}
.ac-status {
  font-size: var(--fs-2xs);
  font-family: var(--font-num);
  letter-spacing: 1px;
}
.ac-ready { color: #2d6a1f; letter-spacing: 2px; }
.ac-cd { color: #a8231a; }

/* 驻守 —— 红绳挂木牌 */
.garr-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.garr-slot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid rgba(168, 122, 40, .55);
  border-radius: var(--r-sm);
  background: linear-gradient(180deg, rgba(255, 245, 210, .85), rgba(232, 205, 150, .85));
  min-width: 120px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 245, 210, .55),
    inset 0 0 6px rgba(168, 122, 40, .15);
}
.garr-slot.occupied {
  border-left: 3px solid var(--c-red);
}
.garr-slot.empty {
  border: 1px dashed rgba(168, 122, 40, .55);
  background: rgba(255, 245, 210, .35);
  color: #7a5a3a;
  cursor: pointer;
  justify-content: center;
}
.garr-slot.empty:hover {
  color: #7a4a14;
  border-color: var(--c-gold);
  background: rgba(255, 245, 210, .65);
  box-shadow:
    inset 0 0 0 1px rgba(232, 196, 104, .55),
    0 0 10px rgba(232, 196, 104, .45);
}
.g-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--c-gold);
  background: radial-gradient(circle at 35% 30%, rgba(232, 196, 104, .35), rgba(20, 10, 4, .9) 70%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .25),
    0 0 6px rgba(232, 196, 104, .35);
  flex-shrink: 0;
  overflow: hidden;
}
.g-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
.g-emoji {
  font-size: var(--fs-lg);
  line-height: 1;
}
.g-name {
  font-size: var(--fs-xs);
  color: #2a1810;
  font-family: var(--font-title);
  letter-spacing: 1px;
}
.g-btn {
  margin-left: auto;
  border: 1px solid rgba(168, 122, 40, .65);
  background: rgba(255, 245, 210, .65);
  font-size: var(--fs-2xs);
  padding: 2px 8px;
  cursor: pointer;
  color: #2a1810;
  border-radius: var(--r-sm);
  letter-spacing: 1px;
  font-family: var(--font-serif);
  box-shadow: none;
  transition: color .15s, border-color .15s, background .15s;
}
.g-btn:hover {
  color: #fff1c2;
  border-color: var(--c-red);
  background: rgba(168, 35, 26, .85);
}
.plus {
  font-size: 22px;
  line-height: 1;
  color: #a87a28;
  font-family: var(--font-title);
  text-shadow: 0 1px 0 rgba(255, 245, 210, .65);
}
.hint {
  font-size: var(--fs-2xs);
  color: #5a3a1c;
  letter-spacing: 2px;
}

/* 驻守 picker：浅羊皮纸内嵌槽位（与外层 .modal-panel 同主题，略深一层做层次） */
.garr-picker {
  border: 1px dashed rgba(168, 122, 40, .55);
  background: rgba(232, 205, 150, .55);
  border-radius: var(--r-sm);
  padding: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 6px;
  box-shadow: inset 0 0 8px rgba(168, 122, 40, .2);
}
.picker-empty {
  font-size: var(--fs-xs);
  color: #5a3a1c;
  padding: 4px;
  width: 100%;
  text-align: center;
  letter-spacing: 1px;
}
.picker-card {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border: 1px solid rgba(168, 122, 40, .55);
  border-radius: var(--r-sm);
  background: linear-gradient(180deg, rgba(255, 245, 210, .85), rgba(232, 205, 150, .85));
  cursor: pointer;
  font-size: var(--fs-xs);
  color: #2a1810;
  box-shadow:
    inset 0 0 0 1px rgba(255, 245, 210, .55),
    inset 0 0 6px rgba(168, 122, 40, .15);
  transition: transform .15s, box-shadow .15s;
}
.picker-card:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 0 0 1px rgba(232, 196, 104, .65),
    0 0 8px rgba(232, 196, 104, .55);
}
.p-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--c-gold);
  background: radial-gradient(circle at 35% 30%, rgba(232, 196, 104, .3), rgba(20, 10, 4, .9) 70%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .2),
    0 0 4px rgba(232, 196, 104, .3);
  flex-shrink: 0;
  overflow: hidden;
}
.p-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
.p-emoji {
  font-size: var(--fs-sm);
  line-height: 1;
}
.p-name {
  font-family: var(--font-title);
  letter-spacing: 1px;
  color: #2a1810;
}
.p-lv {
  color: #7a4a14;
  font-family: var(--font-num);
  font-size: var(--fs-2xs);
}
.garr-tip {
  font-size: var(--fs-2xs);
  color: #5a3a1c;
  text-align: center;
  letter-spacing: 1px;
  opacity: .85;
}

/* lore —— 浅羊皮卷轴（与外层同主题，左侧朱砂条做装饰） */
.lore-sec {
  border-top: 1px dashed rgba(168, 122, 40, .55);
  padding-top: var(--sp-2);
}
.lore-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-family: var(--font-title);
  font-size: var(--fs-xs);
  letter-spacing: 2px;
  color: #7a4a14;
}
.lore-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.lore-toggle {
  font-size: var(--fs-2xs);
  letter-spacing: 2px;
  color: #5a3a1c;
  opacity: .85;
  font-family: var(--font-serif);
}
.lore-text {
  font-size: var(--fs-xs);
  color: #2a1810;
  letter-spacing: 0.5px;
  line-height: 1.7;
  margin: 6px 0 0;
  padding: 8px 10px;
  background: rgba(255, 245, 210, .55);
  border-left: 3px solid var(--c-red);
  border-radius: var(--r-sm);
  box-shadow:
    inset 0 0 0 1px rgba(232, 196, 104, .35),
    inset 0 0 12px rgba(168, 122, 40, .12);
}

/* 移动端性能降级 */
@media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .modal-panel { padding: var(--sp-3) var(--sp-2) var(--sp-2); }
  .m-head { backdrop-filter: none; }
  .bar-fill.build {
    animation: none;
    background: linear-gradient(90deg, #b8862e, #d4af37);
  }
  .action-card { transition: none; }
  .action-card:not(.disabled):hover {
    transform: none;
    box-shadow:
      inset 0 0 0 1px rgba(255, 245, 210, .65),
      inset 0 0 8px rgba(168, 122, 40, .15);
  }
  .picker-card:hover {
    transform: none;
    box-shadow:
      inset 0 0 0 1px rgba(255, 245, 210, .55),
      inset 0 0 6px rgba(168, 122, 40, .15);
  }
  .garr-slot.empty:hover {
    color: #7a5a3a;
    border-color: rgba(168, 122, 40, .55);
    background: rgba(255, 245, 210, .35);
    box-shadow: none;
  }
  .g-btn:hover {
    color: #2a1810;
    border-color: rgba(168, 122, 40, .65);
    background: rgba(255, 245, 210, .65);
  }
  .m-close:hover {
    transform: none;
    box-shadow:
      inset 0 1px 0 rgba(255, 240, 200, .35),
      inset 0 0 0 1px rgba(0, 0, 0, .35),
      0 1px 3px rgba(0, 0, 0, .55);
  }
}
</style>
