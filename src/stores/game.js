import { defineStore } from 'pinia'
import { saveToLocal, scheduleSave, flushSave, loadFromLocal, exportCode, importCode } from '../systems/saveSystem'
import BUILDINGS, { BUILDING_MAP, computeBaseRates, canUpgrade } from '../data/buildings.js'
import { rollHeroes, recruitCostOf, findHero, TASKS } from '../data/heroes.js'
import { TERRITORY_MAP, BATTLE_COOLDOWN_SEC, computePartyPower, resolveBattle } from '../data/territories.js'
import { detectBonds, combinePowerMul, combineRateBonus } from '../data/bonds.js'
import { SPECIALIZATION_MAP, aggregateSpecEffects, nextStageCost } from '../data/specializations.js'
import { rollEvent, EVENT_MAP } from '../data/events.js'
import { SEASONS, seasonOfElapsed, seasonProgressOfElapsed, yearOfElapsed, dayOfElapsed, buffSummary } from '../data/season.js'
import { FACTIONS, INITIAL_WORLD, FACTION_AI, ownerOf, factionOf, neighborsOf } from '../data/factions.js'

/** 客栈刷新铜钱花费、招募名额计算 */
const TAVERN_REFRESH_COIN = 80
function heroCapOf(innLv) { return 2 + Math.max(0, innLv) }   // 客栈 Lv0 时只能带 2 个
function heroExpToNext(level) { return 50 * level * level }   // Lv1→2 需要50

const TICK_MS = 1000
const OFFLINE_CAP_HOURS = 24
const OFFLINE_DECAY_AFTER_HOURS = 8

/** 精力（行动力）：上限100，每30秒恢复1点；不强制阻挡，只影响"主动操作"的收益 */
const AP_MAX = 100
const AP_REGEN_SEC = 30          // 每多少秒恢复1点
const AP_REGEN_AMOUNT = 1

/** 税率配置 */
const TAX_TABLE = {
  light:  { label: '轻税', coinMul: 0.7, moralePerMin:  0.5, tip: '商贾感恩，民心日增，但国库收入减少' },
  normal: { label: '常税', coinMul: 1.0, moralePerMin:  0.05, tip: '中庸之道，民心略增' },
  heavy:  { label: '重税', coinMul: 1.5, moralePerMin: -0.6, tip: '强征赋税，国库充盈，但民心流失' }
}

/** 事件触发节奏：常规间隔随机 6~14 分钟，加入概率门让"到时间"不必然弹窗 */
const EVENT_MIN_SEC = 6 * 60
const EVENT_MAX_SEC = 14 * 60
/** 进入游戏后首次事件的延迟窗口：8~15 分钟随机，避免一进来就弹 */
const EVENT_FIRST_MIN_SEC = 8 * 60
const EVENT_FIRST_MAX_SEC = 15 * 60
/** 时间窗口到达时，本次实际触发的概率（剩余概率推迟） */
const EVENT_FIRE_CHANCE = 0.65
/** 未命中概率门时，向后推迟的范围（秒） */
const EVENT_RETRY_MIN_SEC = 60
const EVENT_RETRY_MAX_SEC = 180
/** 离线超过该时长后，重载时不立即触发，重新摇骰一个首次窗口 */
const EVENT_STALE_SEC = 30 * 60

/** 生成新档首次事件触发时间戳 */
function rollFirstEventAt() {
  const sec = EVENT_FIRST_MIN_SEC + Math.random() * (EVENT_FIRST_MAX_SEC - EVENT_FIRST_MIN_SEC)
  return Date.now() + sec * 1000
}

function createInitialState() {
  return {
    meta: {
      lordName: '主公',
      createdAt: Date.now(),
      lastTick: Date.now(),
      seasonDay: 1,
      season: 'spring',
      playSec: 0
    },
    resources: {
      grain: 500,
      coin: 500,
      wood: 200,
      soldier: 100,
      reputation: 0,
      jadeShard: 0
    },
    /** 精力 */
    ap: {
      cur: AP_MAX,
      max: AP_MAX,
      _carry: 0   // 用于亚秒恢复累计
    },
    city: {
      lordHall: 1,
      farm: 1,
      market: 1,
      lumber: 1,
      barrack: 0,
      academy: 0,
      inn: 0,
      strategist: 0,
      workshop: 0
    },
    /** 建造队列 [{ key, startAt, doneAt }] 同时最多 parallelBuildCap 条 */
    buildQueue: [],
    /** 驻守表 { buildingKey: [heroId, ...] } */
    garrison: {},
    /** 主动操作冷却 { "buildKey:actionKey": expireTs } */
    actionCooldown: {},
    /** 治理参数（0~100） */
    governance: {
      tech: 10,
      culture: 20,
      security: 60,
      commerce: 30
    },
    policy: {
      tax: 'normal',
      morale: 80,
      population: 1000
    },
    heroes: [],
    /** 客栈候选池（最多3张） */
    heroRoster: [],
    /** 客栈最近一次刷新时间戳 */
    tavernLastRollAt: 0,
    territories: ['luoyang'],
    /** 战败州郡的冷却到期时间戳 { [id]: ts } */
    territoryCooldown: {},
    /** 世界局势：各州当前占据势力 + 实时战力 */
    world: JSON.parse(JSON.stringify(INITIAL_WORLD)),
    /** 世界时钟下一次推进时间戳 */
    worldNextAt: Date.now() + 45 * 1000,
    /** 最近世界大事（NPC 互相攻伐），最多 8 条 */
    worldLog: [],
    /** 结局触发状态：{ hegemony: bool, unify: bool } —— 一局只播一次 */
    ending: { hegemony: false, unify: false },
    /** 待展示的结局画卷类型（'hegemony' / 'unify' / null） */
    pendingEnding: null,
    /** 最近战报，最多保留 12 条 */
    battleLog: [],
    /** 主公专精流派：key + stage(已修阶数 0~5) */
    specialization: { key: null, stage: 0 },
    /** 事件系统：下一次事件触发时间戳、当前待处理事件、史册记录 */
    eventNextAt: rollFirstEventAt(),
    pendingEvent: null,
    chronicle: [],
    achievements: [],
    flags: {
      tutorialDone: false,
      stratagemUntil: 0
    }
  }
}

