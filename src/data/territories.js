/**
 * 十三州郡 + 装饰性小郡县（共 58 城）
 *
 * 主城（kind: 'major'）：13 州治所，进入世界战争系统（INITIAL_WORLD + AI），
 *                       玩家攻陷后产生 special 产出。
 *
 * 小城（kind: 'minor'）：45 个东汉真实郡县，**不进**世界 AI 系统，
 *                       owner 跟随父州（player/bandits/...），玩家可单独征伐占领，
 *                       占领后自动驻防，只贡献 special 产出与州郡计数。
 *
 * 20 个有名小城：单独写一档；剩 25 个由 deriveMinor() 从父州 ×0.35 + ±15% 推导（seed 用 id hash）。
 *
 * tier 1-4：决定守军战力 / 出征消耗 / 占领奖励 / 特产产出
 */

/** ===== 13 州主城 ===== */
const MAJOR = [
  // === 中原 (起点) ===
  { id: 'luoyang',   name: '司隶·洛阳', tier: 0, grid: { col: 3, row: 3 },
    defender: '汉室宗庙', power: 0,
    cost: { soldier: 0, grain: 0, ap: 0 },
    reward: { coin: 0, grain: 0, reputation: 5 },
    special: { coin: 0.5, grain: 0.5 },
    desc: '王都所在·主公龙兴之地' },

  // === Tier 1: 周边小郡 ===
  { id: 'yuzhou',    name: '豫州', tier: 1, grid: { col: 3, row: 4 },
    defender: '黄巾余党', power: 150,
    cost: { soldier: 50, grain: 200, ap: 10 },
    reward: { coin: 800, grain: 400, reputation: 3 },
    special: { grain: 0.6 },
    desc: '中原腹地·黄巾盘踞' },
  { id: 'yanzhou',   name: '兖州', tier: 1, grid: { col: 4, row: 3 },
    defender: '陈宫旧部', power: 200,
    cost: { soldier: 60, grain: 240, ap: 12 },
    reward: { coin: 1000, grain: 500, reputation: 4 },
    special: { coin: 0.5 },
    desc: '兵家必争·濮阳重镇' },
  { id: 'qingzhou',  name: '青州', tier: 1, grid: { col: 5, row: 2 },
    defender: '青州黄巾', power: 220,
    cost: { soldier: 70, grain: 260, ap: 12 },
    reward: { coin: 900, grain: 600, reputation: 4, soldier: 50 },
    special: { soldier: 0.3 },
    desc: '盐铁富庶·亦寇亦民' },

  // === Tier 2: 大州 ===
  { id: 'jizhou',    name: '冀州', tier: 2, grid: { col: 4, row: 1 },
    defender: '袁绍残部', power: 450,
    cost: { soldier: 150, grain: 500, ap: 18 },
    reward: { coin: 2500, grain: 1500, reputation: 8 },
    special: { coin: 0.8, grain: 0.5 },
    desc: '河北重镇·人口殷实' },
  { id: 'xuzhou',    name: '徐州', tier: 2, grid: { col: 5, row: 3 },
    defender: '陶谦遗将', power: 400,
    cost: { soldier: 130, grain: 450, ap: 16 },
    reward: { coin: 3000, grain: 1000, reputation: 7 },
    special: { coin: 1.2 },
    desc: '商贾云集·盐铜之利' },
  { id: 'jingzhou',  name: '荆州', tier: 2, grid: { col: 2, row: 4 },
    defender: '蔡瑁水军', power: 500,
    cost: { soldier: 160, grain: 600, ap: 20 },
    reward: { coin: 2000, grain: 2500, reputation: 9, wood: 600 },
    special: { grain: 1.2, wood: 0.6 },
    desc: '荆襄沃野·鱼米之乡' },
  { id: 'yangzhou',  name: '扬州', tier: 2, grid: { col: 5, row: 4 },
    defender: '孙吴水寨', power: 550,
    cost: { soldier: 180, grain: 600, ap: 20 },
    reward: { coin: 3500, grain: 1500, reputation: 9 },
    special: { coin: 1.5, wood: 0.4 },
    desc: '江东富庶·渔盐之利' },

  // === Tier 3: 边疆/险地 ===
  { id: 'youzhou',   name: '幽州', tier: 3, grid: { col: 5, row: 1 },
    defender: '乌桓铁骑', power: 800,
    cost: { soldier: 300, grain: 900, ap: 25 },
    reward: { coin: 1500, grain: 1500, reputation: 12, soldier: 300 },
    special: { soldier: 1.0 },
    desc: '北疆苦寒·骁勇之地' },
  { id: 'bingzhou',  name: '并州', tier: 3, grid: { col: 3, row: 1 },
    defender: '匈奴部落', power: 850,
    cost: { soldier: 320, grain: 950, ap: 25 },
    reward: { coin: 1800, grain: 1200, reputation: 13, soldier: 250 },
    special: { soldier: 0.8, coin: 0.4 },
    desc: '塞外险冲·胡汉杂居' },
  { id: 'liangzhou', name: '凉州', tier: 3, grid: { col: 1, row: 2 },
    defender: '羌氐联军', power: 900,
    cost: { soldier: 350, grain: 1000, ap: 28 },
    reward: { coin: 2000, grain: 1000, reputation: 14, soldier: 350 },
    special: { soldier: 1.2 },
    desc: '西凉烈马·铁骑横行' },
  { id: 'yizhou',    name: '益州', tier: 3, grid: { col: 1, row: 4 },
    defender: '刘璋部曲', power: 700,
    cost: { soldier: 260, grain: 800, ap: 22 },
    reward: { coin: 2500, grain: 3000, reputation: 12, wood: 1000 },
    special: { grain: 1.5, wood: 0.8 },
    desc: '天府之国·沃野千里' },

  // === Tier 4: 最难 ===
  { id: 'jiaozhou',  name: '交州', tier: 4, grid: { col: 2, row: 5 },
    defender: '南蛮王部', power: 1300,
    cost: { soldier: 500, grain: 1500, ap: 35 },
    reward: { coin: 5000, grain: 2000, reputation: 20, jadeShard: 5 },
    special: { coin: 2.0, grain: 0.8 },
    desc: '南疆瘴气·百越聚居·玉石之乡' }
]

