<template>
  <section class="view battle-view">
    <h2 class="view-title">出 征 演 武</h2>
    <p class="view-tip">▎编排队伍·选定目标·决战沙场▎</p>

    <transition name="flash">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </transition>

    <!-- 1. 选择目标 -->
    <div class="section-title">
      <span>① 选 择 目 标</span>
      <span class="hint">{{ availableList.length }} 可征</span>
    </div>
    <div v-if="availableList.length === 0" class="card empty-state">
      <p class="empty-title">天下已定</p>
      <p class="empty-hint">所有州郡均在治下</p>
    </div>
    <div v-else class="map-wrap">
      <ChinaMap
        :owned-ids="game.territories"
        :cooldown="game.territoryCooldown"
        :selected-id="targetId"
        @pick="onMapPick"
      />
    </div>

    <!-- 选中州上下文 -->
    <div v-if="target" class="t-card sel-ctx" :class="{ cooling: target.cooling > 0 }">
      <span class="t-name">{{ target.name }}</span>
      <span class="tier-tag" :style="{ background: target.tierMeta.color }">{{ target.tierMeta.label }}</span>
      <span
        class="owner-tag"
        :style="{ borderColor: target.ownerColor, color: target.ownerColor }"
        :title="`当前占据：${target.defender}`"
      >
        {{ target.ownerName }}
      </span>
      <span class="ctx-item">守军 <b class="num">{{ target.power }}</b></span>
      <span class="ctx-item cost-line">
        耗
        <AppIcon kind="res" id="soldier" :size="11" />{{ target.cost.soldier }}
        ·<AppIcon kind="res" id="grain" :size="11" />{{ target.cost.grain }}
        ·<AppIcon kind="res" id="ap" :size="11" />{{ target.cost.ap }}
      </span>
      <span class="ctx-item ctx-desc">{{ target.desc }}</span>
      <span v-if="target.cooling > 0" class="ctx-item cd-inline">冷却 {{ target.cooling }}s</span>
    </div>

    <!-- 2. 编排队伍 -->
    <div class="section-title">
      <span>② 编 排 队 伍</span>
      <span class="hint">{{ selectedHeroes.length }}/3</span>
    </div>
    <div v-if="game.heroes.length === 0" class="card empty-state">
      <p class="empty-title">尚无武将</p>
      <p class="empty-hint">先去客栈招贤纳士</p>
    </div>
    <div v-else class="hero-pick">
      <div
        v-for="h in heroOptions"
        :key="h.id"
        class="pick-card"
        :class="{ on: selectedHeroes.includes(h.id) }"
        @click="toggleHero(h.id)"
      >
        <div class="pick-avatar">
          <img
            v-if="hasLocalAsset('hero', h.id)"
            class="pick-art"
            :src="heroImage(h.id)"
            :alt="h.meta.name"
            loading="lazy"
          />
          <span v-else class="pick-emoji">{{ h.meta.avatar }}</span>
        </div>
        <div class="pick-info">
          <div class="pick-name">{{ h.meta.name }} <span class="lv">Lv{{ h.level }}</span></div>
          <div class="pick-stat">武{{ h.meta.stats.wu }}·智{{ h.meta.stats.wen }}·统{{ h.meta.stats.tong }}</div>
        </div>
        <div class="pick-mark">{{ selectedHeroes.includes(h.id) ? '✓' : '' }}</div>
      </div>
    </div>

    <!-- 羁绊提示（编队联动） -->
    <div v-if="selectedHeroes.length && partyBonds.length" class="bond-fire card">
      <div class="fire-title">
        <AppIcon kind="misc" id="star" :size="12" tone="red" />
        羁 绊 共 鸣
        <AppIcon kind="misc" id="star" :size="12" tone="red" />
      </div>
      <div v-for="b in partyBonds" :key="b.id" class="fire-row">
        <span class="fire-name">【{{ b.name }}】</span>
        <span class="fire-num">×{{ b.powerMul.toFixed(2) }}</span>
      </div>
      <div class="fire-total">合计战力倍率 <b>×{{ partyBondMul.toFixed(2) }}</b></div>
    </div>
    <div v-else-if="selectedHeroes.length >= 2" class="bond-fire-hint">
      ◇ 当前队伍未触发羁绊·尝试组合 关·张·赵 等组合
    </div>

    <!-- 3. 战力对比 + 开战 -->
    <div v-if="target" class="card vs-card">
      <div class="vs-row">
        <div class="vs-side ours">
          <div class="vs-label">我军战力</div>
          <div class="vs-num num">{{ ourPower }}</div>
          <div class="vs-sub">{{ selectedHeroes.length || 0 }} 将出征</div>
        </div>
        <div class="vs-mid">VS</div>
        <div class="vs-side enemy">
          <div class="vs-label">{{ target.defender }} · 战力</div>
          <div class="vs-num num">{{ target.power }}</div>
          <div class="vs-sub">{{ winChanceLabel }}</div>
        </div>
      </div>
      <button class="btn primary go-btn" :disabled="!canBattle" @click="onBattle">
        {{ battleBtnLabel }}
      </button>
    </div>

    <!-- 战报弹窗 -->
    <transition name="modal">
      <div v-if="lastResult" class="modal-mask" @click.self="lastResult = null">
        <div class="modal report" :class="{ win: lastResult.win, lose: !lastResult.win }">
          <div class="report-title">
            {{ lastResult.win ? '大 捷' : '兵 败' }}
          </div>
          <div class="report-line">{{ lastResult.territoryName }}</div>
          <div class="report-roll">
            我方 <b class="num">{{ lastResult.ourRoll }}</b>
            <span class="vs-min">vs</span>
            敌方 <b class="num">{{ lastResult.enemyRoll }}</b>
          </div>
          <!-- 分回合演出 -->
          <div v-if="lastResult.rounds && lastResult.rounds.length" class="rounds-stage">
            <transition-group name="round" tag="div" class="rounds-wrap">
              <div
                v-for="(r, i) in visibleRounds"
                :key="lastResult.id + '_' + i"
                class="round-line"
                :class="'side-' + r.side"
              >
                <span class="rl-dot">·</span>
                <span class="rl-text">{{ r.text }}</span>
              </div>
            </transition-group>
            <button
              v-if="visibleRounds.length < lastResult.rounds.length"
              class="skip-btn"
              @click="skipRounds"
            >跳过 »</button>
          </div>
          <div class="report-detail">
            <div>出战：{{ lastResult.heroNames.join('·') }}</div>
            <div v-if="lastResult.bondNames && lastResult.bondNames.length" class="report-bond">
              <AppIcon kind="misc" id="star" :size="11" tone="red" />
              羁绊：{{ lastResult.bondNames.join('·') }} (×{{ lastResult.bondMul }})
            </div>
            <div v-if="lastResult.specPowerMul > 1" class="report-bond">
              流派加成 ×{{ lastResult.specPowerMul }}
            </div>
            <div v-if="lastResult.win" class="reward-line">
              战获：
              <span v-if="lastResult.rewards.coin"><AppIcon kind="res" id="coin" :size="11" />{{ lastResult.rewards.coin }}</span>
              <span v-if="lastResult.rewards.grain"><AppIcon kind="res" id="grain" :size="11" />{{ lastResult.rewards.grain }}</span>
              <span v-if="lastResult.rewards.wood"><AppIcon kind="res" id="wood" :size="11" />{{ lastResult.rewards.wood }}</span>
              <span v-if="lastResult.rewards.soldier"><AppIcon kind="res" id="soldier" :size="11" />{{ lastResult.rewards.soldier }}</span>
              <span v-if="lastResult.rewards.reputation">声望+{{ lastResult.rewards.reputation }}</span>
              <span v-if="lastResult.rewards.jadeShard">玉碎+{{ lastResult.rewards.jadeShard }}</span>
            </div>
            <div v-if="lastResult.win">武将 +{{ lastResult.expGain }} 经验</div>
            <div v-else>损兵 {{ lastResult.loss }}·冷却 60s</div>
          </div>
          <button class="btn primary" @click="lastResult = null">收 兵</button>
        </div>
      </div>
    </transition>

    <!-- 历史战报 -->
    <div v-if="game.battleLog.length" class="section-title">
      <span>战 报 卷 宗</span>
    </div>
    <div class="log-list">
      <div
        v-for="b in game.battleLog"
        :key="b.id"
        class="log-item"
        :class="{ win: b.win, lose: !b.win }"
      >
        <span class="log-icon">{{ b.win ? '✓' : '✗' }}</span>
        <span class="log-name">{{ b.territoryName }}</span>
        <span class="log-roll">{{ b.ourRoll }} : {{ b.enemyRoll }}</span>
        <span class="log-ts">{{ fmtTs(b.ts) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { TERRITORIES, TIER_META, computePartyPower } from '../data/territories'
import { findHero } from '../data/heroes'
import { detectBonds, combinePowerMul } from '../data/bonds'
import { FACTIONS } from '../data/factions'
import AppIcon from '../components/AppIcon.vue'
import ChinaMap from '../components/ChinaMap.vue'
import { heroImage, hasLocalAsset } from '../utils/aiImage.js'

const game = useGameStore()
const route = useRoute()

const targetId = ref('')
const selectedHeroes = ref([])
const lastResult = ref(null)
const visibleRoundCount = ref(0)
let roundTimer = null
const toast = ref(null)
let toastTimer = null
const now = ref(Date.now())
let nowTimer = null

const visibleRounds = computed(() => {
  if (!lastResult.value || !lastResult.value.rounds) return []
  return lastResult.value.rounds.slice(0, visibleRoundCount.value)
})

function startRoundsAnimation() {
  if (roundTimer) clearInterval(roundTimer)
  visibleRoundCount.value = 0
  if (!lastResult.value || !lastResult.value.rounds) return
  const total = lastResult.value.rounds.length
  roundTimer = setInterval(() => {
    if (!lastResult.value) { clearInterval(roundTimer); return }
    visibleRoundCount.value += 1
    if (visibleRoundCount.value >= total) {
      clearInterval(roundTimer)
      roundTimer = null
    }
  }, 600)
}

function skipRounds() {
  if (roundTimer) { clearInterval(roundTimer); roundTimer = null }
  if (lastResult.value && lastResult.value.rounds) {
    visibleRoundCount.value = lastResult.value.rounds.length
  }
}

onMounted(() => {
  // 支持 ?target=xxx 预选
  const q = route.query.target
  if (q && typeof q === 'string') {
    targetId.value = q
  }
  nowTimer = setInterval(() => (now.value = Date.now()), 1000)
})
onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
  if (toastTimer) clearTimeout(toastTimer)
  if (roundTimer) clearInterval(roundTimer)
})