export const useGameStore = defineStore('game', {
  state: () => createInitialState(),

  getters: {
    /** 当前税率配置 */
    taxConf(state) {
      return TAX_TABLE[state.policy.tax] || TAX_TABLE.normal
    },
    /** 民心倍率（影响所有非铜钱产出） */
    moraleFactor(state) {
      return 0.5 + state.policy.morale / 200    // 80民心 = 0.9，100民心 = 1.0
    },
    /** 基础产出（来自建筑 + 驻守加成） */
    baseRates(state) {
      return computeBaseRates(state.city, state.garrison, findHero)
    },
    /** 治理参数衍生倍率（科技/文化/商业等） */
    governanceMul(state) {
      const g = state.governance || {}
      // 科技每 10 点 → +1% 全资源；商业每 10 点 → +1.5% 铜钱；文化每 10 点 → +0.5% 全资源
      const techMul = 1 + (g.tech || 0) * 0.001
      const cultureMul = 1 + (g.culture || 0) * 0.0005
      const commerceMul = 1 + (g.commerce || 0) * 0.0015
      return {
        grain: techMul * cultureMul,
        coin: techMul * cultureMul * commerceMul,
        wood: techMul * cultureMul,
        soldier: techMul * cultureMul
      }
    },
    /** 实际产出（已叠加民心 + 税率 + 武将任务 + 领地特产 + 麾下羁绊 + 专精流派 + 治理 + 季节） */
    rates(state) {
      const base = computeBaseRates(state.city, state.garrison, findHero)
      const m = 0.5 + state.policy.morale / 200
      const coinMul = (TAX_TABLE[state.policy.tax] || TAX_TABLE.normal).coinMul
      const taskAdd = this.heroTaskRates
      const terrAdd = this.territoryRates
      const bondAdd = this.bondRosterRates
      const spec = this.specEffects
      const sm = spec.rateMul
      const gv = this.governanceMul
      const ss = this.currentSeason.rates
      return {
        grain: round1((base.grain * m + taskAdd.grain + terrAdd.grain + bondAdd.grain) * sm.grain * gv.grain * ss.grain),
        coin: round1((base.coin * m * coinMul + taskAdd.coin + terrAdd.coin + bondAdd.coin) * sm.coin * gv.coin * ss.coin),
        wood: round1((base.wood * m + taskAdd.wood + terrAdd.wood + bondAdd.wood) * sm.wood * gv.wood * ss.wood),
        soldier: round1((base.soldier * m + taskAdd.soldier + terrAdd.soldier + bondAdd.soldier) * sm.soldier * gv.soldier * ss.soldier)
      }
    },
    /** 当前季节对象（含 label/color/rates/powerMul/eventBias） */
    currentSeason(state) {
      return seasonOfElapsed(state.meta.playSec || 0)
    },
    /** 当前季节内进度 0~1（用于 HUD 进度条） */
    seasonProgress(state) {
      return seasonProgressOfElapsed(state.meta.playSec || 0)
    },
    /** 当前年份（184 起） */
    currentYear(state) {
      return yearOfElapsed(state.meta.playSec || 0)
    },
    /** 当前季节第 X 日（1~30） */
    currentSeasonDay(state) {
      return dayOfElapsed(state.meta.playSec || 0)
    },
    /** 当前季节 buff 摘要字符串 */
    seasonBuffText() {
      return buffSummary(this.currentSeason) || '无加成'
    },
    /** 已占领州郡的特产产出总和（每秒） */
    territoryRates(state) {
      const out = { grain: 0, coin: 0, wood: 0, soldier: 0 }
      for (const id of state.territories) {
        const t = TERRITORY_MAP[id]
        if (!t || !t.special) continue
        for (const k of Object.keys(out)) {
          if (t.special[k]) out[k] += t.special[k]
        }
      }
      return {
        grain: round1(out.grain),
        coin: round1(out.coin),
        wood: round1(out.wood),
        soldier: round1(out.soldier)
      }
    },
    /** 武将任务总产出（每秒） */
    heroTaskRates(state) {
      const out = { grain: 0, coin: 0, wood: 0, soldier: 0 }
      for (const h of state.heroes) {
        if (!h.task) continue
        const t = TASKS[h.task]
        if (!t) continue
        const lv = h.level || 1
        const meta = findHero(h.id)
        const skill = meta?.skill?.taskBonus || {}
        let mul = skill[t.resKey] || 1
        if (skill._all) mul *= skill._all
        const gain = t.baseGain * (1 + (lv - 1) * 0.1) * mul
        out[t.resKey] += gain
      }
      return {
        grain: round1(out.grain),
        coin: round1(out.coin),
        wood: round1(out.wood),
        soldier: round1(out.soldier)
      }
    },
    /** 招募名额上限（受客栈等级 + 集贤馆专精影响） */
    heroCap(state) {
      const innBonus = state.city.inn || 0
      const specBonus = this.specEffects.heroCapBonus || 0
      return 2 + Math.max(0, innBonus) + specBonus
    },
    totalPower(state) {
      return state.heroes.reduce((sum, h) => {
        const meta = findHero(h.id) || {}
        const s = meta.stats || { wu: 0, wen: 0, tong: 0 }
        const lvMul = 1 + ((h.level || 1) - 1) * 0.15
        return sum + Math.round((s.wu + s.wen + s.tong) * lvMul)
      }, 0)
    },
    resourceList(state) {
      const r = this.rates
      return [
        { key: 'grain',   label: '粮草', iconKind: 'res', iconId: 'grain',   value: state.resources.grain,   rate: r.grain },
        { key: 'coin',    label: '铜钱', iconKind: 'res', iconId: 'coin',    value: state.resources.coin,    rate: r.coin },
        { key: 'wood',    label: '木材', iconKind: 'res', iconId: 'wood',    value: state.resources.wood,    rate: r.wood },
        { key: 'soldier', label: '兵力', iconKind: 'res', iconId: 'soldier', value: state.resources.soldier, rate: r.soldier }
      ]
    },
    /** 升级预览：返回某建筑下一级的消耗与产出差异 */
    upgradePreview() {
      return (key) => {
        const cfg = BUILDING_MAP[key]
        if (!cfg) return null
        const cur = this.city[key] || 0
        const next = cur + 1
        const cost = cfg.cost(cur)
        const curProd = cfg.produce(cur)
        const nextProd = cfg.produce(next)
        const diff = {}
        const allKeys = new Set([...Object.keys(curProd), ...Object.keys(nextProd)])
        for (const k of allKeys) {
          diff[k] = (nextProd[k] || 0) - (curProd[k] || 0)
        }
        const status = canUpgrade(key, this.city)
        return { cost, diff, status, next }
      }
    },
    /** 当前精力档位（用于显示降效提示） */
    apTier(state) {
      const p = state.ap.cur / state.ap.max
      if (p >= 0.7) return { label: '精神饱满', mul: 1.0, color: '#4d7a4c' }
      if (p >= 0.3) return { label: '略有疲劳', mul: 0.7, color: '#b8862e' }
      return { label: '疲惫不堪', mul: 0.3, color: '#a8231a' }
    },
    /** 麾下已激活的羁绊（基于全体武将） */
    activeBonds(state) {
      return detectBonds(state.heroes.map((h) => h.id))
    },
    /** 麾下羁绊带来的常驻速率加成 */
    bondRosterRates() {
      return combineRateBonus(this.activeBonds)
    },
    /** 麾下羁绊带来的全局战力倍率（出征前显示用，实际生效在 battle action 内重算） */
    bondRosterPowerMul() {
      return combinePowerMul(this.activeBonds)
    },
    /** 当前专精流派叠加的综合效果 */
    specEffects(state) {
      const { key, stage } = state.specialization || {}
      return aggregateSpecEffects(key, stage)
    },
    /** 已选专精的展示信息 */
    specInfo(state) {
      const { key, stage } = state.specialization || {}
      if (!key) return null
      const cfg = SPECIALIZATION_MAP[key]
      if (!cfg) return null
      const next = nextStageCost(key, stage)
      return {
        cfg,
        key,
        stage,
        stages: cfg.stages,
        next,
        completed: stage >= cfg.stages.length
      }
    },
    /** 并行建造上限：主公府 Lv决定（Lv1=1, Lv4=2, Lv7=3） */
    parallelBuildCap(state) {
      const l = state.city.lordHall || 1
      if (l >= 7) return 3
      if (l >= 4) return 2
      return 1
    },
    /** 当前建造队列里某建筑的剩余秒数（无返回 -1） */
    buildRemainOf(state) {
      return (key) => {
        const item = state.buildQueue.find((q) => q.key === key)
        if (!item) return -1
        return Math.max(0, Math.ceil((item.doneAt - Date.now()) / 1000))
      }
    },
    /** 武将是否正在驻守某建筑（返回建筑key） */
    heroGarrisonOf(state) {
      return (heroId) => {
        for (const k in state.garrison) {
          if (state.garrison[k] && state.garrison[k].includes(heroId)) return k
        }
        return null
      }
    },
    /** 当前在驻守的武将ID集合 */
    garrisonedHeroIds(state) {
      const out = new Set()
      for (const k in state.garrison) {
        for (const id of state.garrison[k] || []) out.add(id)
      }
      return out
    },
    /** 操作冷却剩余秒（无则0） */
    actionRemainOf(state) {
      return (buildingKey, actionKey) => {
        const k = `${buildingKey}:${actionKey}`
        const t = state.actionCooldown[k] || 0
        if (t <= Date.now()) return 0
        return Math.ceil((t - Date.now()) / 1000)
      }
    },
    /** 治理指标展示信息 */
    governanceList(state) {
      const g = state.governance || {}
      return [
        { key: 'tech',     label: '科技', iconKind: 'gov', iconId: 'tech',     value: Math.round(g.tech || 0),     color: '#4a90e2' },
        { key: 'culture',  label: '文化', iconKind: 'gov', iconId: 'culture',  value: Math.round(g.culture || 0),  color: '#a35be5' },
        { key: 'security', label: '治安', iconKind: 'gov', iconId: 'security', value: Math.round(g.security || 0), color: '#4d7a4c' },
        { key: 'commerce', label: '商业', iconKind: 'gov', iconId: 'commerce', value: Math.round(g.commerce || 0), color: '#b8862e' }
      ]
    }
  },

  actions: {
    resetGame() {
      Object.assign(this, createInitialState())
      this.saveToLocalSync()
    },

    /** 每秒 tick：增加资源、恢复精力、税率影响民心、推进建造队列、检查事件触发 */
    applyTick(seconds = 1) {
      // 累计游戏时长 & 季节切换检测
      const prevSeasonKey = this.currentSeason.key
      this.meta.playSec = (this.meta.playSec || 0) + seconds
      const curSeason = this.currentSeason
      if (curSeason.key !== prevSeasonKey) {
        this.meta.season = curSeason.key
        this._onSeasonChange(prevSeasonKey, curSeason)
      }

      const r = this.rates
      this.resources.grain   = Math.max(0, this.resources.grain   + r.grain   * seconds)
      this.resources.coin    = Math.max(0, this.resources.coin    + r.coin    * seconds)
      this.resources.wood    = Math.max(0, this.resources.wood    + r.wood    * seconds)
      this.resources.soldier = Math.max(0, this.resources.soldier + r.soldier * seconds)

      const spec = this.specEffects

      // 精力恢复（亚秒累计，受集贤馆 apRegenMul 影响）
      const apRegenMul = spec.apRegenMul || 1
      this.ap._carry = (this.ap._carry || 0) + seconds * apRegenMul
      while (this.ap._carry >= AP_REGEN_SEC) {
        this.ap._carry -= AP_REGEN_SEC
        if (this.ap.cur < this.ap.max) this.ap.cur += AP_REGEN_AMOUNT
      }
      if (this.ap.cur > this.ap.max) this.ap.cur = this.ap.max

      // 民心变化（按税率每分钟），叠加议政殿专精提供的稳态民心保底
      const conf = TAX_TABLE[this.policy.tax] || TAX_TABLE.normal
      this.policy.morale = clamp(this.policy.morale + (conf.moralePerMin / 60) * seconds, 0, 100)
      if (spec.moraleBonus && this.policy.morale < 100) {
        const target = 80 + spec.moraleBonus
        if (this.policy.morale < target) {
          this.policy.morale = clamp(this.policy.morale + 0.05 * seconds, 0, target)
        }
      }

      // 治理参数自然漂移：治安/文化每分钟略涨；商业受民心影响
      if (this.governance) {
        const dt = seconds / 60
        this.governance.security = clamp(this.governance.security + 0.2 * dt, 0, 100)
        this.governance.culture  = clamp(this.governance.culture  + 0.1 * dt, 0, 100)
        this.governance.commerce = clamp(this.governance.commerce + (this.policy.morale > 70 ? 0.2 : 0) * dt, 0, 100)
      }

      // 武将经验：有任务或驻守的每秒 +1 经验，受集贤馆 heroExpMul 加成
      const expMul = spec.heroExpMul || 1
      const garrisonSet = this.garrisonedHeroIds
      for (const h of this.heroes) {
        if (h.task || garrisonSet.has(h.id)) h.exp = (h.exp || 0) + seconds * expMul
      }

      // 检查建造队列完成
      this._checkBuildQueue()

      // 事件触发检查
      if (!this.pendingEvent && Date.now() >= (this.eventNextAt || 0)) {
        this._tryRollEvent()
      }

      // 世界时钟推进（NPC 势力扩张/互相攻伐）
      if (Date.now() >= (this.worldNextAt || 0)) {
        this._tickWorldClock()
      }

      this.meta.lastTick = Date.now()
    },

    startTick() {
      if (this._tickHandle) clearInterval(this._tickHandle)
      this._tickHandle = setInterval(() => this.applyTick(1), TICK_MS)
    },

    settleOffline() {
      const now = Date.now()
      const diffSec = Math.max(0, Math.floor((now - this.meta.lastTick) / 1000))
      if (diffSec < 30) return null
      const capSec = OFFLINE_CAP_HOURS * 3600
      const decayAfterSec = OFFLINE_DECAY_AFTER_HOURS * 3600
      const effectiveSec = Math.min(diffSec, capSec)
      let gainSec = effectiveSec
      if (effectiveSec > decayAfterSec) {
        gainSec = decayAfterSec + (effectiveSec - decayAfterSec) * 0.5
      }
      const r = this.rates
      const snapshot = {
        seconds: diffSec,
        grain: Math.floor(r.grain * gainSec),
        coin: Math.floor(r.coin * gainSec),
        wood: Math.floor(r.wood * gainSec)
      }
      this.resources.grain += snapshot.grain
      this.resources.coin += snapshot.coin
      this.resources.wood += snapshot.wood
      // 精力按离线时间补满
      this.ap.cur = this.ap.max
      this.meta.lastTick = now
      return snapshot
    },

    /** 启动建筑升级（进入建造队列） */
    startBuild(key) {
      const cfg = BUILDING_MAP[key]
      if (!cfg) return { ok: false, reason: '未知建筑' }
      if (this.buildQueue.find((q) => q.key === key)) {
        return { ok: false, reason: '该建筑已在建造中' }
      }
      if (this.buildQueue.length >= this.parallelBuildCap) {
        return { ok: false, reason: `建造名额已满（${this.buildQueue.length}/${this.parallelBuildCap}）` }
      }
      const check = canUpgrade(key, this.city)
      if (!check.ok) return check
      const lv = this.city[key] || 0
      const cost = cfg.cost(lv)
      for (const k in cost) {
        if ((this.resources[k] || 0) < cost[k]) {
          return { ok: false, reason: `资源不足：${labelOf(k)} 需 ${cost[k]}` }
        }
      }
      for (const k in cost) this.resources[k] -= cost[k]
      const now = Date.now()
      const sec = cfg.upgradeTimeSec(lv)
      this.buildQueue.push({
        key, startAt: now, doneAt: now + sec * 1000, totalSec: sec
      })
      this.saveToLocal()
      return { ok: true, doneAt: now + sec * 1000, totalSec: sec }
    },

    /** 急造：消耗 1 玉石碎片立即完成 */
    rushBuild(key) {
      const item = this.buildQueue.find((q) => q.key === key)
      if (!item) return { ok: false, reason: '未在建造' }
      if ((this.resources.jadeShard || 0) < 1) return { ok: false, reason: '需玉石碎片 1' }
      this.resources.jadeShard -= 1
      item.doneAt = Date.now() - 1
      this._checkBuildQueue()
      return { ok: true }
    },

    /** 取消建造（退还 50% 资源） */
    cancelBuild(key) {
      const idx = this.buildQueue.findIndex((q) => q.key === key)
      if (idx < 0) return { ok: false, reason: '未在建造' }
      const cfg = BUILDING_MAP[key]
      const lv = this.city[key] || 0
      const cost = cfg.cost(lv)
      for (const k in cost) {
        this.resources[k] = (this.resources[k] || 0) + Math.floor(cost[k] * 0.5)
      }
      this.buildQueue.splice(idx, 1)
      this.saveToLocal()
      return { ok: true }
    },

    /** 内部：检查并结算到期的建造 */
    _checkBuildQueue() {
      if (!this.buildQueue || !this.buildQueue.length) return
      const now = Date.now()
      const done = []
      this.buildQueue = this.buildQueue.filter((q) => {
        if (q.doneAt <= now) {
          done.push(q)
          return false
        }
        return true
      })
      for (const d of done) {
        this.city[d.key] = (this.city[d.key] || 0) + 1
        // 驻守超限时自动遣返（如等级下降不会发生，这里只为安全）
      }
      if (done.length) this.saveToLocal()
    },

    /** 派遣武将驻守建筑 */
    assignGarrison(buildingKey, heroId) {
      const cfg = BUILDING_MAP[buildingKey]
      if (!cfg) return { ok: false, reason: '未知建筑' }
      const lv = this.city[buildingKey] || 0
      const cap = cfg.garrisonCap ? cfg.garrisonCap(lv) : 0
      if (cap <= 0) return { ok: false, reason: '该建筑无驻守槽' }
      if (!this.garrison[buildingKey]) this.garrison[buildingKey] = []
      const list = this.garrison[buildingKey]
      if (list.includes(heroId)) return { ok: false, reason: '该武将已在此驻守' }
      if (list.length >= cap) return { ok: false, reason: `驻守已满（${cap}）` }
      // 武将不能既驻守又有任务
      const h = this.heroes.find((x) => x.id === heroId)
      if (!h) return { ok: false, reason: '武将不存在' }
      // 从其他建筑撤出
      for (const k in this.garrison) {
        const idx = this.garrison[k].indexOf(heroId)
        if (idx >= 0) this.garrison[k].splice(idx, 1)
      }
      // 自动卸任全局任务
      h.task = null
      list.push(heroId)
      this.saveToLocal()
      return { ok: true }
    },

    /** 撤回驻守武将 */
    unassignGarrison(buildingKey, heroId) {
      if (!this.garrison[buildingKey]) return { ok: false, reason: '未驻守' }
      const idx = this.garrison[buildingKey].indexOf(heroId)
      if (idx < 0) return { ok: false, reason: '未驻守' }
      this.garrison[buildingKey].splice(idx, 1)
      this.saveToLocal()
      return { ok: true }
    },

    /** 执行建筑主动操作 */
    runBuildingAction(buildingKey, actionKey) {
      const cfg = BUILDING_MAP[buildingKey]
      if (!cfg) return { ok: false, reason: '未知建筑' }
      const act = (cfg.actions || []).find((a) => a.key === actionKey)
      if (!act) return { ok: false, reason: '未知操作' }
      const cdKey = `${buildingKey}:${actionKey}`
      if ((this.actionCooldown[cdKey] || 0) > Date.now()) {
        return { ok: false, reason: `冷却中（${Math.ceil((this.actionCooldown[cdKey] - Date.now()) / 1000)}s）` }
      }
      if (this.ap.cur < (act.apCost || 0)) return { ok: false, reason: `精力不足（${act.apCost}）` }
      const lv = this.city[buildingKey] || 0
      const result = act.run(this, lv) || { ok: true }
      if (result.ok === false) return { ok: false, reason: result.msg || '操作失败' }
      this.ap.cur = Math.max(0, this.ap.cur - (act.apCost || 0))
      this.actionCooldown[cdKey] = Date.now() + (act.cooldownSec || 0) * 1000
      this.saveToLocal()
      return { ok: true, msg: result.msg, gain: result.gain }
    },

    /** 事件相关：尝试触发一个事件 */
    /** 季节切换时插入史册一条 + 把事件冷却往前推进缩短，让玩家立刻感知 */
    _onSeasonChange(prevKey, season) {
      const year = this.currentYear
      this.chronicle.unshift({
        id: 'c_season_' + Date.now(),
        ts: Date.now(),
        eventKey: 'season_change',
        eventTitle: `入${season.label} · ${year}年`,
        icon: '季',
        type: 'season',
        choiceLabel: season.flavor,
        effects: buffSummary(season) || '无产出加成',
        result: ''
      })
      while (this.chronicle.length > 30) this.chronicle.pop()
    },

    /** 世界时钟：每 ~45s 推进一次，让 NPC 势力自己扩张/相争 */
    _tickWorldClock() {
      // 排程下一次（冬季 NPC 收兵不动，间隔加倍）
      const seasonMul = this.currentSeason.key === 'winter' ? 2 : 1
      this.worldNextAt = Date.now() + (35 + Math.random() * 20) * 1000 * seasonMul

      const w = this.world || {}
      // 1) 各州 power 自然涨幅（被占者长城，未被占的小幅波动）
      for (const id of Object.keys(w)) {
        const cell = w[id]
        if (!cell) continue
        if (cell.owner === 'player') continue
        const grow = 1 + Math.random() * 3
        cell.power = Math.max(80, Math.round(cell.power + grow))
      }

      // 2) 冬季 NPC 不开战
      if (this.currentSeason.key === 'winter') return

      // 3) 选一个 NPC 势力做行动（按 aggression 加权）
      const candidates = Object.keys(FACTION_AI).filter((k) => k !== 'bandits')
      const ai = candidates[Math.floor(Math.random() * candidates.length)]
      const aiConf = FACTION_AI[ai]
      if (!aiConf || Math.random() > aiConf.aggression) return

      // 该势力当前的领地
      const myLands = Object.keys(w).filter((id) => w[id].owner === ai)
      if (myLands.length === 0) return

      // 寻找可攻击邻州（不能打玩家）
      const targets = []
      for (const land of myLands) {
        for (const nb of neighborsOf(land)) {
          const o = w[nb] && w[nb].owner
          if (!o || o === ai || o === 'player') continue
          // 偏好性加权
          const pref = aiConf.prefers.includes(nb) ? 2 : 1
          targets.push({ from: land, to: nb, w: pref })
        }
      }
      if (targets.length === 0) return

      // 加权随机选目标
      const totalW = targets.reduce((s, t) => s + t.w, 0)
      let r = Math.random() * totalW
      let pick = targets[0]
      for (const t of targets) { r -= t.w; if (r <= 0) { pick = t; break } }

      const fromCell = w[pick.from]
      const toCell = w[pick.to]
      const atkPow = fromCell.power * (0.8 + Math.random() * 0.5)
      const defPow = toCell.power * (0.9 + Math.random() * 0.3)
      const oldOwner = toCell.owner

      if (atkPow > defPow) {
        // 攻破 - 易主
        toCell.owner = ai
        toCell.power = Math.round(Math.max(120, defPow * 0.8 + 30))
        fromCell.power = Math.round(fromCell.power * 0.9)
        const tName = (TERRITORY_MAP[pick.to] || {}).name || pick.to
        this._pushWorldLog(`${factionOf(ai).name} 自 ${(TERRITORY_MAP[pick.from] || {}).name || pick.from} 出兵，攻取 ${tName}（原属 ${factionOf(oldOwner).name}）`, 'war')
      } else {
        // 攻势受挫
        toCell.power = Math.round(toCell.power * 0.95)
        fromCell.power = Math.round(fromCell.power * 0.85)
        const tName = (TERRITORY_MAP[pick.to] || {}).name || pick.to
        this._pushWorldLog(`${factionOf(ai).name} 兵犯 ${tName}，被 ${factionOf(oldOwner).name} 击退`, 'truce')
      }
    },

    _pushWorldLog(text, type = 'war') {
      this.worldLog.unshift({
        id: 'wl_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        ts: Date.now(),
        text,
        type
      })
      while (this.worldLog.length > 8) this.worldLog.pop()
    },

    /** 结局画卷触发检测：8 州霸业 / 13 州一统 */
    _checkEnding() {
      if (!this.ending) this.ending = { hegemony: false, unify: false }
      const n = this.territories.length
      if (n >= 13 && !this.ending.unify) {
        this.ending.unify = true
        this.pendingEnding = 'unify'
        this.chronicle.unshift({
          id: 'ch_' + Date.now() + '_unify',
          ts: Date.now(),
          type: 'history',
          icon: '🏯',
          eventTitle: '一统天下',
          eventKey: '_ending_unify',
          choiceLabel: '主公定鼎，海内归心',
          msg: `居中州一十三郡，群雄俯首`
        })
      } else if (n >= 8 && !this.ending.hegemony) {
        this.ending.hegemony = true
        this.pendingEnding = 'hegemony'
        this.chronicle.unshift({
          id: 'ch_' + Date.now() + '_hegemony',
          ts: Date.now(),
          type: 'history',
          icon: '⚑',
          eventTitle: '霸业初成',
          eventKey: '_ending_hegemony',
          choiceLabel: '八州在手，威震四方',
          msg: `主公已据${n}州之地，列国争相结盟`
        })
      }
    },

    /** 关闭结局画卷 */
    dismissEnding() {
      this.pendingEnding = null
    },

    /** 生成一场战斗的分回合演出文本（用于战报逐句弹出） */
    _buildBattleRounds(party, terr, ourPower, result, partyBonds, stratagemMul, seasonMul) {
      const rounds = []
      const enemy = terr.defender || '守军'
      const lead = party[0]?.meta?.name || '我军先锋'
      const captain = party.length >= 2 ? (party[1].meta?.name || '副将') : lead

      // 起势
      rounds.push({ side: 'us', text: `${lead} 引兵临 ${terr.name} 城下` })
      if (seasonMul > 1) rounds.push({ side: 'season', text: `时值 ${this.currentSeason.label} 季，将士士气大振 (战力 ×${seasonMul.toFixed(2)})` })
      if (stratagemMul > 1) rounds.push({ side: 'us', text: `军师献策已成，全军布下奇阵` })

      // 中段：羁绊触发
      if (partyBonds && partyBonds.length) {
        rounds.push({ side: 'us', text: `${partyBonds[0].name} 之契发动，三军同心` })
      }

      // 敌方应战
      rounds.push({ side: 'enemy', text: `${enemy} 据城而守，箭如雨下` })

      // 交锋 1-2 句
      const heroLine = party[Math.floor(Math.random() * party.length)]?.meta?.name || lead
      if (result.win) {
        rounds.push({ side: 'us', text: `${heroLine} 一马当先，连斩数将` })
        if (party.length > 1) rounds.push({ side: 'us', text: `${captain} 引偏师袭城南门` })
        rounds.push({ side: 'enemy', text: `${enemy} 阵脚大乱，节节败退` })
        rounds.push({ side: 'result', text: `${terr.name} 城破！主公得此一州，纳入版图` })
      } else {
        rounds.push({ side: 'enemy', text: `敌军以逸待劳，我军初战不利` })
        rounds.push({ side: 'us', text: `${heroLine} 力战不退，奈何寡不敌众` })
        rounds.push({ side: 'result', text: `攻城受挫，退兵自保。来日方长` })
      }
      return rounds
    },

    _tryRollEvent() {
      // 概率门：到时间也只有 EVENT_FIRE_CHANCE 概率本次触发
      if (Math.random() > EVENT_FIRE_CHANCE) {
        const retrySec = EVENT_RETRY_MIN_SEC + Math.random() * (EVENT_RETRY_MAX_SEC - EVENT_RETRY_MIN_SEC)
        this.eventNextAt = Date.now() + retrySec * 1000
        return
      }
      const e = rollEvent(this)
      if (!e) {
        this._rollNextEventAt()
        return
      }
      this.pendingEvent = {
        key: e.key,
        ts: Date.now()
      }
      this.saveToLocal()
    },

    /** 重新安排下一次事件时间 */
    _rollNextEventAt() {
      const sec = EVENT_MIN_SEC + Math.random() * (EVENT_MAX_SEC - EVENT_MIN_SEC)
      this.eventNextAt = Date.now() + sec * 1000
    },

    /** 玩家选择事件选项 */
    resolveEvent(choiceKey) {
      if (!this.pendingEvent) return { ok: false, reason: '无待处理事件' }
      const event = EVENT_MAP[this.pendingEvent.key]
      if (!event) {
        this.pendingEvent = null
        return { ok: false, reason: '事件已失效' }
      }
      const ch = (event.choices || []).find((c) => c.key === choiceKey)
      if (!ch) return { ok: false, reason: '未知选项' }
      const result = ch.run(this) || {}
      // 写入史册
      this.chronicle.unshift({
        id: 'c_' + Date.now(),
        ts: Date.now(),
        eventKey: event.key,
        eventTitle: event.title,
        icon: event.icon,
        type: event.type,
        choiceLabel: ch.label,
        msg: result.msg || ''
      })
      if (this.chronicle.length > 50) this.chronicle.length = 50
      this.pendingEvent = null
      this._rollNextEventAt()
      this.saveToLocal()
      return { ok: true, msg: result.msg }
    },

    /** 跳过/忽略事件（不消费机会，但仍重排下次时间） */
    dismissEvent() {
      this.pendingEvent = null
      this._rollNextEventAt()
      this.saveToLocal()
    },

    /** 兼容旧接口：升级建筑（保留用于不需要时间的紧急升级路径） */
    upgradeBuilding(key) {
      // 直接入队（带时间）
      return this.startBuild(key)
    },

    /** 设置税率 */
    setTax(tax) {
      if (!TAX_TABLE[tax]) return
      this.policy.tax = tax
      this.saveToLocal()
    },

    /** 客栈：刷新候选 */
    refreshTavern(force = false) {
      const costMul = (this.specEffects.tavernCostMul ?? 1)
      const cost = Math.ceil(TAVERN_REFRESH_COIN * costMul)
      if (!force) {
        if (this.resources.coin < cost) {
          return { ok: false, reason: '铜钱不足' }
        }
        this.resources.coin -= cost
      }
      const excludeIds = this.heroes.map((h) => h.id)
      this.heroRoster = rollHeroes(3, excludeIds)
      this.tavernLastRollAt = Date.now()
      this.saveToLocal()
      return { ok: true }
    },

    /** 招募武将（按 rollId 从候选池中选） */
    recruitHero(rollId) {
      const idx = this.heroRoster.findIndex((h) => h.rollId === rollId)
      if (idx < 0) return { ok: false, reason: '候选不存在' }
      if (this.heroes.length >= this.heroCap) {
        return { ok: false, reason: `客栈名额已满（${this.heroCap}）` }
      }
      const cand = this.heroRoster[idx]
      if (this.heroes.find((h) => h.id === cand.id)) {
        return { ok: false, reason: '已招募过' }
      }
      const cost = cand.recruitCost
      if (this.resources.coin < cost.coin) return { ok: false, reason: '铜钱不足' }
      if (this.resources.grain < cost.grain) return { ok: false, reason: '粮草不足' }
      this.resources.coin -= cost.coin
      this.resources.grain -= cost.grain
      this.ap.cur = Math.max(0, this.ap.cur - cost.ap)
      this.heroes.push({
        id: cand.id,
        level: 1,
        exp: 0,
        task: null,
        recruitedAt: Date.now()
      })
      this.heroRoster.splice(idx, 1)
      this.saveToLocal()
      return { ok: true }
    },

    /** 分配/取消任务（与驻守互斥） */
    assignTask(heroId, taskKey) {
      const h = this.heroes.find((x) => x.id === heroId)
      if (!h) return { ok: false, reason: '武将不存在' }
      if (taskKey && !TASKS[taskKey]) return { ok: false, reason: '未知任务' }
      if (taskKey) {
        // 取消驻守
        for (const k in this.garrison) {
          const idx = this.garrison[k].indexOf(heroId)
          if (idx >= 0) this.garrison[k].splice(idx, 1)
        }
      }
      h.task = taskKey || null
      this.saveToLocal()
      return { ok: true }
    },

    /** 武将升级（消耗铜钱+粮草+经验） */
    levelUpHero(heroId) {
      const h = this.heroes.find((x) => x.id === heroId)
      if (!h) return { ok: false, reason: '武将不存在' }
      const need = heroExpToNext(h.level)
      const meta = findHero(h.id)
      const qMul = { common: 1, rare: 2, epic: 4, legend: 8 }[meta?.quality] || 1
      const coinCost = 300 * h.level * qMul
      const grainCost = 150 * h.level * qMul
      if (h.exp < need) return { ok: false, reason: `经验不足（${h.exp}/${need}）` }
      if (this.resources.coin < coinCost) return { ok: false, reason: '铜钱不足' }
      if (this.resources.grain < grainCost) return { ok: false, reason: '粮草不足' }
      this.resources.coin -= coinCost
      this.resources.grain -= grainCost
      h.exp -= need
      h.level += 1
      this.saveToLocal()
      return { ok: true }
    },

    /** 解除武将 */
    dismissHero(heroId) {
      const idx = this.heroes.findIndex((x) => x.id === heroId)
      if (idx < 0) return
      // 同步清驻守
      for (const k in this.garrison) {
        const i2 = this.garrison[k].indexOf(heroId)
        if (i2 >= 0) this.garrison[k].splice(i2, 1)
      }
      this.heroes.splice(idx, 1)
      this.saveToLocal()
    },

    /** 选择专精流派（仅未选时可用） */
    chooseSpecialization(key) {
      if (!SPECIALIZATION_MAP[key]) return { ok: false, reason: '未知流派' }
      if (this.specialization.key) return { ok: false, reason: '已立国策（需先解除）' }
      this.specialization = { key, stage: 0 }
      this.saveToLocal()
      return { ok: true }
    },

    /** 推进专精至下一阶（消耗声望） */
    advanceSpecialization() {
      const info = this.specInfo
      if (!info) return { ok: false, reason: '尚未立国策' }
      if (!info.next) return { ok: false, reason: '已修至极致' }
      const need = info.next.reputation
      if ((this.resources.reputation || 0) < need) {
        return { ok: false, reason: `声望不足 (${this.resources.reputation}/${need})` }
      }
      this.resources.reputation -= need
      this.specialization.stage += 1
      this.saveToLocal()
      return { ok: true, stage: this.specialization.stage }
    },

    /** 解除当前流派（保留进度可重选；扣 30 声望作为成本，可为 0 时也允许） */
    resetSpecialization() {
      if (!this.specialization.key) return { ok: false, reason: '尚未立国策' }
      const refund = Math.round((this.specialization.stage || 0) * 5)
      this.resources.reputation += refund
      this.specialization = { key: null, stage: 0 }
      this.saveToLocal()
      return { ok: true, refund }
    },

    /** 出征战斗 */
    battle(territoryId, heroIds = []) {
      const terr = TERRITORY_MAP[territoryId]
      if (!terr) return { ok: false, reason: '未知州郡' }
      if (this.territories.includes(territoryId)) return { ok: false, reason: '已在治下' }
      const now = Date.now()
      const cd = this.territoryCooldown[territoryId] || 0
      if (cd > now) {
        const left = Math.ceil((cd - now) / 1000)
        return { ok: false, reason: `冷却中（${left}s）` }
      }
      if (!heroIds.length) return { ok: false, reason: '需至少 1 名武将' }
      const party = heroIds.map((id) => {
        const h = this.heroes.find((x) => x.id === id)
        if (!h) return null
        return { ...h, meta: findHero(h.id) }
      }).filter(Boolean)
      if (party.length === 0) return { ok: false, reason: '所选武将无效' }
      // 资源校验
      const cost = terr.cost
      if (this.resources.soldier < cost.soldier) return { ok: false, reason: '兵力不足' }
      if (this.resources.grain < cost.grain) return { ok: false, reason: '粮草不足' }
      if (this.ap.cur < cost.ap) return { ok: false, reason: '精力不足' }
      // 扣消耗
      this.resources.soldier -= cost.soldier
      this.resources.grain -= cost.grain
      this.ap.cur = Math.max(0, this.ap.cur - cost.ap)

      const baseOurPower = computePartyPower(party)
      // 队伍触发的羁绊（只看出征队伍）
      const partyBonds = detectBonds(party.map((p) => p.id))
      const bondMul = combinePowerMul(partyBonds)
      const specPowerMul = this.specEffects.powerMul || 1
      // 献策一次性 buff
      let stratagemMul = 1
      if (this.flags.stratagemUntil && this.flags.stratagemUntil > now) {
        stratagemMul = 1.2
        this.flags.stratagemUntil = 0
      }
      const seasonMul = this.currentSeason.powerMul || 1
      const ourPower = Math.round(baseOurPower * bondMul * specPowerMul * stratagemMul * seasonMul)
      const result = resolveBattle(ourPower, terr.power)

      const entry = {
        id: 'b_' + now,
        ts: now,
        territoryId,
        territoryName: terr.name,
        heroNames: party.map((p) => p.meta?.name || p.id),
        ourPower,
        basePower: baseOurPower,
        bondMul: Math.round(bondMul * 100) / 100,
        specPowerMul: Math.round(specPowerMul * 100) / 100,
        bondNames: partyBonds.map((b) => b.name),
        ...result,
        rewards: null,
        loss: 0,
        rounds: this._buildBattleRounds(party, terr, ourPower, result, partyBonds, stratagemMul, seasonMul)
      }

      if (result.win) {
        // 胜利：占领 + 发放奖励
        this.territories.push(territoryId)
        delete this.territoryCooldown[territoryId]
        // 世界局势同步：该州转归玩家
        if (this.world && this.world[territoryId]) {
          this.world[territoryId].owner = 'player'
          this.world[territoryId].power = 0
        }
        const reward = terr.reward || {}
        if (reward.coin) this.resources.coin += reward.coin
        if (reward.grain) this.resources.grain += reward.grain
        if (reward.wood) this.resources.wood += reward.wood
        if (reward.soldier) this.resources.soldier += reward.soldier
        if (reward.reputation) this.resources.reputation += reward.reputation
        if (reward.jadeShard) this.resources.jadeShard += reward.jadeShard
        entry.rewards = reward
        // 武将经验奖励
        const expGain = 30 + terr.tier * 20
        for (const h of this.heroes) {
          if (heroIds.includes(h.id)) h.exp = (h.exp || 0) + expGain
        }
        entry.expGain = expGain
        // 民心 +2
        this.policy.morale = Math.min(100, this.policy.morale + 2)
        // 结局画卷触发检测
        this._checkEnding()
      } else {
        // 失败：额外损失兵力 + 进入冷却 + 民心略降
        const extraLoss = Math.round(cost.soldier * 0.5)
        this.resources.soldier = Math.max(0, this.resources.soldier - extraLoss)
        entry.loss = cost.soldier + extraLoss
        const cdMul = this.specEffects.cooldownMul || 1
        this.territoryCooldown[territoryId] = now + Math.round(BATTLE_COOLDOWN_SEC * 1000 * cdMul)
        this.policy.morale = Math.max(0, this.policy.morale - 3)
      }

      this.battleLog.unshift(entry)
      if (this.battleLog.length > 12) this.battleLog.length = 12
      this.saveToLocal()
      return { ok: true, result: entry }
    },

    /** 消耗精力（用于主动操作），返回当前档位倍率 */
    consumeAction(cost = 5) {
      const tier = this.apTier
      this.ap.cur = Math.max(0, this.ap.cur - cost)
      return tier.mul
    },

    saveToLocal() {
      scheduleSave(this.$state)
    },
    flushSave() {
      flushSave()
    },
    saveToLocalSync() {
      saveToLocal(this.$state)
    },
    loadFromLocal() {
      const data = loadFromLocal()
      if (data) {
        const init = createInitialState()
        if (!data.ap) data.ap = init.ap
        if (!data.policy) data.policy = init.policy
        if (data.policy && data.policy.tax === undefined) data.policy.tax = 'normal'
        if (!Array.isArray(data.heroRoster)) data.heroRoster = []
        if (!Array.isArray(data.heroes)) data.heroes = []
        if (!Array.isArray(data.battleLog)) data.battleLog = []
        if (!data.territoryCooldown || typeof data.territoryCooldown !== 'object') data.territoryCooldown = {}
        if (!data.specialization || typeof data.specialization !== 'object') data.specialization = init.specialization
        if (data.specialization.stage == null) data.specialization.stage = 0
        if (!Array.isArray(data.buildQueue)) data.buildQueue = []
        if (!data.garrison || typeof data.garrison !== 'object') data.garrison = {}
        if (!data.actionCooldown || typeof data.actionCooldown !== 'object') data.actionCooldown = {}
        if (!data.governance || typeof data.governance !== 'object') data.governance = init.governance
        for (const k of ['tech', 'culture', 'security', 'commerce']) {
          if (data.governance[k] == null) data.governance[k] = init.governance[k]
        }
        if (!Array.isArray(data.chronicle)) data.chronicle = []
        if (!data.eventNextAt || Date.now() - data.eventNextAt > EVENT_STALE_SEC * 1000) {
          data.eventNextAt = rollFirstEventAt()
        }
        if (data.pendingEvent === undefined) data.pendingEvent = null
        if (!data.flags || typeof data.flags !== 'object') data.flags = init.flags
        // 季节 / 世界局势 hydration 兼容
        if (typeof data.meta?.playSec !== 'number') {
          if (!data.meta) data.meta = init.meta
          data.meta.playSec = 0
        }
        if (!data.world || typeof data.world !== 'object') data.world = init.world
        // 玩家已占领的州，强制 owner=player 防止覆盖
        if (Array.isArray(data.territories)) {
          for (const tid of data.territories) {
            if (data.world[tid]) { data.world[tid].owner = 'player'; data.world[tid].power = 0 }
          }
        }
        if (!Array.isArray(data.worldLog)) data.worldLog = []
        if (typeof data.worldNextAt !== 'number') data.worldNextAt = Date.now() + 45 * 1000
        if (!data.ending || typeof data.ending !== 'object') data.ending = { hegemony: false, unify: false }
        if (data.pendingEnding === undefined) data.pendingEnding = null
        // 补武将字段
        data.heroes = data.heroes.map((h) => ({
          level: 1, exp: 0, task: null, recruitedAt: Date.now(), ...h
        }))
        this.$patch(data)
      }
      this.settleOffline()
    },
    exportSaveCode() {
      return exportCode(this.$state)
    },
    importSaveCode(code) {
      const data = importCode(code)
      if (data) {
        const init = createInitialState()
        if (!data.ap) data.ap = init.ap
        if (!Array.isArray(data.heroRoster)) data.heroRoster = []
        if (!Array.isArray(data.heroes)) data.heroes = []
        if (!Array.isArray(data.battleLog)) data.battleLog = []
        if (!data.territoryCooldown || typeof data.territoryCooldown !== 'object') data.territoryCooldown = {}
        if (!data.specialization || typeof data.specialization !== 'object') data.specialization = init.specialization
        if (data.specialization.stage == null) data.specialization.stage = 0
        if (!Array.isArray(data.buildQueue)) data.buildQueue = []
        if (!data.garrison || typeof data.garrison !== 'object') data.garrison = {}
        if (!data.actionCooldown || typeof data.actionCooldown !== 'object') data.actionCooldown = {}
        if (!data.governance || typeof data.governance !== 'object') data.governance = init.governance
        if (!Array.isArray(data.chronicle)) data.chronicle = []
        if (!data.eventNextAt || Date.now() - data.eventNextAt > EVENT_STALE_SEC * 1000) {
          data.eventNextAt = rollFirstEventAt()
        }
        if (data.pendingEvent === undefined) data.pendingEvent = null
        if (!data.flags || typeof data.flags !== 'object') data.flags = init.flags
        if (typeof data.meta?.playSec !== 'number') {
          if (!data.meta) data.meta = init.meta
          data.meta.playSec = 0
        }
        if (!data.world || typeof data.world !== 'object') data.world = init.world
        if (Array.isArray(data.territories)) {
          for (const tid of data.territories) {
            if (data.world[tid]) { data.world[tid].owner = 'player'; data.world[tid].power = 0 }
          }
        }
        if (!Array.isArray(data.worldLog)) data.worldLog = []
        if (typeof data.worldNextAt !== 'number') data.worldNextAt = Date.now() + 45 * 1000
        if (!data.ending || typeof data.ending !== 'object') data.ending = { hegemony: false, unify: false }
        if (data.pendingEnding === undefined) data.pendingEnding = null
        this.$patch(data)
        this.saveToLocalSync()
        return true
      }
      return false
    }
  }
})

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }
function round1(v) { return Math.round(v * 10) / 10 }
function labelOf(k) {
  return ({ grain: '粮草', coin: '铜钱', wood: '木材', soldier: '兵力' })[k] || k
}

export { TAX_TABLE, BUILDINGS, BUILDING_MAP }