/** 主城 id 列表（供 store 判断"是否进入世界 AI 系统"） */
export const MAJOR_IDS = new Set(MAJOR.map((t) => t.id))

/** ===== 20 个有名小城（手写档） ===== */
const NAMED_MINOR = [
  // 北疆
  { id: 'taiyuan',    parent: 'bingzhou',  name: '太原', tier: 2,
    defender: '匈奴游骑', power: 320, special: { soldier: 0.4, coin: 0.2 },
    desc: '并州治所·北疆雄关' },
  { id: 'wuwei',      parent: 'liangzhou', name: '武威', tier: 2,
    defender: '羌氐前锋', power: 300, special: { soldier: 0.5 },
    desc: '河西走廊·商旅之冲' },
  { id: 'dunhuang',   parent: 'liangzhou', name: '敦煌', tier: 3,
    defender: '西域商团', power: 380, special: { coin: 0.6, jadeShard: 0.02 },
    desc: '丝路咽喉·玉石之源' },
  { id: 'liaodong',   parent: 'youzhou',   name: '辽东', tier: 3,
    defender: '公孙部曲', power: 360, special: { soldier: 0.6 },
    desc: '辽东半岛·公孙称雄' },

  // 中原
  { id: 'changan',    parent: 'luoyang',   name: '长安', tier: 3,
    defender: '李傕余孽', power: 520, special: { coin: 1.0, grain: 0.4, reputation: 0.03 },
    desc: '西京旧都·汉室根基' },
  { id: 'yecheng',    parent: 'jizhou',    name: '邺城', tier: 3,
    defender: '袁氏故吏', power: 600, special: { coin: 0.8, grain: 0.6 },
    desc: '河北雄镇·袁氏王都' },
  { id: 'chenliu',    parent: 'yanzhou',   name: '陈留', tier: 2,
    defender: '兖州残部', power: 260, special: { grain: 0.5 },
    desc: '曹操起兵之地' },
  { id: 'beihai',     parent: 'qingzhou',  name: '北海', tier: 2,
    defender: '孔融儒兵', power: 280, special: { coin: 0.4, reputation: 0.02 },
    desc: '孔融之治·渤海盐利' },
  { id: 'rounan',     parent: 'yuzhou',    name: '汝南', tier: 2,
    defender: '黄巾大渠', power: 240, special: { grain: 0.7 },
    desc: '汝颍多士·袁氏故乡' },
  { id: 'yingchuan',  parent: 'yuzhou',    name: '颍川', tier: 2,
    defender: '颍川书生', power: 220, special: { reputation: 0.04, coin: 0.3 },
    desc: '荀彧荀攸·王佐之乡' },
  { id: 'pengcheng',  parent: 'xuzhou',    name: '彭城', tier: 2,
    defender: '陶谦旧部', power: 280, special: { coin: 0.7 },
    desc: '徐州咽喉·南北通衢' },
  { id: 'xiapi',      parent: 'xuzhou',    name: '下邳', tier: 3,
    defender: '吕布残骑', power: 460, special: { coin: 0.6, soldier: 0.3 },
    desc: '吕布殒命之处' },

  // 江南
  { id: 'hanzhong',   parent: 'yizhou',    name: '汉中', tier: 3,
    defender: '张鲁五斗', power: 480, special: { grain: 0.8 },
    desc: '蜀地门户·米贼盘踞' },
  { id: 'chengdu',    parent: 'yizhou',    name: '成都', tier: 3,
    defender: '刘璋亲军', power: 520, special: { grain: 1.0, wood: 0.5, coin: 0.4 },
    desc: '天府心脏·锦官之城' },
  { id: 'xiangyang',  parent: 'jingzhou',  name: '襄阳', tier: 3,
    defender: '蒯越文聘', power: 540, special: { coin: 0.5, grain: 0.6 },
    desc: '荆楚雄关·南北锁钥' },
  { id: 'jiangling',  parent: 'jingzhou',  name: '江陵', tier: 2,
    defender: '荆州水军', power: 360, special: { grain: 0.7, wood: 0.4 },
    desc: '江汉平原·楚国旧都' },
  { id: 'changsha',   parent: 'jingzhou',  name: '长沙', tier: 2,
    defender: '韩玄部曲', power: 320, special: { grain: 0.5, coin: 0.2 },
    desc: '湘水之畔·五溪门户' },
  { id: 'jianye',     parent: 'yangzhou',  name: '建业', tier: 3,
    defender: '孙氏水卒', power: 580, special: { coin: 1.0, wood: 0.4 },
    desc: '江东心腹·东吴帝业' },
  { id: 'wujun',      parent: 'yangzhou',  name: '吴郡', tier: 2,
    defender: '陆氏宗党', power: 380, special: { coin: 0.8 },
    desc: '吴中富庶·士族盘踞' },
  { id: 'huiji',      parent: 'yangzhou',  name: '会稽', tier: 3,
    defender: '山越部众', power: 420, special: { coin: 0.5, wood: 0.5 },
    desc: '会稽郡治·山越剽悍' },

  // 南陲
  { id: 'nanhai',     parent: 'jiaozhou',  name: '南海', tier: 4,
    defender: '南海蛮王', power: 980, special: { coin: 1.5, jadeShard: 0.03 },
    desc: '岭南海港·珠玑通海' }
]