const availableList = computed(() => {
  return TERRITORIES.filter((t) => !game.territories.includes(t.id))
    .map((t) => {
      const cd = game.territoryCooldown[t.id] || 0
      const cooling = cd > now.value ? Math.ceil((cd - now.value) / 1000) : 0
      // 世界局势：当前占据者 & 动态战力（盖过静态值）
      const cell = game.world?.[t.id]
      const ownerKey = cell?.owner || 'bandits'
      const ownerObj = FACTIONS[ownerKey] || FACTIONS.bandits
      const livePower = cell?.power ?? t.power
      const defenderLabel = ownerKey === 'bandits' ? t.defender : `${ownerObj.name} 部`
      return {
        ...t,
        cooling,
        tierMeta: TIER_META[t.tier] || TIER_META[1],
        power: livePower,
        defender: defenderLabel,
        ownerKey,
        ownerName: ownerObj.shortName,
        ownerColor: ownerObj.color
      }
    })
    .sort((a, b) => a.tier - b.tier || a.power - b.power)
})

const target = computed(() => availableList.value.find((t) => t.id === targetId.value) || null)

const heroOptions = computed(() =>
  game.heroes.map((h) => ({ ...h, meta: findHero(h.id) || { avatar: '👤', name: h.id, stats: {} } }))
)

