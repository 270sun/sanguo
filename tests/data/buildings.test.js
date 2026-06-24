import { describe, it, expect } from 'vitest'
import {
  computeBaseRates,
  garrisonMultiplier,
  canUpgrade,
  BUILDING_MAP
} from '../../src/data/buildings.js'
import { findHero } from '../../src/data/heroes.js'

describe('buildings.computeBaseRates', () => {
  it('空城镇产出全 0', () => {
    const r = computeBaseRates({})
    expect(r.grain).toBe(0)
    expect(r.coin).toBe(0)
    expect(r.wood).toBe(0)
    expect(r.soldier).toBe(0)
  })

  it('只升一个主公府不产生资源（lordHall produce 为空）', () => {
    const r = computeBaseRates({ lordHall: 1 })
    expect(r.grain).toBe(0)
    expect(r.coin).toBe(0)
  })

  it('农田能产生粮草', () => {
    const farmLv = BUILDING_MAP.farm ? 3 : 0
    if (farmLv) {
      const r = computeBaseRates({ farm: farmLv })
      expect(r.grain).toBeGreaterThan(0)
    }
  })

  it('驻守武将能提升产出', () => {
    if (!BUILDING_MAP.farm) return
    const noGarrison = computeBaseRates({ farm: 3 })
    const withGarrison = computeBaseRates(
      { farm: 3 },
      { farm: ['zhuge'] },
      findHero
    )
    expect(withGarrison.grain).toBeGreaterThan(noGarrison.grain)
  })
})

describe('buildings.garrisonMultiplier', () => {
  it('空驻守倍率为 1', () => {
    expect(garrisonMultiplier([])).toBe(1)
    expect(garrisonMultiplier(null)).toBe(1)
  })

  it('单将驻守倍率大于 1', () => {
    const mul = garrisonMultiplier([{ stats: { wu: 60, wen: 60, tong: 60 } }])
    expect(mul).toBeGreaterThan(1)
  })

  it('高品质武将倍率更大', () => {
    const weak = garrisonMultiplier([{ stats: { wu: 30, wen: 30, tong: 30 } }])
    const strong = garrisonMultiplier([{ stats: { wu: 95, wen: 95, tong: 95 } }])
    expect(strong).toBeGreaterThan(weak)
  })

  it('多将驻守倍率累加', () => {
    const one = garrisonMultiplier([{ stats: { wu: 80, wen: 80, tong: 80 } }])
    const two = garrisonMultiplier([
      { stats: { wu: 80, wen: 80, tong: 80 } },
      { stats: { wu: 80, wen: 80, tong: 80 } }
    ])
    expect(two).toBeGreaterThan(one)
  })
})

describe('buildings.canUpgrade', () => {
  it('未知建筑返回 ok=false', () => {
    expect(canUpgrade('unknown', {}).ok).toBe(false)
  })

  it('主公府可从 Lv0 升 Lv1（无前置）', () => {
    expect(canUpgrade('lordHall', {}).ok).toBe(true)
  })

  it('其它建筑不能超过主公府等级', () => {
    if (!BUILDING_MAP.farm) return
    const r = canUpgrade('farm', { lordHall: 1, farm: 1 })
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/主公府/)
  })

  it('已达 maxLevel 拒绝升级', () => {
    const cfg = BUILDING_MAP.lordHall
    const r = canUpgrade('lordHall', { lordHall: cfg.maxLevel })
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/最大/)
  })
})
