/**
 * 十三州郡配置
 * tier 1-4：决定守军战力 / 出征消耗 / 占领奖励 / 特产产出
 * special: 占领后每秒额外产出（叠加到rates）
 * grid: 大致地理位置（用于地图布局，col 1-5, row 1-5）
 */
export const TERRITORIES = [
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

export const TERRITORY_MAP = Object.fromEntries(TERRITORIES.map((t) => [t.id, t]))

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
