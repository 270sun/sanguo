<template>
  <section class="view heroes-view">
    <h2 class="view-title">武 将 录</h2>
    <p class="view-tip">▎收集名将·培养精英·凝聚羁绊▎</p>

    <transition name="flash">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </transition>

    <!-- 我的武将 -->
    <div class="section-title">
      <span>麾 下 武 将</span>
      <span class="cap">{{ game.heroes.length }}/{{ game.heroCap }}</span>
    </div>

    <!-- 羁绊条幅 -->
    <div v-if="game.activeBonds.length" class="bond-banner card">
      <div class="bond-title">
        <AppIcon kind="misc" id="star" :size="14" tone="red" />
        羁 绊 共 鸣
        <AppIcon kind="misc" id="star" :size="14" tone="red" />
      </div>
      <div class="bond-list">
        <div v-for="b in game.activeBonds" :key="b.id" class="bond-item">
          <div class="bond-name">【{{ b.name }}】</div>
          <div class="bond-flavor">{{ b.flavor }}</div>
          <div class="bond-effect">
            战力 ×{{ b.powerMul.toFixed(2) }}
            <template v-for="(v, k) in b.rateBonus" :key="k">
              <span v-if="v" class="ef">
                ·<AppIcon :kind="rateIconConf(k).kind" :id="rateIconConf(k).id" :size="12" />+{{ v }}/s
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="potentialBond" class="bond-hint card">
      <div class="hint-line">▶ 距离激活「{{ potentialBond.name }}」尚缺：{{ potentialBond.missing.join('·') }}</div>
    </div>
    <div v-if="game.heroes.length === 0" class="empty-state card">
      <div class="empty-icon"><AppIcon kind="res" id="soldier" :size="36" tone="gold" /></div>
      <p class="empty-title">尚无武将归附</p>
      <p class="empty-hint">前往下方客栈招贤纳士，共图大业</p>
    </div>
    <div v-else class="my-grid hero-gallery"
         ref="galleryEl"
         @mousedown="onDragStart"
         @mousemove="onDragMove"
         @mouseup="onDragEnd"
         @mouseleave="onDragEnd">
      <div
        v-for="(h, i) in myHeroes"
        :key="h.id"
        class="hero-card"
        :data-q="h.meta.quality"
        :style="{ '--i': i }"
      >
        <div class="quality-ribbon"></div>
        <!-- 立绘背景层（仅在有本地立绘时铺满） -->
        <div
          v-if="hasFullArt(h.id)"
          class="hero-art"
          :style="{ backgroundImage: `url(${heroImage(h.id)})` }"
        ></div>
        <div class="hero-art-shade" v-if="hasFullArt(h.id)"></div>

        <div class="card-head">
          <div class="avatar-wrap" :style="{ boxShadow: `0 0 10px ${h.qmeta.glow}` }">
            <span v-if="!hasFullArt(h.id)" class="avatar avatar-fallback">{{ h.meta.avatar }}</span>
            <img
              v-if="!avatarFailed[h.id]"
              class="avatar-img"
              :class="{ loaded: avatarLoaded[h.id] }"
              :src="heroImage(h.id)"
              :alt="h.meta.name"
              loading="lazy"
              decoding="async"
              @load="avatarLoaded[h.id] = true"
              @error="avatarFailed[h.id] = true"
            />
            <span v-if="!avatarFailed[h.id] && !avatarLoaded[h.id] && !hasFullArt(h.id)" class="avatar-spinner"></span>
          </div>
          <div class="head-info">
            <div class="name-row">
              <span class="name">{{ h.meta.name }}</span>
              <span class="faction" :style="{ background: h.fmeta.color }">{{ h.fmeta.label }}</span>
            </div>
            <div class="lv-row">
              <span class="level-badge">Lv {{ h.level }}</span>
              <span class="q-tag" :style="{ color: h.qmeta.color }">{{ h.qmeta.label }}将</span>
              <span v-if="h.garrisonAt" class="garr-badge" :title="`驻守于${h.garrisonAt}`">
                <AppIcon kind="misc" id="flag" :size="11" tone="gold" /> {{ h.garrisonAt }}
              </span>
            </div>
          </div>
          <button class="dismiss" @click="onDismiss(h.id)" title="遣散">×</button>
        </div>

        <div class="stat-row">
          <span class="s"><b>武</b>{{ h.meta.stats.wu }}</span>
          <span class="s"><b>智</b>{{ h.meta.stats.wen }}</span>
          <span class="s"><b>统</b>{{ h.meta.stats.tong }}</span>
        </div>

        <div class="skill-box">
          <span class="skill-name">【{{ h.meta.skill.name }}】</span>
          <span class="skill-desc">{{ h.meta.skill.desc }}</span>
        </div>

        <!-- 任务分配 -->
        <div class="task-row">
          <span class="task-label">职：</span>
          <div v-if="h.garrisonAt" class="task-locked">
            <AppIcon kind="misc" id="flag" :size="11" tone="gold" /> 驻守{{ h.garrisonAt }}中（先撤回方可派任务）
          </div>
          <div v-else class="task-btns">
            <button
              v-for="t in tasks"
              :key="t.key"
              class="task-btn"
              :class="{ active: h.task === t.key }"
              @click="onAssign(h.id, h.task === t.key ? null : t.key)"
            >
              <AppIcon :kind="taskIcon(t.key).kind" :id="taskIcon(t.key).id" :size="12" />{{ t.label }}
            </button>
          </div>
        </div>

        <!-- 经验 / 升级 -->
        <div class="exp-row">
          <div class="exp-track">
            <div class="exp-fill" :style="{ width: h.expPct + '%' }"></div>
          </div>
          <span class="exp-num num">{{ Math.floor(h.exp) }}/{{ h.expNeed }}</span>
        </div>
        <button
          class="btn primary lvup-btn"
          :disabled="!h.canLvUp"
          @click="onLevelUp(h.id)"
        >
          {{ h.canLvUp ? `升级 · 耗${h.lvCost.coin}金${h.lvCost.grain}粮` : '升级条件未满足' }}
        </button>
      </div>
    </div>

    <!-- 客栈招募 -->
    <div class="section-title">
      <span>客 栈 招 募</span>
      <button class="btn refresh-btn" :disabled="game.resources.coin < 80" @click="onRefresh">
        <AppIcon kind="misc" id="refresh" :size="12" tone="ink" /> 刷新 ({{ 80 }}金)
      </button>
    </div>

    <div v-if="game.heroRoster.length === 0" class="empty-state card">
      <p class="empty-title">客栈尚无宾客</p>
      <p class="empty-hint">点击上方"刷新"召唤候选武将</p>
    </div>
    <div v-else class="recruit-grid">
      <div
        v-for="(r, i) in rosterDetailed"
        :key="r.rollId"
        class="recruit-card"
        :data-q="r.quality"
        :style="{ '--i': i }"
      >
        <div class="quality-ribbon"></div>
        <div class="r-avatar-wrap" :style="{ boxShadow: `0 0 14px ${r.qmeta.glow}` }">
          <span v-if="avatarFailed[r.id] || !hasLocalAsset('hero', r.id)" class="r-avatar avatar-fallback">{{ r.avatar }}</span>
          <img
            v-if="!avatarFailed[r.id]"
            class="r-avatar-img"
            :class="{ loaded: avatarLoaded[r.id] }"
            :src="heroImage(r.id)"
            :alt="r.name"
            loading="lazy"
            decoding="async"
            @load="avatarLoaded[r.id] = true"
            @error="avatarFailed[r.id] = true"
          />
          <span v-if="!avatarFailed[r.id] && !avatarLoaded[r.id]" class="avatar-spinner sm"></span>
        </div>
        <div class="r-name">{{ r.name }}</div>
        <div class="r-tag">
          <span class="q-tag" :style="{ color: r.qmeta.color }">{{ r.qmeta.label }}将</span>
          <span class="faction" :style="{ background: r.fmeta.color }">{{ r.fmeta.label }}</span>
        </div>
        <div class="r-stat">武{{ r.stats.wu }}·智{{ r.stats.wen }}·统{{ r.stats.tong }}</div>
        <div class="r-skill">【{{ r.skill.name }}】</div>
        <div class="r-cost">
          <span :class="{ lack: game.resources.coin < r.recruitCost.coin }">
            <AppIcon kind="res" id="coin" :size="11" />{{ r.recruitCost.coin }}
          </span>
          <span :class="{ lack: game.resources.grain < r.recruitCost.grain }">
            <AppIcon kind="res" id="grain" :size="11" />{{ r.recruitCost.grain }}
          </span>
          <span :class="{ lack: game.ap.cur < r.recruitCost.ap }">
            <AppIcon kind="res" id="ap" :size="11" />{{ r.recruitCost.ap }}
          </span>
        </div>
        <button
          class="btn primary recruit-btn"
          :disabled="!canRecruit(r)"
          @click="onRecruit(r.rollId)"
        >
          {{ recruitLabel(r) }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useGameStore } from '../stores/game'
