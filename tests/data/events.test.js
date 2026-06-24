import { describe, it, expect, vi, afterEach } from 'vitest'
import { EVENTS, EVENT_MAP, rollEvent } from '../../src/data/events.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('events.rollEvent', () => {
  it('能从池里抽到一条事件', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = {
      resources: { coin: 1000, grain: 1000, wood: 1000, soldier: 100 },
      governance: { tech: 50, culture: 50, security: 50, commerce: 50 },
      policy: { morale: 80, taxRate: 1 },
      heroes: [],
      world: {}
    }
    const e = rollEvent(game)
    expect(e).not.toBeNull()
    expect(e.key).toBeDefined()
  })

  it('空池（condition 全部 false）返回 null', () => {
    const game = {}
    const originalEvents = EVENTS.slice()
    EVENTS.length = 0
    try {
      const e = rollEvent(game)
      expect(e).toBeNull()
    } finally {
      EVENTS.push(...originalEvents)
    }
  })
})

describe('events 数据完整性', () => {
  it('EVENTS 非空', () => {
    expect(EVENTS.length).toBeGreaterThan(0)
  })

  it('每个事件都有 key/title/desc/choices', () => {
    for (const e of EVENTS) {
      expect(e.key).toBeDefined()
      expect(e.title).toBeDefined()
      expect(e.desc).toBeDefined()
      expect(Array.isArray(e.choices)).toBe(true)
      expect(e.choices.length).toBeGreaterThan(0)
    }
  })

  it('每个 choice 都有 key/label/run', () => {
    for (const e of EVENTS) {
      for (const c of e.choices) {
        expect(c.key).toBeDefined()
        expect(c.label).toBeDefined()
        expect(typeof c.run).toBe('function')
      }
    }
  })

  it('EVENT_MAP 完全索引到 EVENTS', () => {
    for (const e of EVENTS) {
      expect(EVENT_MAP[e.key]).toBe(e)
    }
  })

  it('事件 key 全局唯一', () => {
    const keys = EVENTS.map((e) => e.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