/** ===== 25 个剩余小城（自动派生档） ===== */
/**
 * 简单字符串 hash（保证同一 id 每局结果一致）
 */
function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

/** 在 [-0.15, +0.15] 之间，基于 id 稳定随机 */
function randPct(id, salt = 0) {
  const h = hashStr(id + ':' + salt)
  const r = (h % 1000) / 1000   // 0..1
  return (r - 0.5) * 0.3
}

/**
 * 从父州派生一个小城档：
 *  - power = parent.power × 0.35 × (1 ± 15%)
 *  - cost  = parent.cost  × 0.35 × (1 ± 15%)
 *  - reward = parent.reward × 0.4 × (1 ± 15%)
 *  - special = parent.special × 0.5 × (1 ± 15%)
 *  - tier   = max(1, parent.tier - 1)
 */
function deriveMinor(id, name, parentId, defender) {
  const parent = MAJOR.find((t) => t.id === parentId)
  if (!parent) {
    return { id, name, parent: parentId, tier: 1, kind: 'minor', defender,
             power: 100, cost: { soldier: 30, grain: 100, ap: 6 },
             reward: { coin: 300, grain: 200, reputation: 1 }, special: {}, desc: name + '·边鄙小邑' }
  }
  const fp = 0.35 * (1 + randPct(id, 'p'))
  const fc = 0.35 * (1 + randPct(id, 'c'))
  const fr = 0.4  * (1 + randPct(id, 'r'))
  const fs = 0.5  * (1 + randPct(id, 's'))
  const cost = {
    soldier: Math.max(10, Math.round(parent.cost.soldier * fc)),
    grain:   Math.max(20, Math.round(parent.cost.grain   * fc)),
    ap:      Math.max(3,  Math.round(parent.cost.ap      * fc))
  }
  const reward = {}
  for (const k of Object.keys(parent.reward)) {
    reward[k] = Math.max(1, Math.round(parent.reward[k] * fr))
  }
  const special = {}
  for (const k of Object.keys(parent.special || {})) {
    special[k] = Math.round(parent.special[k] * fs * 100) / 100
  }
  return {
    id, name, parent: parentId, kind: 'minor',
    tier: Math.max(1, parent.tier - 1),
    defender,
    power: Math.max(80, Math.round(parent.power * fp)),
    cost, reward, special,
    desc: `${parent.name.replace(/^.+·/, '')}所属·${name}`
  }
}

