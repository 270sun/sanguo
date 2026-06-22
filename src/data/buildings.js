/**
 * 建筑配置表
 *  - key: 建筑标识
 *  - name/icon/desc: 展示
 *  - maxLevel: 最大等级（同时受主公府限制）
 *  - requireLord: 解锁所需主公府等级
 *  - cost(level): 升级到 level+1 所需资源（输入为当前等级）
 *  - produce(level): 升级到 level 后的每秒产出（资源名 -> 数量）
 *  - upkeep(level): 每秒消耗（如兵营消耗粮草）
 *  - upgradeTimeSec(level): 升级耗时（秒），lv1→2 起按等级递增
 *  - garrisonCap(level): 可驻守武将数量
 *  - actions: [{ key, name, icon, apCost, cooldownSec, run(game, building) }] 主动操作
 *  - lore: { title, text } 历史科普
 */

/** 升级耗时通用算法：基础 25s, 每级 +20s, 最高 6 分钟 */
function defaultUpgradeTime(lv) {
  return Math.min(360, 25 + lv * 20)
}
/** 驻守槽：Lv0=0，Lv1~3=1，Lv4~7=2，Lv8+=3 */
function defaultGarrison(lv) {
  if (lv <= 0) return 0
  if (lv <= 3) return 1
  if (lv <= 7) return 2
  return 3
}

