import { describe, it, expect } from 'vitest'
import {
  BONDS,
  BOND_MAP,
  detectBonds,
  combinePowerMul,
  combineRateBonus
} from '../../src/data/bonds.js'

describe('bonds.detectBonds', () => {
  it('桃园三结义需要关羽+张飞', () => {
    const ids = detectBonds(['guanyu', 'zhangfei']).map((b) => b.id)
    expect(ids).toContain('taoyuan')
  })

  it('五虎上将需要关张赵三人同时存在', () => {
    expect(detectBonds(['guanyu', 'zhangfei']).map((b) => b.id))
      .not.toContain('wuhu')
    expect(detectBonds(['guanyu', 'zhangfei', 'zhaoyun']).map((b) => b.id))
      .toContain('wuhu')
  })

  it('单将吕布即激活飞将临世', () => {
    expect(detectBonds(['lvbu']).map((b) => b.id)).toContain('feijiang')
  })

  it('空集合不激活任何羁绊', () => {
    expect(detectBonds([])).toEqual([])
  })

  it('集齐多个羁绊会全部返回', () => {
    const ids = detectBonds(['guanyu', 'zhangfei', 'zhaoyun', 'lvbu']).map((b) => b.id)
    expect(ids).toEqual(expect.arrayContaining(['taoyuan', 'wuhu', 'feijiang']))
  })
})

describe('bonds.combinePowerMul', () => {
  it('无羁绊返回 1', () => {
    expect(combinePowerMul([])).toBe(1)
  })

  it('多个羁绊连乘', () => {
    const bs = [BOND_MAP.taoyuan, BOND_MAP.feijiang]
    expect(combinePowerMul(bs)).toBeCloseTo(1.3 * 1.4, 6)
  })
})

describe('bonds.combineRateBonus', () => {
  it('按资源类型逐项累加', () => {
    const bs = [BOND_MAP.taoyuan, BOND_MAP.wuhu]
    const out = combineRateBonus(bs)
    expect(out.soldier).toBeCloseTo(0.6 + 0.8, 6)
    expect(out.coin).toBeCloseTo(0.8, 6)
    expect(out.grain).toBe(0)
    expect(out.wood).toBe(0)
  })
})

describe('bonds 数据完整性', () => {
  it('BOND_MAP 覆盖所有 BONDS', () => {
    expect(Object.keys(BOND_MAP).length).toBe(BONDS.length)
  })

  it('每个羁绊都有 members + powerMul', () => {
    for (const b of BONDS) {
      expect(Array.isArray(b.members)).toBe(true)
      expect(b.members.length).toBeGreaterThan(0)
      expect(typeof b.powerMul).toBe('number')
    }
  })
})
