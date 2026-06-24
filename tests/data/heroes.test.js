import { describe, it, expect } from 'vitest'
import {
  HERO_POOL,
  QUALITY_META,
  TASKS,
  TASK_LIST,
  findHero,
  recruitCostOf
} from '../../src/data/heroes.js'

describe('heroes.findHero', () => {
  it('已知 id 返回武将对象', () => {
    const h = findHero('lvbu')
    expect(h).not.toBeNull()
    expect(h.name).toBe('吕布')
  })

  it('未知 id 返回 null', () => {
    expect(findHero('nonexistent')).toBeNull()
  })

  it('返回的武将带 avatar 字段', () => {
    const h = findHero('zhuge')
    expect(h.avatar).toBeDefined()
    expect(typeof h.avatar).toBe('string')
  })
})

describe('heroes.recruitCostOf', () => {
  it('legend 招募成本最高', () => {
    const legend = recruitCostOf({ quality: 'legend' })
    const common = recruitCostOf({ quality: 'common' })
    expect(legend.coin).toBeGreaterThan(common.coin)
    expect(legend.ap).toBeGreaterThan(common.ap)
  })

  it('common quality 默认 base=1', () => {
    const c = recruitCostOf({ quality: 'common' })
    expect(c.coin).toBe(200)
    expect(c.grain).toBe(100)
    expect(c.ap).toBe(5)
  })

  it('未知品质走 common 兜底', () => {
    const c = recruitCostOf({ quality: 'unknown' })
    expect(c.coin).toBe(200)
  })
})

describe('heroes 卡池完整性', () => {
  it('卡池非空', () => {
    expect(HERO_POOL.length).toBeGreaterThan(50)
  })

  it('每个武将有 id/name/quality/faction/stats', () => {
    for (const h of HERO_POOL) {
      expect(h.id).toBeDefined()
      expect(h.name).toBeDefined()
      expect(['common', 'rare', 'epic', 'legend']).toContain(h.quality)
      expect(['wei', 'shu', 'wu', 'han', 'qun']).toContain(h.faction)
      expect(h.stats).toBeDefined()
    }
  })

  it('id 全局唯一', () => {
    const ids = HERO_POOL.map((h) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('品质权重和为 100', () => {
    const total = Object.values(QUALITY_META).reduce((s, q) => s + q.weight, 0)
    expect(total).toBe(100)
  })
})

describe('heroes TASKS', () => {
  it('恰好 4 个任务（粮/钱/木/兵）', () => {
    expect(TASK_LIST.length).toBe(4)
    expect(TASKS.farm.resKey).toBe('grain')
    expect(TASKS.patrol.resKey).toBe('coin')
    expect(TASKS.drill.resKey).toBe('soldier')
    expect(TASKS.logging.resKey).toBe('wood')
  })
})