const ourPower = computed(() => {
  const party = selectedHeroes.value.map((id) => {
    const h = game.heroes.find((x) => x.id === id)
    return h ? { ...h, meta: findHero(h.id) } : null
  }).filter(Boolean)
  const base = computePartyPower(party)
  const specMul = game.specEffects.powerMul || 1
  const seasonMul = game.currentSeason?.powerMul || 1
  return Math.round(base * partyBondMul.value * specMul * seasonMul)
})

const partyBonds = computed(() => detectBonds(selectedHeroes.value))
const partyBondMul = computed(() => combinePowerMul(partyBonds.value))

const winChanceLabel = computed(() => {
  if (!target.value || ourPower.value === 0) return '请选武将'
  const ratio = ourPower.value / target.value.power
  if (ratio >= 1.5) return '稳操胜券'
  if (ratio >= 1.15) return '胜算颇大'
  if (ratio >= 0.95) return '势均力敌'
  if (ratio >= 0.7) return '凶多吉少'
  return '九死一生'
})

const canBattle = computed(() => {
  if (!target.value) return false
  if (target.value.cooling > 0) return false
  if (selectedHeroes.value.length === 0) return false
  const c = target.value.cost
  if (game.resources.soldier < c.soldier) return false
  if (game.resources.grain < c.grain) return false
  if (game.ap.cur < c.ap) return false
  return true
})