/** 剩余 25 个小城（按地理位置归属父州，由 deriveMinor 推导数值） */
const DERIVED_MINOR = [
  // 并州
  deriveMinor('yanmen',     '雁门',  'bingzhou', '匈奴游骑'),
  deriveMinor('yunzhong',   '云中',  'bingzhou', '鲜卑斥候'),
  deriveMinor('shangdang',  '上党',  'bingzhou', '黑山贼'),

  // 幽州
  deriveMinor('yuyang',     '渔阳',  'youzhou',  '乌桓散骑'),
  deriveMinor('youbeiping', '右北平','youzhou',  '辽西部众'),
  deriveMinor('jixian',     '蓟县',  'youzhou',  '幽州都尉'),

  // 凉州
  deriveMinor('zhangye',    '张掖',  'liangzhou','西凉马贼'),
  deriveMinor('jincheng',   '金城',  'liangzhou','韩遂残部'),

  // 冀州
  deriveMinor('qinghe',     '清河',  'jizhou',   '袁氏遗丁'),
  deriveMinor('changshan',  '常山',  'jizhou',   '黑山贼帅'),

  // 司隶
  deriveMinor('honglong',   '弘农',  'luoyang',  '关西流寇'),
  deriveMinor('henei',      '河内',  'luoyang',  '王匡旧部'),

  // 兖州
  deriveMinor('puyang',     '濮阳',  'yanzhou',  '吕布散兵'),
  deriveMinor('taishan',    '泰山',  'yanzhou',  '泰山贼帅'),

  // 青州
  deriveMinor('donglai',    '东莱',  'qingzhou', '海贼水匪'),
  deriveMinor('qiguo',      '齐国',  'qingzhou', '齐国守军'),

  // 徐州
  deriveMinor('guangling',  '广陵',  'xuzhou',   '陈登水营'),

  // 益州
  deriveMinor('bajun',      '巴郡',  'yizhou',   '巴人部落'),
  deriveMinor('yongchang',  '永昌',  'yizhou',   '南中蛮人'),

  // 荆州
  deriveMinor('wuling',     '武陵',  'jingzhou', '武陵蛮王'),

  // 扬州
  deriveMinor('lujiang',    '庐江',  'yangzhou', '陈兰雷薄'),
  deriveMinor('yuzhang',    '豫章',  'yangzhou', '宗贼部曲'),

  // 交州
  deriveMinor('cangwu',     '苍梧',  'jiaozhou', '士氏宗党'),
  deriveMinor('rinan',      '日南',  'jiaozhou', '林邑蛮人')
]

