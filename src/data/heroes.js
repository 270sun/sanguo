/**
 * 武将卡池
 * quality: common(平民/灰) / rare(良将/蓝) / epic(名将/紫) / legend(神将/金)
 * faction: wei(魏) / shu(蜀) / wu(吴) / han(汉) / qun(群)
 * stats: { wu 武力 / wen 智谋 / tong 统率 }
 * skill: { name, desc, taskBonus: {grain/coin/wood/soldier} }  (任务时额外倍率加成)
 */
export const HERO_POOL = [
  // 神将 (legend) - 1.5% 概率每张
  { id: 'lvbu',     name: '吕布',   quality: 'legend', faction: 'qun', avatar: '🗡️', stats: { wu: 99, wen: 25, tong: 75 },
    skill: { name: '飞将无双', desc: '练兵效率 ×3', taskBonus: { soldier: 3 } } },
  { id: 'zhuge',    name: '诸葛亮', quality: 'legend', faction: 'shu', avatar: '🪶', stats: { wu: 38, wen: 99, tong: 92 },
    skill: { name: '卧龙运筹', desc: '所有任务产出 ×1.5', taskBonus: { _all: 1.5 } } },
  // 名将 (epic) - 7% 概率每张
  { id: 'guanyu',   name: '关羽',   quality: 'epic',   faction: 'shu', avatar: '⚔️', stats: { wu: 96, wen: 75, tong: 90 },
    skill: { name: '武圣镇威', desc: '练兵效率 ×2', taskBonus: { soldier: 2 } } },
  { id: 'zhaoyun',  name: '赵云',   quality: 'epic',   faction: 'shu', avatar: '🛡️', stats: { wu: 95, wen: 76, tong: 88 },
    skill: { name: '常胜将军', desc: '巡查铜钱 ×1.8', taskBonus: { coin: 1.8 } } },
  { id: 'sima',     name: '司马懿', quality: 'epic',   faction: 'wei', avatar: '🦊', stats: { wu: 60, wen: 96, tong: 91 },
    skill: { name: '鹰视狼顾', desc: '屯田粮草 ×1.8', taskBonus: { grain: 1.8 } } },
  { id: 'zhouyu',   name: '周瑜',   quality: 'epic',   faction: 'wu',  avatar: '🔥', stats: { wu: 78, wen: 95, tong: 89 },
    skill: { name: '美周郎', desc: '巡查铜钱 ×1.6', taskBonus: { coin: 1.6 } } },
  // 良将 (rare) - 20% 概率每张
  { id: 'zhangfei', name: '张飞',   quality: 'rare',   faction: 'shu', avatar: '🐗', stats: { wu: 95, wen: 45, tong: 78 },
    skill: { name: '燕人喝', desc: '练兵 ×1.5', taskBonus: { soldier: 1.5 } } },
  { id: 'dianwei',  name: '典韦',   quality: 'rare',   faction: 'wei', avatar: '🪓', stats: { wu: 94, wen: 35, tong: 70 },
    skill: { name: '古之恶来', desc: '练兵 ×1.5', taskBonus: { soldier: 1.5 } } },
  { id: 'lusu',     name: '鲁肃',   quality: 'rare',   faction: 'wu',  avatar: '📜', stats: { wu: 50, wen: 88, tong: 80 },
    skill: { name: '榻上策', desc: '屯田粮草 ×1.5', taskBonus: { grain: 1.5 } } },
  // 平民 (common) - 余下概率
  { id: 'wangping', name: '王平',   quality: 'common', faction: 'shu', avatar: '🪖', stats: { wu: 72, wen: 60, tong: 75 },
    skill: { name: '识地利', desc: '伐木 ×1.3', taskBonus: { wood: 1.3 } } },
  { id: 'caoren',   name: '曹仁',   quality: 'common', faction: 'wei', avatar: '🏯', stats: { wu: 78, wen: 65, tong: 82 },
    skill: { name: '守城将', desc: '屯田粮草 ×1.3', taskBonus: { grain: 1.3 } } },
  { id: 'chenggong',name: '程普',   quality: 'common', faction: 'wu',  avatar: '🧓', stats: { wu: 75, wen: 65, tong: 78 },
    skill: { name: '老将稳重', desc: '巡查 ×1.3', taskBonus: { coin: 1.3 } } }
]

export const QUALITY_META = {
  common: { label: '平',   color: '#9aa0a6', glow: 'rgba(154,160,166,.6)', weight: 60 },
  rare:   { label: '良',   color: '#4a90e2', glow: 'rgba(74,144,226,.65)', weight: 25 },
  epic:   { label: '名',   color: '#a35be5', glow: 'rgba(163,91,229,.75)', weight: 12 },
  legend: { label: '神',   color: '#d4af37', glow: 'rgba(212,175,55,.85)', weight: 3 }
}

export const FACTION_META = {
  wei: { label: '魏', color: '#3a5da0' },
  shu: { label: '蜀', color: '#7a1f1a' },
  wu:  { label: '吴', color: '#1f5d4a' },
  han: { label: '汉', color: '#b8862e' },
  qun: { label: '群', color: '#555' }
}

/** 任务定义：分配武将后每秒额外产出 baseGain * (1 + level*0.1) * skillMul */
export const TASKS = {
  patrol:  { key: 'patrol',  label: '巡查', icon: '🛡️', resKey: 'coin',    baseGain: 0.6, desc: '驻防街市，每秒额外铜钱' },
  drill:   { key: 'drill',   label: '练兵', icon: '⚔️', resKey: 'soldier', baseGain: 0.3, desc: '操演武备，每秒额外兵力' },
  farm:    { key: 'farm',    label: '屯田', icon: '🌾', resKey: 'grain',   baseGain: 0.8, desc: '亲耕劝农，每秒额外粮草' },
  logging: { key: 'logging', label: '伐木', icon: '🪵', resKey: 'wood',    baseGain: 0.5, desc: '督促林作，每秒额外木材' }
}

export const TASK_LIST = Object.values(TASKS)

/** 按品质权重从卡池随机抽 N 张（允许重复出现同名时下次刷新去重） */
export function rollHeroes(count = 3, excludeIds = []) {
  const totalWeight = Object.values(QUALITY_META).reduce((s, q) => s + q.weight, 0)
  const result = []
  const used = new Set(excludeIds)
  let safety = 50
  while (result.length < count && safety-- > 0) {
    // 先按权重选品质
    let r = Math.random() * totalWeight
    let quality = 'common'
    for (const [k, v] of Object.entries(QUALITY_META)) {
      if (r < v.weight) { quality = k; break }
      r -= v.weight
    }
    const pool = HERO_POOL.filter((h) => h.quality === quality && !used.has(h.id))
    if (pool.length === 0) continue
    const pick = pool[Math.floor(Math.random() * pool.length)]
    used.add(pick.id)
    result.push({
      ...pick,
      rollId: pick.id + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      recruitCost: recruitCostOf(pick)
    })
  }
  return result
}

export function recruitCostOf(hero) {
  const base = { common: 1, rare: 3, epic: 8, legend: 20 }[hero.quality] || 1
  return {
    coin: 200 * base,
    grain: 100 * base,
    ap: { common: 5, rare: 10, epic: 18, legend: 30 }[hero.quality] || 5
  }
}

export function findHero(id) {
  return HERO_POOL.find((h) => h.id === id)
}

export default HERO_POOL