const BUILDINGS = [
  {
    key: 'lordHall',
    name: '主公府',
    icon: '🏯',
    desc: '决定其他建筑等级上限',
    maxLevel: 10,
    requireLord: 0,
    cost: (lv) => ({
      coin: Math.floor(200 * Math.pow(1.8, lv)),
      wood: Math.floor(120 * Math.pow(1.8, lv)),
      grain: Math.floor(150 * Math.pow(1.8, lv))
    }),
    produce: () => ({}),
    upkeep: () => ({}),
    upgradeTimeSec: (lv) => Math.min(600, 60 + lv * 40),
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'taxLevy',
        name: '征税',
        icon: '💰',
        apCost: 12,
        cooldownSec: 300,
        desc: '聚集衙役征课赋税，立得铜钱',
        run: (game, lv) => {
          const base = 80 + lv * 60
          const morale = Math.max(0.5, 1 - (100 - game.policy.morale) * 0.01)
          const gain = Math.round(base * morale)
          game.resources.coin += gain
          game.policy.morale = Math.max(0, game.policy.morale - 2)
          return { ok: true, msg: `征得铜钱 +${gain}`, gain: { coin: gain }, lossMorale: 2 }
        }
      },
      {
        key: 'audience',
        name: '召见',
        icon: '🎎',
        apCost: 8,
        cooldownSec: 240,
        desc: '召见诸侯使节，提升民心与文化',
        run: (game, lv) => {
          const cul = 1 + lv * 0.5
          game.policy.morale = Math.min(100, game.policy.morale + 3)
          game.governance.culture = Math.min(100, game.governance.culture + cul)
          return { ok: true, msg: `民心 +3 文化 +${cul.toFixed(1)}` }
        }
      }
    ],
    lore: {
      title: '汉室宫府',
      text: '东汉郡国治所多设府衙，太守掌一郡军政；主公府即是诸侯自立的中枢，召集僚属、颁布政令皆于此处决策。'
    }
  },
  {
    key: 'farm',
    name: '农田',
    icon: '🌾',
    desc: '产出粮草，国之根本',
    maxLevel: 10,
    requireLord: 1,
    cost: (lv) => ({
      coin: Math.floor(60 * Math.pow(1.55, lv)),
      wood: Math.floor(40 * Math.pow(1.55, lv))
    }),
    produce: (lv) => ({ grain: lv === 0 ? 0 : 4 + lv * 3 }),
    upkeep: () => ({}),
    upgradeTimeSec: defaultUpgradeTime,
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'prayRain',
        name: '祈雨',
        icon: '🌧️',
        apCost: 6,
        cooldownSec: 360,
        desc: '设坛祈雨，丰收粮草一波',
        run: (game, lv) => {
          const gain = 60 + lv * 40
          game.resources.grain += gain
          return { ok: true, msg: `天降甘霖：粮草 +${gain}`, gain: { grain: gain } }
        }
      },
      {
        key: 'harvest',
        name: '抢收',
        icon: '🧺',
        apCost: 10,
        cooldownSec: 200,
        desc: '加急抢收，立得大量粮草',
        run: (game, lv) => {
          const gain = 100 + lv * 60
          game.resources.grain += gain
          game.policy.morale = Math.max(0, game.policy.morale - 1)
          return { ok: true, msg: `抢收 +${gain} 粮草`, gain: { grain: gain } }
        }
      }
    ],
    lore: {
      title: '屯田制',
      text: '建安元年曹操采枣祗、韩浩之议行屯田，民屯军屯并行，岁得谷数百万斛，三国之兴皆赖此制。'
    }
  },
  {
    key: 'market',
    name: '市集',
    icon: '💰',
    desc: '产出铜钱，富国之基',
    maxLevel: 10,
    requireLord: 1,
    cost: (lv) => ({
      coin: Math.floor(80 * Math.pow(1.6, lv)),
      wood: Math.floor(50 * Math.pow(1.6, lv))
    }),
    produce: (lv) => ({ coin: lv === 0 ? 0 : 3 + lv * 2.5 }),
    upkeep: () => ({}),
    upgradeTimeSec: defaultUpgradeTime,
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'fairDay',
        name: '赶集',
        icon: '🎪',
        apCost: 8,
        cooldownSec: 300,
        desc: '举办集市，交易获大量铜钱',
        run: (game, lv) => {
          const gain = 90 + lv * 55
          game.resources.coin += gain
          game.governance.commerce = Math.min(100, game.governance.commerce + 2)
          return { ok: true, msg: `赶集生意兴隆：铜钱 +${gain}`, gain: { coin: gain } }
        }
      },
      {
        key: 'tradeWood',
        name: '通商',
        icon: '🚚',
        apCost: 10,
        cooldownSec: 240,
        desc: '以粮易木，换取建材',
        run: (game, lv) => {
          const need = 80
          if (game.resources.grain < need) return { ok: false, msg: '粮草不足' }
          const gain = 60 + lv * 30
          game.resources.grain -= need
          game.resources.wood += gain
          return { ok: true, msg: `粮 ${need} 换得木材 ${gain}`, gain: { wood: gain } }
        }
      }
    ],
    lore: {
      title: '市井与坊',
      text: '汉代以"市"为商业区，由市掾管辖，按时启闭；曹魏以后又设"坊"制，城池治安、商业秩序由是肇始。'
    }
  },
  {
    key: 'lumber',
    name: '伐木场',
    icon: '🪵',
    desc: '产出木材，营造之用',
    maxLevel: 10,
    requireLord: 1,
    cost: (lv) => ({
      coin: Math.floor(50 * Math.pow(1.5, lv)),
      grain: Math.floor(40 * Math.pow(1.5, lv))
    }),
    produce: (lv) => ({ wood: lv === 0 ? 0 : 2 + lv * 1.8 }),
    upkeep: () => ({}),
    upgradeTimeSec: defaultUpgradeTime,
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'felling',
        name: '督伐',
        icon: '🪓',
        apCost: 8,
        cooldownSec: 240,
        desc: '督促林工昼夜伐木',
        run: (game, lv) => {
          const gain = 70 + lv * 40
          game.resources.wood += gain
          return { ok: true, msg: `木材 +${gain}`, gain: { wood: gain } }
        }
      }
    ],
    lore: {
      title: '山泽之利',
      text: '汉时山林川泽多属"少府"，州郡设林虞监督樵采，所伐木材专供宫室军用，故有"营造之木出于山虞"。'
    }
  },
  {
    key: 'barrack',
    name: '兵营',
    icon: '⚔️',
    desc: '训练精兵，消耗粮草',
    maxLevel: 10,
    requireLord: 2,
    cost: (lv) => ({
      coin: Math.floor(150 * Math.pow(1.7, lv)),
      wood: Math.floor(100 * Math.pow(1.7, lv))
    }),
    produce: (lv) => ({ soldier: lv === 0 ? 0 : 1 + lv * 1.2 }),
    upkeep: (lv) => ({ grain: lv === 0 ? 0 : 1 + lv * 0.8 }),
    upgradeTimeSec: defaultUpgradeTime,
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'conscript',
        name: '征兵',
        icon: '🚩',
        apCost: 12,
        cooldownSec: 300,
        desc: '征募新卒入伍，立得兵力',
        run: (game, lv) => {
          const need = 40 + lv * 25
          if (game.resources.grain < need) return { ok: false, msg: `需粮草 ${need}` }
          const gain = 20 + lv * 12
          game.resources.grain -= need
          game.resources.soldier += gain
          game.policy.morale = Math.max(0, game.policy.morale - 1)
          return { ok: true, msg: `兵力 +${gain}`, gain: { soldier: gain } }
        }
      },
      {
        key: 'drill',
        name: '操演',
        icon: '🥊',
        apCost: 6,
        cooldownSec: 200,
        desc: '操练士卒，提升治安',
        run: (game, lv) => {
          game.governance.security = Math.min(100, game.governance.security + 3 + lv * 0.5)
          return { ok: true, msg: `治安 +${(3 + lv * 0.5).toFixed(1)}` }
        }
      }
    ],
    lore: {
      title: '部曲与世兵',
      text: '汉末诸侯多以"部曲"私兵起家，至曹魏立"世兵制"，士家世代为兵；蜀汉则有"飞军"，吴有"解烦兵"，皆精锐编制。'
    }
  },
  {
    key: 'academy',
    name: '武馆',
    icon: '🥋',
    desc: '加速武将经验、提升文化',
    maxLevel: 10,
    requireLord: 3,
    cost: (lv) => ({
      coin: Math.floor(220 * Math.pow(1.7, lv)),
      wood: Math.floor(150 * Math.pow(1.7, lv))
    }),
    produce: () => ({}),
    upkeep: () => ({}),
    upgradeTimeSec: defaultUpgradeTime,
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'spar',
        name: '比武',
        icon: '🤼',
        apCost: 10,
        cooldownSec: 360,
        desc: '召集武将切磋，全员经验 +50',
        run: (game) => {
          for (const h of game.heroes) h.exp = (h.exp || 0) + 50
          return { ok: true, msg: '全员经验 +50' }
        }
      },
      {
        key: 'preach',
        name: '讲学',
        icon: '📚',
        apCost: 6,
        cooldownSec: 240,
        desc: '邀名士讲学，提升文化',
        run: (game, lv) => {
          const add = 4 + lv * 0.5
          game.governance.culture = Math.min(100, game.governance.culture + add)
          return { ok: true, msg: `文化 +${add.toFixed(1)}` }
        }
      }
    ],
    lore: {
      title: '太学与私学',
      text: '汉武立太学传五经；东汉桓灵之后官学衰微，私学兴起，颍川书院、荆襄学派人才辈出，孔明亦出其门。'
    }
  },
  {
    key: 'inn',
    name: '驿站',
    icon: '🏮',
    desc: '招募名额上限·驿路通讯',
    maxLevel: 10,
    requireLord: 2,
    cost: (lv) => ({
      coin: Math.floor(180 * Math.pow(1.65, lv)),
      wood: Math.floor(120 * Math.pow(1.65, lv))
    }),
    produce: () => ({}),
    upkeep: () => ({}),
    upgradeTimeSec: defaultUpgradeTime,
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'envoy',
        name: '遣使',
        icon: '🐎',
        apCost: 8,
        cooldownSec: 300,
        desc: '派出信使探访，得声望',
        run: (game, lv) => {
          const gain = 2 + Math.floor(lv / 2)
          game.resources.reputation += gain
          return { ok: true, msg: `声望 +${gain}` }
        }
      }
    ],
    lore: {
      title: '邮亭驿传',
      text: '秦汉以"亭"为基层单位，三十里一驿，传车飞马，"羽檄"夜行；曹操少时即任洛阳北部尉，正是驿亭职官。'
    }
  },
  {
    key: 'strategist',
    name: '军师府',
    icon: '📜',
    desc: '产出科技、习得计谋',
    maxLevel: 10,
    requireLord: 4,
    cost: (lv) => ({
      coin: Math.floor(300 * Math.pow(1.8, lv)),
      wood: Math.floor(200 * Math.pow(1.8, lv))
    }),
    produce: () => ({}),
    upkeep: () => ({}),
    upgradeTimeSec: defaultUpgradeTime,
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'research',
        name: '研技',
        icon: '🔬',
        apCost: 10,
        cooldownSec: 300,
        desc: '钻研典籍，科技 +5',
        run: (game, lv) => {
          const add = 5 + lv * 0.5
          game.governance.tech = Math.min(100, game.governance.tech + add)
          return { ok: true, msg: `科技 +${add.toFixed(1)}` }
        }
      },
      {
        key: 'stratagem',
        name: '献策',
        icon: '🎯',
        apCost: 14,
        cooldownSec: 480,
        desc: '献奇策，下次出征战力 +20%（24h）',
        run: (game) => {
          game.flags.stratagemUntil = Date.now() + 24 * 3600 * 1000
          return { ok: true, msg: '【献策】下次出征战力 +20%' }
        }
      }
    ],
    lore: {
      title: '军师中郎将',
      text: '诸葛亮初仕刘备即拜"军师中郎将"，专司机谋；魏有军师祭酒（郭嘉）、吴有军师（鲁肃），皆运筹幕府之重职。'
    }
  },
  {
    key: 'workshop',
    name: '工坊',
    icon: '⚒️',
    desc: '锻造装备·提升商业',
    maxLevel: 10,
    requireLord: 3,
    cost: (lv) => ({
      coin: Math.floor(240 * Math.pow(1.7, lv)),
      wood: Math.floor(180 * Math.pow(1.7, lv))
    }),
    produce: () => ({}),
    upkeep: () => ({}),
    upgradeTimeSec: defaultUpgradeTime,
    garrisonCap: defaultGarrison,
    actions: [
      {
        key: 'forge',
        name: '锻造',
        icon: '🔨',
        apCost: 10,
        cooldownSec: 360,
        desc: '锻造甲胄，得玉石碎片 1',
        run: (game) => {
          game.resources.jadeShard += 1
          return { ok: true, msg: '【玉石碎片 +1】' }
        }
      },
      {
        key: 'tradeRun',
        name: '行商',
        icon: '🛤️',
        apCost: 8,
        cooldownSec: 240,
        desc: '商队远行，商业 +4',
        run: (game, lv) => {
          const add = 4 + lv * 0.4
          game.governance.commerce = Math.min(100, game.governance.commerce + add)
          return { ok: true, msg: `商业 +${add.toFixed(1)}` }
        }
      }
    ],
    lore: {
      title: '少府监冶',
      text: '汉代铁器由"铁官"垄断，曹魏更设"司金中郎将"专司军器；蜀有蒲元造刀，吴有"楼船监"，技艺各擅其美。'
    }
  }
]