import { findHero, QUALITY_META, FACTION_META, TASK_LIST } from '../data/heroes'
import { BONDS } from '../data/bonds'
import { BUILDING_MAP } from '../data/buildings'
import { heroImage, hasLocalAsset } from '../utils/aiImage.js'
import AppIcon from '../components/AppIcon.vue'

/** 是否拥有真实立绘（决定是否启用立绘廊模式） */
function hasFullArt(heroId) { return hasLocalAsset('hero', heroId) }

/** task.key -> AppIcon 映射 */
const TASK_ICON_MAP = {
  patrol:  { kind: 'gov',  id: 'security' },
  drill:   { kind: 'res',  id: 'soldier' },
  farm:    { kind: 'res',  id: 'grain' },
  logging: { kind: 'res',  id: 'wood' }
}
function taskIcon(key) { return TASK_ICON_MAP[key] || { kind: 'misc', id: 'star' } }

/** rateBonus 字段（grain/coin/wood/soldier）-> AppIcon */
const RATE_ICON_MAP = {
  grain:   { kind: 'res', id: 'grain' },
  coin:    { kind: 'res', id: 'coin' },
  wood:    { kind: 'res', id: 'wood' },
  soldier: { kind: 'res', id: 'soldier' }
}
function rateIconConf(k) { return RATE_ICON_MAP[k] || { kind: 'misc', id: 'star' } }