/** 给 NAMED_MINOR 补齐 kind / cost / reward（手写部分只写了核心字段） */
function fillNamed(t) {
  const parent = MAJOR.find((m) => m.id === t.parent)
  const fc = 0.40 + (randPct(t.id, 'c') * 0.5)
  const fr = 0.45 + (randPct(t.id, 'r') * 0.5)
  return {
    ...t,
    kind: 'minor',
    cost: t.cost || {
      soldier: Math.max(15, Math.round(parent.cost.soldier * fc)),
      grain:   Math.max(40, Math.round(parent.cost.grain   * fc)),
      ap:      Math.max(5,  Math.round(parent.cost.ap      * fc))
    },
    reward: t.reward || (() => {
      const out = {}
      for (const k of Object.keys(parent.reward)) {
        out[k] = Math.max(1, Math.round(parent.reward[k] * fr))
      }
      return out
    })()
  }
}

const NAMED_FILLED = NAMED_MINOR.map(fillNamed)

/** 给主城打上 kind: 'major' 标记 */
const MAJOR_TAGGED = MAJOR.map((t) => ({ ...t, kind: 'major' }))

/** ===== 对外导出：13 主 + 45 小 = 58 城 ===== */
export const TERRITORIES = [...MAJOR_TAGGED, ...NAMED_FILLED, ...DERIVED_MINOR]

export const TERRITORY_MAP = Object.fromEntries(TERRITORIES.map((t) => [t.id, t]))

/** 仅 13 州主城（供世界 AI / EndingModal 进度分母用） */
export const MAJOR_TERRITORIES = MAJOR_TAGGED

export const TIER_META = {
  0: { label: '王畿', color: '#d4af37' },
  1: { label: '易', color: '#4d7a4c' },
  2: { label: '中', color: '#4a90e2' },
  3: { label: '难', color: '#a35be5' },
  4: { label: '极', color: '#b8362c' }
}

export const BATTLE_COOLDOWN_SEC = 60   // 同一州郡战败后冷却

/**
 * 计算我方队伍战力
 * heroes: 已招募武将对象数组 (含 level)
 * heroMeta: findHero(id) 返回的卡池信息
 */
export function computePartyPower(party) {
  return party.reduce((sum, h) => {
    const s = h.meta?.stats || { wu: 0, wen: 0, tong: 0 }
    const lvMul = 1 + ((h.level || 1) - 1) * 0.15
    // 武力权重较高，统率次之，智谋第三
    return sum + Math.round((s.wu * 1.0 + s.tong * 0.8 + s.wen * 0.6) * lvMul)
  }, 0)
}

/**
 * 战斗结算
 * 我方战力 vs 守军战力，加入 ±15% 随机扰动
 * 返回 { win, ourRoll, enemyRoll, ratio }
 */
export function resolveBattle(ourPower, enemyPower) {
  const ourRoll = Math.round(ourPower * (0.85 + Math.random() * 0.3))
  const enemyRoll = Math.round(enemyPower * (0.85 + Math.random() * 0.3))
  return {
    win: ourRoll >= enemyRoll,
    ourRoll,
    enemyRoll,
    ratio: enemyRoll === 0 ? 99 : Math.round((ourRoll / enemyRoll) * 100) / 100
  }
}

export default TERRITORIES