export const BUILDING_MAP = BUILDINGS.reduce((m, b) => {
  m[b.key] = b
  return m
}, {})

export default BUILDINGS

/** 武将驻守对建筑产出的加成倍率：每个武将 +30%（按 wu+wen+tong/300 微调） */
export function garrisonMultiplier(heroMetas) {
  if (!heroMetas || heroMetas.length === 0) return 1
  let bonus = 0
  for (const m of heroMetas) {
    if (!m) continue
    const s = m.stats || { wu: 0, wen: 0, tong: 0 }
    const score = (s.wu + s.wen + s.tong) / 300
    bonus += 0.3 * (0.6 + score * 0.8)
  }
  return 1 + bonus
}

/**
 * 根据全部建筑等级计算每秒净产出（已扣除上缴消耗）
 * 不考虑民心、税率、季节修正（那些在 store 层叠加）
 * @param {Object} cityLevels - 建筑等级表
 * @param {Object} garrison - 驻守表 { buildingKey: [heroIds] }
 * @param {Function} findHero - 解析武将元数据
 */
export function computeBaseRates(cityLevels, garrison = {}, findHero = null) {
  const rates = { grain: 0, coin: 0, wood: 0, soldier: 0 }
  for (const b of BUILDINGS) {
    const lv = cityLevels[b.key] || 0
    if (lv <= 0) continue
    const prod = b.produce(lv)
    const upk = b.upkeep(lv)
    // 驻守倍率（只作用于该建筑的 produce，不影响 upkeep）
    let gm = 1
    if (findHero && garrison[b.key] && garrison[b.key].length) {
      gm = garrisonMultiplier(garrison[b.key].map((id) => findHero(id)))
    }
    for (const k in prod) rates[k] = (rates[k] || 0) + prod[k] * gm
    for (const k in upk) rates[k] = (rates[k] || 0) - upk[k]
  }
  return rates
}

/**
 * 判断升级是否被解锁（除主公府外，自身等级不得 > 主公府等级；且主公府等级 >= requireLord）
 */
export function canUpgrade(key, cityLevels) {
  const cfg = BUILDING_MAP[key]
  if (!cfg) return { ok: false, reason: '未知建筑' }
  const cur = cityLevels[key] || 0
  if (cur >= cfg.maxLevel) return { ok: false, reason: '已达最大等级' }
  const lordLv = cityLevels.lordHall || 0
  if (key !== 'lordHall' && cur + 1 > lordLv) {
    return { ok: false, reason: `需主公府 Lv${cur + 1}` }
  }
  if (lordLv < cfg.requireLord) {
    return { ok: false, reason: `需主公府 Lv${cfg.requireLord}` }
  }
  return { ok: true }
}