const game = useGameStore()
const tasks = TASK_LIST

/** 武将廊 - 拖拽滚动支持（鼠标按下拖动可平移卡片）
 *  关键设计：
 *   - mousedown 只记录起点，不立即进入 dragging 状态（否则 pointer-events:none 会吃掉按钮 click）
 *   - mousemove 累计位移 > DRAG_THRESHOLD(5px) 才真正"升级为拖拽"
 *   - mouseup 时若从未升级，则什么都不做 → click 正常派发到 ×/升级按钮
 */
const DRAG_THRESHOLD = 5
const galleryEl = ref(null)
const drag = reactive({ pressed: false, dragging: false, startX: 0, startScroll: 0, moved: 0 })
function onDragStart(e) {
  if (e.button !== 0) return
  const el = galleryEl.value
  if (!el) return
  drag.pressed = true
  drag.dragging = false
  drag.startX = e.clientX
  drag.startScroll = el.scrollLeft
  drag.moved = 0
}
function onDragMove(e) {
  if (!drag.pressed) return
  const el = galleryEl.value
  if (!el) return
  const dx = e.clientX - drag.startX
  drag.moved = Math.abs(dx)
  if (!drag.dragging && drag.moved > DRAG_THRESHOLD) {
    drag.dragging = true
    el.classList.add('dragging')
  }
  if (drag.dragging) {
    el.scrollLeft = drag.startScroll - dx
    e.preventDefault()
  }
}
function onDragEnd() {
  if (!drag.pressed) return
  const wasDragging = drag.dragging
  drag.pressed = false
  drag.dragging = false
  const el = galleryEl.value
  if (el) el.classList.remove('dragging')
  // 仅在"真的拖拽过"时，吞掉随后立刻触发的 click（避免拖动结束意外点击卡内按钮）
  if (wasDragging && el) {
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault() }
    el.addEventListener('click', swallow, { capture: true, once: true })
  }
}

/** 头像加载失败缓存：id -> true，避免每次 computed 重置 */
const avatarFailed = reactive({})
/** 头像加载完成缓存：id -> true，用于控制 loading 占位渐隐 */
const avatarLoaded = reactive({})

const RATE_ICONS = { grain: '🌾', coin: '💰', wood: '🪵', soldier: '⚔' }
function rateIcon(k) { return RATE_ICONS[k] || '' }
/* 旧 emoji 映射保留作为 fallback，新模板已切到 AppIcon */