const battleBtnLabel = computed(() => {
  if (!target.value) return '请选目标'
  if (target.value.cooling > 0) return `冷却中 ${target.value.cooling}s`
  if (selectedHeroes.value.length === 0) return '请选武将'
  const c = target.value.cost
  if (game.resources.soldier < c.soldier) return `兵力不足（${Math.floor(game.resources.soldier)}/${c.soldier}）`
  if (game.resources.grain < c.grain) return `粮草不足（${Math.floor(game.resources.grain)}/${c.grain}）`
  if (game.ap.cur < c.ap) return `精力不足（${Math.floor(game.ap.cur)}/${c.ap}）`
  return '出 征'
})

function selectTarget(id) { targetId.value = id }
function onMapPick(t) {
  if (!t) return
  if (game.territories.includes(t.id)) return
  selectTarget(t.id)
}
function toggleHero(id) {
  const i = selectedHeroes.value.indexOf(id)
  if (i >= 0) selectedHeroes.value.splice(i, 1)
  else if (selectedHeroes.value.length < 3) selectedHeroes.value.push(id)
  else showToast('最多 3 将出征', 'err')
}
function onBattle() {
  const res = game.battle(targetId.value, [...selectedHeroes.value])
  if (!res.ok) {
    showToast(res.reason, 'err')
    return
  }
  lastResult.value = res.result
  startRoundsAnimation()
  if (res.result.win) {
    selectedHeroes.value = []
    targetId.value = ''
  }
}
function showToast(msg, type = 'ok') {
  toast.value = { msg, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 1500)
}
function fmtTs(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.battle-view {
  /* 由 .app-main 统一滚动，本页不再自滚（避免双层 overflow 卡顿） */
}
.map-wrap {
  width: 100%;
}
.sel-ctx {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  margin-top: 6px;
  overflow: hidden;
  white-space: nowrap;
}
.sel-ctx .t-name {
  flex: 0 0 auto;
  font-size: 12px;
}
.sel-ctx .tier-tag { flex: 0 0 auto; }
.sel-ctx .ctx-item {
  font-size: 11px;
  color: var(--c-gold-light);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}
.sel-ctx .ctx-item b { color: #ff8a78; }
.sel-ctx .ctx-desc {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: .7;
  font-size: 10px;
}
.sel-ctx .cd-inline {
  color: #ff8a78;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 4px;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 4px;
  color: var(--c-gold-light);
  border-bottom: 1px dashed rgba(232, 196, 104, .55);
  padding-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.section-title .hint {
  font-size: 11px;
  color: var(--c-gold);
  letter-spacing: 1px;
  font-family: var(--font-num);
}

.empty-state {
  text-align: center;
  padding: 16px;
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .55);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 18px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703,
    0 4px 10px rgba(0, 0, 0, .55);
  border-radius: 2px;
}
.empty-title {
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 3px;
  color: var(--c-gold-light);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.empty-hint {
  font-size: 11px;
  color: var(--c-gold-light);
  opacity: .7;
  letter-spacing: 1px;
}

.target-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.t-card {
  position: relative;
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .55);
  padding: 6px 8px;
  cursor: pointer;
  transition: all .15s;
  color: var(--c-gold-light);
  border-radius: 2px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 14px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703,
    0 3px 8px rgba(0, 0, 0, .5);
}
.t-card:hover {
  transform: translateY(-1px);
  border-color: var(--c-gold);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .18),
    0 0 10px rgba(232, 196, 104, .45),
    0 4px 10px rgba(0, 0, 0, .55);
}
.t-card.active {
  border-color: var(--c-gold);
  background:
    linear-gradient(180deg, rgba(80, 48, 18, .92), rgba(35, 18, 8, .95));
  box-shadow:
    0 0 14px rgba(232, 196, 104, .75),
    inset 0 0 0 1px rgba(255, 240, 200, .35),
    inset 0 0 18px rgba(0, 0, 0, .5);
}
.t-card.cooling { opacity: .55; }
.t-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}
.t-name {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 1px;
  color: var(--c-gold-light);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.tier-tag {
  font-family: var(--font-title);
  font-size: 10px;
  color: #fff1c2;
  padding: 0 5px;
  border: 1px solid rgba(0, 0, 0, .55);
  box-shadow: inset 0 0 0 1px rgba(255, 240, 200, .25);
  letter-spacing: 1px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, .7);
}
.owner-tag {
  font-family: var(--font-title);
  font-size: 10px;
  padding: 0 5px;
  border: 1px solid;
  border-left-width: 3px;
  border-radius: 2px;
  background: rgba(20, 10, 4, .65);
  letter-spacing: 1px;
  cursor: help;
}
.t-desc {
  font-size: 10px;
  color: rgba(255, 240, 200, .65);
  margin-bottom: 3px;
  line-height: 1.3;
  min-height: 26px;
}
.t-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--c-gold-light);
}
.t-meta .cost-line {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.t-meta b { color: #ff8a78; }
.cd {
  margin-top: 3px;
  font-size: 10px;
  color: #ff8a78;
  text-align: center;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .8);
}

.hero-pick {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}
.pick-card {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 5px;
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .55);
  cursor: pointer;
  color: var(--c-gold-light);
  border-radius: 2px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 14px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703,
    0 3px 8px rgba(0, 0, 0, .5);
  transition: all .15s;
}
.pick-card:hover {
  transform: translateY(-1px);
  border-color: var(--c-gold);
}
.pick-card.on {
  border-color: var(--c-red);
  background:
    linear-gradient(180deg, rgba(168, 35, 26, .45), rgba(60, 18, 12, .92));
  box-shadow:
    0 0 12px rgba(168, 35, 26, .65),
    inset 0 0 0 1px rgba(255, 240, 200, .25),
    inset 0 0 18px rgba(0, 0, 0, .5);
}
.pick-avatar {
  width: 36px; height: 36px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle, rgba(232, 196, 104, .55), rgba(232, 196, 104, 0) 70%),
    #1a0e07;
  border: 1px solid var(--c-gold);
  color: var(--c-gold-light);
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  filter: drop-shadow(0 0 4px rgba(232, 196, 104, .45));
}
.pick-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  border-radius: 50%;
  display: block;
}
.pick-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.pick-info { flex: 1; min-width: 0; }
.pick-name {
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 700;
  color: var(--c-gold-light);
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.pick-name .lv {
  font-size: 10px;
  color: var(--c-gold);
  margin-left: 3px;
  font-family: var(--font-num);
}
.pick-stat {
  font-size: 10px;
  color: rgba(255, 240, 200, .65);
}
.pick-mark {
  font-family: var(--font-title);
  font-size: 16px;
  color: var(--c-gold-light);
  width: 16px;
  text-align: center;
  text-shadow: 0 0 6px rgba(232, 196, 104, .8);
}

/* 羁绊触发提示 */
.bond-fire {
  margin: 8px 0 4px;
  padding: 6px 10px;
  background:
    linear-gradient(180deg, rgba(168, 35, 26, .42), rgba(60, 18, 12, .85));
  border: 1px solid var(--c-red);
  border-radius: 2px;
  box-shadow:
    0 0 14px rgba(212, 175, 55, .35),
    inset 0 0 0 1px rgba(255, 240, 200, .25),
    inset 0 0 14px rgba(0, 0, 0, .45);
}
.fire-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 5px;
  color: var(--c-gold-light);
  text-align: center;
  text-shadow: 0 0 8px rgba(212, 175, 55, .75), 0 1px 2px rgba(0, 0, 0, .85);
  margin-bottom: 4px;
}
.fire-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  padding: 1px 0;
}
.fire-name {
  font-family: var(--font-title);
  color: var(--c-gold-light);
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.fire-num {
  font-family: var(--font-num);
  color: #ffd86b;
  font-weight: 700;
  text-shadow: 0 0 6px rgba(212, 175, 55, .65);
}
.fire-total {
  text-align: center;
  font-size: 11px;
  color: var(--c-gold-light);
  border-top: 1px dashed rgba(232, 196, 104, .55);
  padding-top: 3px;
  margin-top: 3px;
}
.fire-total b {
  color: #ffd86b;
  font-family: var(--font-num);
  font-size: 13px;
  text-shadow: 0 0 6px rgba(212, 175, 55, .65);
}

.bond-fire-hint {
  text-align: center;
  font-size: 10px;
  color: var(--c-gold-light);
  opacity: .75;
  letter-spacing: 1px;
  margin: 6px 0 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}

.report-bond {
  color: #ffd86b;
  font-family: var(--font-title);
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 0 6px rgba(212, 175, 55, .55);
}

.vs-card {
  margin-top: 6px;
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .55);
  padding: 6px 8px;
  border-radius: 2px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 18px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703,
    0 4px 10px rgba(0, 0, 0, .55);
}
.vs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.vs-side {
  flex: 1;
  text-align: center;
  padding: 4px 4px;
  background: rgba(0, 0, 0, .35);
  border: 1px solid rgba(232, 196, 104, .4);
  border-radius: 2px;
}
.vs-side.enemy {
  background: rgba(168, 35, 26, .25);
  border-color: var(--c-red);
}
.vs-label {
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--c-gold-light);
  opacity: .8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.vs-num {
  font-size: 18px;
  color: var(--c-gold-light);
  margin: 2px 0;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(212, 175, 55, .55), 0 1px 2px rgba(0, 0, 0, .85);
}
.vs-side.enemy .vs-num {
  color: #ff8a78;
  text-shadow: 0 0 8px rgba(168, 35, 26, .55), 0 1px 2px rgba(0, 0, 0, .85);
}
.vs-sub {
  font-size: 11px;
  color: var(--c-gold-light);
  opacity: .75;
}
.vs-mid {
  font-family: var(--font-title);
  font-size: 18px;
  letter-spacing: 4px;
  color: #ffd86b;
  padding: 0 8px;
  text-shadow: 0 0 8px rgba(212, 175, 55, .7), 0 1px 2px rgba(0, 0, 0, .8);
}
.go-btn {
  width: 100%;
  font-size: 13px;
  letter-spacing: 6px;
  padding: 5px;
}

