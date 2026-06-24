import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  computePartyPower,
  resolveBattle,
  TERRITORIES,
  TERRITORY_MAP,
  MAJOR_IDS,
  MAJOR_TERRITORIES,
  BATTLE_COOLDOWN_SEC
} from '../../src/data/territories.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('territories.computePartyPower', () => {
  it('空队伍战力为 0', () => {
    expect(computePartyPower([])).toBe(0)
  })

  it('Lv1 武将战力 = wu + tong*0.8 + wen*0.6', () => {
    const party = [{
      level: 1,
      meta: { stats: { wu: 94, wen: 35, tong: 70 } }
    }]
    const expected = Math.round(94 * 1.0 + 70 * 0.8 + 35 * 0.6)
    expect(computePartyPower(party)).toBe(expected)
  })

  it('Lv 越高战力越大（+15%/Lv）', () => {
    const stats = { wu: 90, wen: 50, tong: 80 }
    const a = computePartyPower([{ level: 1, meta: { stats } }])
    const b = computePartyPower([{ level: 5, meta: { stats } }])
    expect(b).toBeGreaterThan(a)
  })

  it('缺少 meta 时按 0 处理', () => {
    expect(computePartyPower([{ level: 1 }])).toBe(0)
  })
})

describe('territories.resolveBattle', () => {
  it('压倒性兵力优势必胜', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // 都用中位扰动
    const r = resolveBattle(500, 100)
    expect(r.win).toBe(true)
    expect(r.ourRoll).toBeGreaterThan(r.enemyRoll)
  })

  it('压倒性兵力劣势必败', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const r = resolveBattle(100, 500)
    expect(r.win).toBe(false)
  })

  it('171 vs 150 在中位扰动下胜负判定（历史 bug 回归）', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const r = resolveBattle(171, 150)
    expect(r.win).toBe(true)
    expect(r.ratio).toBeGreaterThan(1)
  })

  it('返回 ratio 字段反映强弱比例', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const r = resolveBattle(200, 100)
    expect(r.ratio).toBeCloseTo(2, 0)
  })

  it('敌方为 0 时返回特殊 ratio=99', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const r = resolveBattle(100, 0)
    expect(r.ratio).toBe(99)
    expect(r.win).toBe(true)
  })
})

describe('territories 数据完整性', () => {
  it('共 58 城（13 主 + 20 named + 25 derived）', () => {
    expect(TERRITORIES.length).toBe(58)
  })

  it('MAJOR_IDS 恰好 13 个', () => {
    expect(MAJOR_IDS.size).toBe(13)
    expect(MAJOR_TERRITORIES.length).toBe(13)
  })

  it('每个 territory 都能在 TERRITORY_MAP 查到', () => {
    for (const t of TERRITORIES) {
      expect(TERRITORY_MAP[t.id]).toBeDefined()
      expect(TERRITORY_MAP[t.id].id).toBe(t.id)
    }
  })

  it('每个小城都有 parent 字段且指向已知主城', () => {
    const minor = TERRITORIES.filter((t) => t.kind === 'minor')
    for (const m of minor) {
      expect(m.parent).toBeDefined()
      expect(MAJOR_IDS.has(m.parent)).toBe(true)
    }
  })

  it('BATTLE_COOLDOWN_SEC 为正整数', () => {
    expect(BATTLE_COOLDOWN_SEC).toBeGreaterThan(0)
    expect(Number.isInteger(BATTLE_COOLDOWN_SEC)).toBe(true)
  })
})
