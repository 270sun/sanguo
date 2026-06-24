import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { deepMergeDefaults, hydrateSaveData } from '../../src/stores/game.js'

beforeEach(() => {
  // hydrateSaveData 内部会调用 createInitialState，依赖 Pinia 上下文
  setActivePinia(createPinia())
})

describe('deepMergeDefaults', () => {
  it('data 缺失字段由 defaults 补齐', () => {
    const defaults = { a: 1, b: { x: 10, y: 20 } }
    const data = { b: { x: 99 } }
    const merged = deepMergeDefaults(defaults, data)
    expect(merged).toEqual({ a: 1, b: { x: 99, y: 20 } })
  })

  it('data 中的 leaf 值覆盖 defaults', () => {
    const defaults = { coin: 100, grain: 200 }
    const data = { coin: 999 }
    expect(deepMergeDefaults(defaults, data)).toEqual({ coin: 999, grain: 200 })
  })

  it('数组按 data 整体替换（不拼接）', () => {
    const defaults = { items: [] }
    const data = { items: ['a', 'b'] }
    const merged = deepMergeDefaults(defaults, data)
    expect(merged.items).toEqual(['a', 'b'])
  })

  it('数组在 defaults 有内容时也整体替换为 data 的', () => {
    const defaults = { items: ['default1', 'default2'] }
    const data = { items: ['user'] }
    expect(deepMergeDefaults(defaults, data).items).toEqual(['user'])
  })

  it('深嵌套对象递归合并', () => {
    const defaults = { lv1: { lv2: { lv3: { a: 1, b: 2 } } } }
    const data = { lv1: { lv2: { lv3: { a: 99 } } } }
    expect(deepMergeDefaults(defaults, data).lv1.lv2.lv3).toEqual({ a: 99, b: 2 })
  })

  it('data 中独有的字段被保留（向前兼容）', () => {
    const defaults = { a: 1 }
    const data = { a: 1, futureField: 'X' }
    expect(deepMergeDefaults(defaults, data).futureField).toBe('X')
  })

  it('null/undefined 当作"缺失"处理', () => {
    const defaults = { a: { x: 1 } }
    const data = { a: null }
    expect(deepMergeDefaults(defaults, data).a).toEqual({ x: 1 })
  })
})

describe('hydrateSaveData', () => {
  it('空对象会被填补成完整 state', () => {
    const out = hydrateSaveData({})
    expect(out.resources).toBeDefined()
    expect(out.resources.coin).toBeGreaterThan(0) // 初始值 500
    expect(out.city).toBeDefined()
    expect(out.governance).toBeDefined()
  })

  it('用户的资源数值被保留', () => {
    const out = hydrateSaveData({ resources: { coin: 99999 } })
    expect(out.resources.coin).toBe(99999)
    expect(out.resources.grain).toBeGreaterThan(0) // 缺失字段被默认值补齐
  })

  it('玩家已占领的州 owner 被锁定为 player', () => {
    const out = hydrateSaveData({
      territories: ['luoyang', 'yuzhou'],
      world: {
        luoyang: { owner: 'bandits', power: 999 },
        yuzhou: { owner: 'caocao', power: 500 }
      }
    })
    expect(out.world.luoyang.owner).toBe('player')
    expect(out.world.luoyang.power).toBe(0)
    expect(out.world.yuzhou.owner).toBe('player')
  })

  it('武将缺字段自动补 level=1/exp=0/task=null', () => {
    const out = hydrateSaveData({
      heroes: [{ id: 'guanyu' }, { id: 'zhangfei', level: 5 }]
    })
    expect(out.heroes[0].level).toBe(1)
    expect(out.heroes[0].exp).toBe(0)
    expect(out.heroes[0].task).toBeNull()
    expect(out.heroes[1].level).toBe(5) // 已有字段不覆盖
  })

  it('过期 eventNextAt 会被重新摇骰', () => {
    const veryOld = Date.now() - 999999999
    const out = hydrateSaveData({ eventNextAt: veryOld })
    expect(out.eventNextAt).toBeGreaterThan(Date.now())
  })

  it('近期 eventNextAt 保留', () => {
    const future = Date.now() + 30 * 1000
    const out = hydrateSaveData({ eventNextAt: future })
    expect(out.eventNextAt).toBe(future)
  })
})