/** 距离激活最近的羁绊（缺 ≤ 2 个成员） */
const potentialBond = computed(() => {
  const owned = new Set(game.heroes.map((h) => h.id))
  const candidates = BONDS
    .filter((b) => !b.members.every((m) => owned.has(m)))
    .map((b) => {
      const missing = b.members.filter((m) => !owned.has(m))
      return { ...b, missing: missing.map((id) => findHero(id)?.name || id), missCount: missing.length }
    })
    .filter((b) => b.missCount > 0 && b.missCount <= 2)
    .sort((a, b) => a.missCount - b.missCount)
  return candidates[0] || null
})

const toast = ref(null)
let toastTimer = null
function showToast(msg, type = 'ok') {
  toast.value = { msg, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 1500)
}

const myHeroes = computed(() =>
  game.heroes.map((h) => {
    const meta = findHero(h.id) || { name: h.id, avatar: '👤', stats: {}, quality: 'common', faction: 'qun', skill: {} }
    const qmeta = QUALITY_META[meta.quality] || QUALITY_META.common
    const fmeta = FACTION_META[meta.faction] || FACTION_META.qun
    const expNeed = 50 * h.level * h.level
    const expPct = Math.min(100, Math.round((h.exp / expNeed) * 100))
    const qMul = { common: 1, rare: 2, epic: 4, legend: 8 }[meta.quality] || 1
    const lvCost = { coin: 300 * h.level * qMul, grain: 150 * h.level * qMul }
    const canLvUp =
      h.exp >= expNeed &&
      game.resources.coin >= lvCost.coin &&
      game.resources.grain >= lvCost.grain
    const garrBuildKey = game.heroGarrisonOf(h.id)
    const garrisonAt = garrBuildKey ? (BUILDING_MAP[garrBuildKey]?.name || garrBuildKey) : null
    return { ...h, meta, qmeta, fmeta, expNeed, expPct, lvCost, canLvUp, garrisonAt }
  })
)

const rosterDetailed = computed(() =>
  game.heroRoster.map((r) => ({
    ...r,
    qmeta: QUALITY_META[r.quality] || QUALITY_META.common,
    fmeta: FACTION_META[r.faction] || FACTION_META.qun
  }))
)

function canRecruit(r) {
  if (game.heroes.length >= game.heroCap) return false
  return (
    game.resources.coin >= r.recruitCost.coin &&
    game.resources.grain >= r.recruitCost.grain
  )
}
function recruitLabel(r) {
  if (game.heroes.length >= game.heroCap) return '名额已满'
  if (game.resources.coin < r.recruitCost.coin) return '铜钱不足'
  if (game.resources.grain < r.recruitCost.grain) return '粮草不足'
  return '招 募'
}

function onRefresh() {
  const res = game.refreshTavern()
  showToast(res.ok ? '客栈宾客已更新' : res.reason, res.ok ? 'ok' : 'err')
}
function onRecruit(rollId) {
  const res = game.recruitHero(rollId)
  showToast(res.ok ? '已招至麾下！' : res.reason, res.ok ? 'ok' : 'err')
}
function onAssign(heroId, taskKey) {
  game.assignTask(heroId, taskKey)
  showToast(taskKey ? '已委派职务' : '已解除职务', 'ok')
}
function onLevelUp(heroId) {
  const res = game.levelUpHero(heroId)
  showToast(res.ok ? '武将精进，能力提升！' : res.reason, res.ok ? 'ok' : 'err')
}
function onDismiss(heroId) {
  if (confirm('确认遣散此武将？')) {
    game.dismissHero(heroId)
    showToast('已遣散', 'ok')
  }
}
</script>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0 8px;
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 4px;
  color: var(--c-gold-light);
  border-bottom: 1px dashed rgba(232, 196, 104, .55);
  padding-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.section-title .cap {
  font-size: 13px;
  color: var(--c-gold);
  letter-spacing: 1px;
  font-family: var(--font-num);
}
.section-title .refresh-btn {
  font-size: 13px;
  padding: 3px 10px;
  letter-spacing: 2px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 18px 12px;
}
.empty-icon {
  margin: 0 auto 6px;
  display: inline-flex;
  filter: drop-shadow(0 0 6px rgba(232, 196, 104, .45));
}
.empty-title { font-family: var(--font-title); font-size: 15px; letter-spacing: 3px; color: var(--c-gold-light); margin: 2px 0; }
.empty-hint { font-size: 13px; color: var(--c-gold-light); opacity: .7; letter-spacing: 1px; }

