/**
 * 三流派专精系统（阶段 2E）
 * 主公一次只能专精一条流派，可付出"声望"切换
 * 每流派 5 阶段，每阶段需求"声望"递增，效果叠加
 *  - rateMul: 对 rates 的乘法倍率（叠加到最后）
 *  - flatBonus: 对 rates 的加法（每秒）
 *  - powerMul: 出征时的全队战力倍率
 *  - extra: 其它效果开关（如 'apRegenFast', 'cooldownHalve' 等）
 */
export const SPECIALIZATIONS = [
  {
    key: 'civil',
    name: '议政殿',
    title: '内 政 之 道',
    icon: '📜',
    desc: '兴农修市·富国安民',
    color: '#4d7a4c',
    glow: 'rgba(77, 122, 76, .65)',
    flavor: '治国之本·在于民富',
    stages: [
      { name: '劝农令',  costReputation: 5,   rateMul: { grain: 1.10, wood: 1.10 } },
      { name: '通商策',  costReputation: 15,  rateMul: { grain: 1.20, wood: 1.20, coin: 1.10 } },
      { name: '安民诏',  costReputation: 30,  rateMul: { grain: 1.30, wood: 1.30, coin: 1.20 }, moraleBonus: 5 },
      { name: '九品制',  costReputation: 60,  rateMul: { grain: 1.45, wood: 1.45, coin: 1.30 }, moraleBonus: 10 },
      { name: '王佐之业', costReputation: 100, rateMul: { grain: 1.65, wood: 1.65, coin: 1.50 }, moraleBonus: 15 }
    ]
  },
  {
    key: 'military',
    name: '锻造坊',
    title: '军 备 之 道',
    icon: '⚒️',
    desc: '精甲利兵·所向披靡',
    color: '#a8231a',
    glow: 'rgba(168, 35, 26, .65)',
    flavor: '兵者·国之大事',
    stages: [
      { name: '环首刀',   costReputation: 5,   rateMul: { soldier: 1.15 }, powerMul: 1.05 },
      { name: '玄铁甲',   costReputation: 15,  rateMul: { soldier: 1.25 }, powerMul: 1.10 },
      { name: '连弩术',   costReputation: 30,  rateMul: { soldier: 1.40 }, powerMul: 1.18, cooldownMul: 0.75 },
      { name: '虎豹骑',   costReputation: 60,  rateMul: { soldier: 1.60 }, powerMul: 1.28, cooldownMul: 0.60 },
      { name: '霸王之资', costReputation: 100, rateMul: { soldier: 1.85 }, powerMul: 1.40, cooldownMul: 0.50 }
    ]
  },
  {
    key: 'talent',
    name: '集贤馆',
    title: '人 才 之 道',
    icon: '🪶',
    desc: '广纳贤良·将星云集',
    color: '#a35be5',
    glow: 'rgba(163, 91, 229, .65)',
    flavor: '得人才者得天下',
    stages: [
      { name: '招贤令', costReputation: 5,   tavernCostMul: 0.75, heroExpMul: 1.20 },
      { name: '求贤诏', costReputation: 15,  tavernCostMul: 0.60, heroExpMul: 1.40, apRegenMul: 1.20 },
      { name: '七步赋', costReputation: 30,  tavernCostMul: 0.50, heroExpMul: 1.70, apRegenMul: 1.40, heroCapBonus: 1 },
      { name: '隆中对', costReputation: 60,  tavernCostMul: 0.30, heroExpMul: 2.20, apRegenMul: 1.60, heroCapBonus: 2 },
      { name: '王佐之才', costReputation: 100, tavernCostMul: 0.10, heroExpMul: 3.00, apRegenMul: 2.00, heroCapBonus: 3, rateMul: { coin: 1.30 } }
    ]
  }
]

export const SPECIALIZATION_MAP = Object.fromEntries(SPECIALIZATIONS.map((s) => [s.key, s]))

/** 流派的总阶段数 */
export const SPEC_MAX_STAGE = 5

/**
 * 给定专精与已进阶段数（stage 0 表示未选；stage N 表示已修第 1~N 阶）
 * 返回已激活的所有 stage 配置（拼接生效）
 */
export function activeStagesOf(specKey, stage) {
  const cfg = SPECIALIZATION_MAP[specKey]
  if (!cfg || !stage) return []
  return cfg.stages.slice(0, Math.min(stage, cfg.stages.length))
}

/**
 * 汇总活跃 stage 的效果
 * 返回 {
 *   rateMul: {grain,coin,wood,soldier}  连乘
 *   powerMul: number  连乘
 *   cooldownMul: number 连乘
 *   tavernCostMul: number 连乘
 *   heroExpMul: number 连乘
 *   apRegenMul: number 连乘
 *   heroCapBonus: number 累加
 *   moraleBonus: number 累加（每秒补 +X 上限）
 * }
 */
export function aggregateSpecEffects(specKey, stage) {
  const stages = activeStagesOf(specKey, stage)
  const result = {
    rateMul: { grain: 1, coin: 1, wood: 1, soldier: 1 },
    powerMul: 1,
    cooldownMul: 1,
    tavernCostMul: 1,
    heroExpMul: 1,
    apRegenMul: 1,
    heroCapBonus: 0,
    moraleBonus: 0
  }
  for (const s of stages) {
    if (s.rateMul) {
      for (const k of Object.keys(result.rateMul)) {
        if (s.rateMul[k]) result.rateMul[k] *= s.rateMul[k]
      }
    }
    if (s.powerMul) result.powerMul *= s.powerMul
    if (s.cooldownMul) result.cooldownMul *= s.cooldownMul
    if (s.tavernCostMul) result.tavernCostMul *= s.tavernCostMul
    if (s.heroExpMul) result.heroExpMul *= s.heroExpMul
    if (s.apRegenMul) result.apRegenMul *= s.apRegenMul
    if (s.heroCapBonus) result.heroCapBonus += s.heroCapBonus
    if (s.moraleBonus) result.moraleBonus = Math.max(result.moraleBonus, s.moraleBonus)
  }
  return result
}

/** 下一阶段需消耗声望（stage 为当前已修阶段；0 表示还没开始） */
export function nextStageCost(specKey, stage) {
  const cfg = SPECIALIZATION_MAP[specKey]
  if (!cfg) return null
  const next = cfg.stages[stage]
  if (!next) return null
  return { stage: stage + 1, name: next.name, reputation: next.costReputation }
}

export default SPECIALIZATIONS