.log-list { display: flex; flex-direction: column; gap: 3px; }
.log-item {
  display: grid;
  grid-template-columns: 16px 1fr auto auto;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  padding: 4px 6px;
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .35);
  border-left: 3px solid var(--c-muted);
  color: var(--c-gold-light);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(255, 240, 200, .08), 0 2px 4px rgba(0, 0, 0, .4);
}
.log-item.win { border-left-color: #b3e5a3; }
.log-item.lose { border-left-color: var(--c-red); }
.log-icon {
  text-align: center;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.log-item.win .log-icon { color: #b3e5a3; }
.log-item.lose .log-icon { color: #ff8a78; }
.log-name {
  font-family: var(--font-title);
  color: var(--c-gold-light);
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.log-roll {
  color: var(--c-gold);
  font-family: var(--font-num);
}
.log-ts {
  color: var(--c-gold-light);
  opacity: .65;
  font-family: var(--font-num);
  font-size: 10px;
}

/* 战报弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal.report {
  width: 280px;
  background: var(--panel-bg-deep-strong);
  border: 2px solid rgba(232, 196, 104, .75);
  padding: 18px 16px;
  text-align: center;
  color: var(--c-gold-light);
  border-radius: 2px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .25),
    inset 0 0 22px rgba(0, 0, 0, .65),
    0 0 26px rgba(232, 196, 104, .55),
    0 8px 22px rgba(0, 0, 0, .7);
}
.modal.report.win { border-color: #ffd86b; }
.modal.report.lose {
  border-color: var(--c-red);
  background:
    linear-gradient(180deg, rgba(60, 18, 12, .96), rgba(20, 6, 4, .98));
}
.report-title {
  font-family: var(--font-title);
  font-size: 22px;
  letter-spacing: 6px;
  color: #ffd86b;
  margin-bottom: 8px;
  text-shadow: 0 0 10px rgba(212, 175, 55, .85), 0 1px 2px rgba(0, 0, 0, .85);
}
.modal.report.lose .report-title {
  color: #ff8a78;
  text-shadow: 0 0 10px rgba(168, 35, 26, .75), 0 1px 2px rgba(0, 0, 0, .85);
}
.report-line {
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 3px;
  color: var(--c-gold-light);
  border-top: 1px dashed rgba(232, 196, 104, .55);
  border-bottom: 1px dashed rgba(232, 196, 104, .55);
  padding: 6px 0;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.report-roll {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--c-gold-light);
}
.report-roll b {
  font-size: 18px;
  color: #ffd86b;
  margin: 0 3px;
  text-shadow: 0 0 6px rgba(212, 175, 55, .65);
}
.report-roll .vs-min {
  margin: 0 6px;
  color: var(--c-gold);
  opacity: .8;
  font-size: 11px;
}
.rounds-stage {
  position: relative;
  margin: 10px auto 6px;
  padding: 8px 10px 8px 12px;
  width: 90%;
  min-height: 60px;
  text-align: left;
  background: linear-gradient(180deg, rgba(20, 10, 4, .85), rgba(40, 24, 14, .8));
  border: 1px solid rgba(232, 196, 104, .35);
  border-left: 3px solid rgba(232, 196, 104, .6);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.4);
}
.rounds-wrap { display: flex; flex-direction: column; gap: 3px; }
.round-line {
  font-size: 11px;
  line-height: 1.5;
  color: var(--c-paper);
  display: flex;
  gap: 4px;
  align-items: flex-start;
}
.round-line .rl-dot { color: var(--c-gold); font-weight: 700; }
.round-line.side-us { color: #fff1c2; }
.round-line.side-us .rl-dot { color: #e9b14a; }
.round-line.side-enemy { color: #f3b9a8; }
.round-line.side-enemy .rl-dot { color: #a83a2e; }
.round-line.side-season { color: #c4d8a3; font-style: italic; }
.round-line.side-season .rl-dot { color: #86c46b; }
.round-line.side-result {
  margin-top: 2px;
  padding-top: 3px;
  border-top: 1px dashed rgba(232, 196, 104, .35);
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: .06em;
  color: var(--c-gold);
}
.round-line.side-result .rl-dot { display: none; }
.round-enter-active { transition: opacity .35s ease, transform .35s ease; }
.round-enter-from { opacity: 0; transform: translateY(-4px); }
.skip-btn {
  position: absolute;
  top: 4px;
  right: 6px;
  background: transparent;
  border: 1px solid rgba(232, 196, 104, .4);
  color: var(--c-paper-dark);
  font-size: 9px;
  padding: 1px 6px;
  cursor: pointer;
  letter-spacing: .08em;
}
.skip-btn:hover { color: var(--c-gold); border-color: var(--c-gold); }
.report-detail {
  font-size: 11px;
  color: var(--c-gold-light);
  text-align: left;
  background: rgba(0, 0, 0, .4);
  padding: 6px 8px;
  border: 1px dashed rgba(232, 196, 104, .45);
  margin-bottom: 10px;
  line-height: 1.6;
  border-radius: 2px;
}
.report-detail span {
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.report-detail .reward-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

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
  border: 1px solid rgba(232, 196, 104, .75);
  background:
    linear-gradient(180deg, rgba(40, 22, 10, .95), rgba(20, 10, 4, .98));
  color: var(--c-gold-light);
  border-radius: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .2),
    0 0 14px rgba(232, 196, 104, .55),
    0 4px 12px rgba(0, 0, 0, .55);
}
.toast.err {
  background:
    linear-gradient(180deg, rgba(60, 18, 12, .95), rgba(20, 6, 4, .98));
  border-color: var(--c-red);
  color: #ffd0c8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
  box-shadow:
    inset 0 0 0 1px rgba(255, 200, 180, .2),
    0 0 14px rgba(168, 35, 26, .55),
    0 4px 12px rgba(0, 0, 0, .55);
}
.flash-enter-active, .flash-leave-active { transition: opacity .25s, transform .25s; }
.flash-enter-from { opacity: 0; transform: translate(-50%, -8px); }
.flash-leave-to   { opacity: 0; transform: translate(-50%, -8px); }
</style>