/* 羁绊条幅 */
.bond-banner {
  margin-bottom: 10px;
  padding: 8px 10px;
  background:
    linear-gradient(180deg, rgba(168, 35, 26, .42), rgba(60, 18, 12, .85));
  border: 1px solid var(--c-red);
  box-shadow: 0 0 14px rgba(212, 175, 55, .35), inset 0 0 0 1px rgba(255, 240, 200, .3);
}
.bond-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 6px;
  color: var(--c-gold-light);
  text-align: center;
  margin-bottom: 6px;
  text-shadow: 0 0 8px rgba(212, 175, 55, .75), 0 1px 2px rgba(0, 0, 0, .8);
}
.bond-list { display: flex; flex-direction: column; gap: 6px; }
.bond-item {
  background: rgba(0, 0, 0, .35);
  border-left: 3px solid var(--c-gold);
  padding: 4px 8px;
  border-radius: var(--r-sm);
}
.bond-name {
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 2px;
  color: #ffd86b;
  font-weight: 700;
}
.bond-flavor {
  font-size: 12px;
  color: rgba(255, 240, 200, .6);
  margin: 1px 0 2px;
  letter-spacing: 1px;
}
.bond-effect {
  font-size: 13px;
  color: var(--c-gold-light);
  font-family: var(--font-num);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.bond-effect .ef {
  color: #b3e5a3;
  margin-left: 2px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.bond-hint {
  margin-bottom: 8px;
  padding: 6px 10px;
  background: rgba(40, 22, 10, .65);
  border: 1px dashed var(--c-gold);
}
.hint-line {
  font-size: 13px;
  color: var(--c-gold-light);
  letter-spacing: 1px;
  text-align: center;
}

/* 我的武将卡 */
.my-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

/* ===== 立绘廊：横向滑动，每张卡显示立绘背景 ===== */
.hero-gallery {
  display: flex;
  grid-template-columns: none;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  scrollbar-color: rgba(232, 196, 104, .55) rgba(20, 10, 4, .35);
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  overscroll-behavior-x: contain;
  cursor: grab;
  user-select: none;
}
.hero-gallery.dragging {
  cursor: grabbing;
  scroll-snap-type: none;   /* 拖拽时禁用 snap，避免回弹 */
}
.hero-gallery.dragging .hero-card { pointer-events: none; }
.hero-gallery::-webkit-scrollbar { height: 6px; }
.hero-gallery::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, var(--c-gold-dark), var(--c-gold));
  border-radius: var(--r-sm);
}
.hero-gallery .hero-card {
  flex: 0 0 230px;
  min-height: 360px;
  scroll-snap-align: start;
  overflow: hidden;
  /* 立绘 + 文字上下分区，padding-top 让出立绘区域 */
  padding-top: 0;
}
/* 立绘背景层：只占卡片上半部分，与文字区互不重叠 */
.hero-art {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 168px;
  z-index: 0;
  background-size: cover;
  background-position: top center;
  opacity: 1;
  transition: transform 8s ease;
}
.hero-card:hover .hero-art { transform: scale(1.04); }
/* 阴影仅在立绘底边羽化过渡到文字区，不再压满整图 */
.hero-art-shade {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 168px;
  z-index: 1;
  background:
    linear-gradient(180deg,
      rgba(20,10,4,0)   0%,
      rgba(20,10,4,0)   60%,
      rgba(20,10,4,.65) 90%,
      rgba(10,4,2,.95) 100%);
  pointer-events: none;
}
/* 文字内容走文档流，落在立绘下方（padding-top = 立绘高 + 8px 间距） */
.hero-gallery .hero-card .card-head,
.hero-gallery .hero-card .stat-row,
.hero-gallery .hero-card .skill-box,
.hero-gallery .hero-card .task-row,
.hero-gallery .hero-card .exp-row,
.hero-gallery .hero-card .lvup-btn {
  position: relative;
  z-index: 2;
}
.hero-gallery .hero-card .card-head {
  margin-top: 168px;
  padding-top: 6px;
}
/* 立绘廊里不再重复显示头像（立绘本身就是大图） */
.hero-gallery .hero-card .avatar-wrap { display: none; }
.hero-gallery .hero-card .name { font-size: 16px; text-shadow: 0 2px 6px rgba(0,0,0,.85); }

