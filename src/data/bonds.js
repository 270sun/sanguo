/**
 * 武将羁绊系统
 * 当编队/麾下武将集齐 members 时，自动激活对应羁绊
 *  - powerMul: 战斗时该队伍战力倍率（如 1.2 = +20%）
 *  - rateBonus: 永久速率加成（叠加到 rates 总和，仅麾下集齐时常驻）
 *  - scope: 'battle' 仅出征队伍触发 / 'roster' 麾下集齐就常驻
 */
export const BONDS = [
  {
    id: 'taoyuan',
    name: '桃园三结义',
    members: ['guanyu', 'zhangfei'],
    extraDesc: '与刘备共誓（关张同台即生效）',
    powerMul: 1.30,
    rateBonus: { soldier: 0.6 },
    scope: 'both',
    flavor: '不求同年同月同日生·但求同年同月同日死'
  },
  {
    id: 'wuhu',
    name: '五虎上将',
    members: ['guanyu', 'zhangfei', 'zhaoyun'],
    extraDesc: '蜀汉名将云集',
    powerMul: 1.45,
    rateBonus: { coin: 0.8, soldier: 0.8 },
    scope: 'both',
    flavor: '关·张·赵·黄·马 五虎临阵·所向披靡'
  },
  {
    id: 'wolong',
    name: '卧龙归汉',
    members: ['zhuge', 'guanyu'],
    extraDesc: '武圣与丞相同朝',
    powerMul: 1.35,
    rateBonus: { grain: 1.2, coin: 0.5 },
    scope: 'both',
    flavor: '卧龙运筹·武圣镇关·得一可安天下'
  },
  {
    id: 'jiangdong',
    name: '江东双璧',
    members: ['zhouyu', 'lusu'],
    extraDesc: '吴国谋臣并立',
    powerMul: 1.25,
    rateBonus: { coin: 1.0, grain: 0.6 },
    scope: 'both',
    flavor: '周郎赤壁火·子敬榻上策'
  },
  {
    id: 'weihu',
    name: '魏室猛将',
    members: ['dianwei', 'caoren'],
    extraDesc: '曹魏宿将同阵',
    powerMul: 1.18,
    rateBonus: { soldier: 0.5 },
    scope: 'both',
    flavor: '古之恶来·守城之将'
  },
  {
    id: 'guimou',
    name: '鬼谋并出',
    members: ['sima', 'zhuge'],
    extraDesc: '智者对弈，山河震动',
    powerMul: 1.50,
    rateBonus: { coin: 1.5, grain: 1.0 },
    scope: 'both',
    flavor: '武乡侯与冢虎，谋略冠绝当世'
  },
  {
    id: 'shuhan',
    name: '蜀汉同心',
    members: ['guanyu', 'zhaoyun', 'wangping'],
    extraDesc: '蜀地将士同袍',
    powerMul: 1.22,
    rateBonus: { wood: 0.5, grain: 0.6 },
    scope: 'both',
    flavor: '汉室倾颓·我辈当扶'
  },
  {
    id: 'feijiang',
    name: '飞将临世',
    members: ['lvbu'],
    extraDesc: '吕布单骑亦能破阵',
    powerMul: 1.40,
    rateBonus: { soldier: 1.0 },
    scope: 'both',
    flavor: '人中吕布·马中赤兔'
  },
  {
    id: 'wuwei',
    name: '吴魏对峙',
    members: ['zhouyu', 'sima'],
    extraDesc: '美周郎与冢虎隔江相望',
    powerMul: 1.28,
    rateBonus: { coin: 0.8, grain: 0.4 },
    scope: 'both',
    flavor: '既生瑜·何生狼顾'
  }
]

export const BOND_MAP = Object.fromEntries(BONDS.map((b) => [b.id, b]))

/**
 * 检测某武将集合可激活哪些羁绊
 * @param {string[]} heroIds  当前考察的武将id集合
 * @returns {Array} 已激活的羁绊数组（带 meta）
 */
export function detectBonds(heroIds = []) {
  const set = new Set(heroIds)
  return BONDS.filter((b) => b.members.every((m) => set.has(m)))
}

/**
 * 计算多羁绊叠加后的战力倍率（连乘）
 */
export function combinePowerMul(bonds) {
  return bonds.reduce((mul, b) => mul * (b.powerMul || 1), 1)
}

/**
 * 累加多羁绊的速率加成
 */
export function combineRateBonus(bonds) {
  const out = { grain: 0, coin: 0, wood: 0, soldier: 0 }
  for (const b of bonds) {
    const r = b.rateBonus || {}
    for (const k of Object.keys(out)) {
      if (r[k]) out[k] += r[k]
    }
  }
  return out
}

export default BONDS