@media (max-width: 640px), (pointer: coarse) {
  .hero-gallery .hero-card { flex-basis: 200px; min-height: 330px; }
  .hero-gallery .hero-card .hero-art,
  .hero-gallery .hero-card .hero-art-shade { height: 140px; }
  .hero-gallery .hero-card .card-head { margin-top: 140px; }
  .hero-card:hover .hero-art { transform: none; }
}

.hero-card, .recruit-card {
  position: relative;
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .55);
  padding: 10px 10px 8px;
  border-radius: var(--r-sm);
  color: var(--c-gold-light);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 18px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703,
    0 4px 10px rgba(0, 0, 0, .55);
  opacity: 0;
  transform: translateY(8px);
  animation: hero-in .45s cubic-bezier(.22,.61,.36,1) forwards;
  animation-delay: calc(var(--i, 0) * 70ms);
}
@keyframes hero-in {
  to { opacity: 1; transform: translateY(0); }
}
.quality-ribbon {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--c-muted);
}
.hero-card[data-q="common"]   .quality-ribbon,
.recruit-card[data-q="common"] .quality-ribbon { background: linear-gradient(90deg, transparent, #9aa0a6, transparent); }
.hero-card[data-q="rare"]     .quality-ribbon,
.recruit-card[data-q="rare"]   .quality-ribbon { background: linear-gradient(90deg, transparent, #4a90e2, transparent); }
.hero-card[data-q="epic"]     .quality-ribbon,
.recruit-card[data-q="epic"]   .quality-ribbon { background: linear-gradient(90deg, transparent, #a35be5, transparent); }
.hero-card[data-q="legend"]   .quality-ribbon,
.recruit-card[data-q="legend"] .quality-ribbon {
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
  height: 4px;
  box-shadow: 0 0 8px rgba(212,175,55,.7);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.avatar-wrap {
  position: relative;
  width: 46px; height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle, rgba(232, 196, 104, .55), rgba(232, 196, 104, 0) 70%),
    #1a0e07;
  border: 1.5px solid var(--c-gold);
  flex-shrink: 0;
  overflow: hidden;
}
.avatar { font-size: 26px; }
.avatar-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: .55;
  color: var(--c-gold-light);
}
.avatar-img {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity .45s ease;
}
.avatar-img.loaded { opacity: 1; }
.avatar-spinner {
  position: absolute;
  z-index: 3;
  width: 22px; height: 22px;
  border: 2px solid rgba(212, 175, 55, .25);
  border-top-color: var(--c-gold);
  border-radius: 50%;
  animation: avSpin .9s linear infinite;
}
.avatar-spinner.sm { width: 18px; height: 18px; border-width: 2px; }
@keyframes avSpin { to { transform: rotate(360deg); } }
.head-info { flex: 1; }
.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.name {
  font-family: var(--font-title);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--c-gold-light);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.faction {
  display: inline-block;
  padding: 0 5px;
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--c-gold-light);
  border: 1px solid rgba(0,0,0,.55);
  box-shadow: inset 0 0 0 1px rgba(255,240,200,.3);
}
.lv-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.level-badge {
  font-family: var(--font-num);
  font-size: 13px;
  background: linear-gradient(180deg, #d75a52, #8e1a14);
  color: #fff5cf;
  padding: 1px 6px;
  border: 1px solid var(--c-red-dark);
  letter-spacing: 1px;
}
.q-tag {
  font-size: 13px;
  font-family: var(--font-title);
  letter-spacing: 2px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .8);
}
.garr-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  background: rgba(45, 90, 60, .9);
  border: 1px solid var(--c-gold-dark);
  color: #fff5cf;
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 1px;
}
.dismiss {
  background: rgba(0, 0, 0, .35);
  border: 1px solid var(--c-muted);
  color: var(--c-muted);
  width: 22px;
  height: 22px;
  font-size: 15px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  border-radius: var(--r-sm);
}
.dismiss:hover { color: var(--c-red); border-color: var(--c-red); background: rgba(168, 35, 26, .2); }

.stat-row {
  display: flex;
  justify-content: space-around;
  font-size: 13px;
  color: var(--c-gold-light);
  background: rgba(0, 0, 0, .35);
  border: 1px solid rgba(232, 196, 104, .4);
  padding: 4px 0;
  margin-bottom: 6px;
  border-radius: var(--r-sm);
}
.stat-row .s b {
  color: #ff8a78;
  font-family: var(--font-title);
  margin-right: 2px;
}

.skill-box {
  font-size: 13px;
  padding: 4px 6px;
  background: rgba(168, 35, 26, .2);
  border-left: 3px solid var(--c-red);
  margin-bottom: 6px;
  line-height: 1.4;
  border-radius: var(--r-sm);
}
.skill-name {
  font-family: var(--font-title);
  color: #ff8a78;
  letter-spacing: 1px;
}
.skill-desc { color: var(--c-gold-light); margin-left: 4px; opacity: .85; }

.task-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.task-label {
  font-size: 13px;
  color: var(--c-gold);
  flex-shrink: 0;
}
.task-btns {
  display: flex;
  gap: 3px;
  flex: 1;
  flex-wrap: wrap;
}
.task-locked {
  flex: 1;
  font-size: 12px;
  color: #b3e5a3;
  background: rgba(45, 90, 60, .35);
  border: 1px dashed #4d7a4c;
  padding: 3px 6px;
  letter-spacing: 1px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.task-btn {
  flex: 1;
  min-width: 50px;
  font-size: 12px;
  padding: 3px 4px;
  background: rgba(20, 10, 4, .75);
  border: 1px solid rgba(232, 196, 104, .4);
  color: var(--c-gold-light);
  cursor: pointer;
  letter-spacing: 0;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: var(--r-sm);
}
.task-btn.active {
  background: linear-gradient(180deg, #f5d678, #b8862e);
  border-color: var(--c-gold-dark);
  color: #2a1810;
  font-weight: 700;
  box-shadow: 0 0 10px rgba(232, 196, 104, .75);
}

.exp-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.exp-track {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, .55);
  border: 1px solid rgba(232, 196, 104, .35);
  border-radius: var(--r-sm);
  overflow: hidden;
}
.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4d7a4c, #d4af37);
  transition: width .35s;
  box-shadow: 0 0 4px rgba(212, 175, 55, .55);
}
.exp-num {
  font-size: 12px;
  color: var(--c-gold-light);
  opacity: .8;
  min-width: 56px;
  text-align: right;
}
.lvup-btn {
  width: 100%;
  font-size: 13px;
  padding: 4px 8px;
  letter-spacing: 2px;
}

/* 招募卡 */
.recruit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.recruit-card {
  padding: 8px 4px 8px;
  text-align: center;
}
.r-avatar-wrap {
  position: relative;
  width: 42px; height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px auto 4px;
  background:
    radial-gradient(circle, rgba(232, 196, 104, .55), rgba(232, 196, 104, 0) 70%),
    #1a0e07;
  border: 1.5px solid var(--c-gold);
  overflow: hidden;
}
.r-avatar { font-size: 22px; }
.r-avatar-img {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity .45s ease;
}
.r-avatar-img.loaded { opacity: 1; }
.r-name {
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--c-gold-light);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.r-tag {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin: 3px 0;
}
.r-stat { font-size: 12px; color: rgba(255, 240, 200, .65); }
.r-skill {
  font-size: 12px;
  color: #ff8a78;
  font-family: var(--font-title);
  margin: 3px 0;
  letter-spacing: 1px;
}
.r-cost {
  display: flex;
  justify-content: space-around;
  font-size: 12px;
  color: var(--c-gold-light);
  margin: 4px 0;
}
.r-cost span {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.r-cost .lack { color: var(--c-red); text-decoration: line-through; }
.recruit-btn {
  width: 100%;
  font-size: 12px;
  padding: 3px 0;
  letter-spacing: 2px;
}

.toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 8px 18px;
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 3px;
  border: 1px solid var(--c-gold-dark);
  background: linear-gradient(180deg, #fff5cf, #d8a04a);
  color: var(--c-ink);
  box-shadow: 0 0 12px rgba(232, 196, 104, .6), 0 4px 10px rgba(0, 0, 0, .4);
}
.toast.err {
  background: linear-gradient(180deg, #f7c9c5, #b8362c);
  border-color: var(--c-red-dark);
  color: #fff1c2;
}
.flash-enter-active, .flash-leave-active { transition: opacity .25s, transform .25s; }
.flash-enter-from { opacity: 0; transform: translate(-50%, -8px); }
.flash-leave-to   { opacity: 0; transform: translate(-50%, -8px); }
</style>
