import { describe, it, expect } from 'vitest'
import {
  SPECIALIZATIONS,
  SPECIALIZATION_MAP,
  SPEC_MAX_STAGE,
  activeStagesOf,
  aggregateSpecEffects,
  nextStageCost
} from '../../src/data/specializations.js'

describe('specializations.activeStagesOf', () => {
  it('stage=0 返回空数组', () => {
    expect(activeStagesOf('civil', 0)).toEqual([])
  })

  it('stage=3 返回前 3 个阶段', () => {
    const s = activeStagesOf('civil', 3)
    expect(s.length).toBe(3)
    expect(s[0].name).toBe('劝农令')
    expect(s[2].name).toBe('安民诏')
  })

  it('未知 specKey 返回空数组', () => {
    expect(activeStagesOf('unknown', 5)).toEqual([])
  })

  it('stage 超过最大值会被截断', () => {
    const s = activeStagesOf('civil', 999)
    expect(s.length).toBe(SPEC_MAX_STAGE)
  })
})

describe('specializations.aggregateSpecEffects', () => {
  it('civil stage 3 粮草倍率为前 3 阶连乘', () => {
    const e = aggregateSpecEffects('civil', 3)
    expect(e.rateMul.grain).toBeCloseTo(1.10 * 1.20 * 1.30, 6)
    expect(e.rateMul.wood).toBeCloseTo(1.10 * 1.20 * 1.30, 6)
    expect(e.moraleBonus).toBe(5)
  })

  it('military stage 5 = 极致武备', () => {
    const e = aggregateSpecEffects('military', 5)
    expect(e.powerMul).toBeCloseTo(1.05 * 1.10 * 1.18 * 1.28 * 1.40, 5)
    expect(e.rateMul.soldier).toBeGreaterThan(3) // 1.15*1.25*1.40*1.60*1.85≈7.4
    expect(e.cooldownMul).toBeCloseTo(0.75 * 0.60 * 0.50, 6)
  })

  it('talent stage 5 累加 heroCapBonus = 1+2+3 = 6', () => {
    const e = aggregateSpecEffects('talent', 5)
    expect(e.heroCapBonus).toBe(6)
    expect(e.heroExpMul).toBeCloseTo(1.20 * 1.40 * 1.70 * 2.20 * 3.00, 4)
  })

  it('stage=0 时所有倍率为基线（1）', () => {
    const e = aggregateSpecEffects('civil', 0)
    expect(e.rateMul.grain).toBe(1)
    expect(e.powerMul).toBe(1)
    expect(e.heroCapBonus).toBe(0)
  })
})

describe('specializations.nextStageCost', () => {
  it('未选时下阶段 = stage 1', () => {
    const c = nextStageCost('civil', 0)
    expect(c.stage).toBe(1)
    expect(c.reputation).toBe(5)
  })

  it('已修第 5 阶时返回 null（已满级）', () => {
    expect(nextStageCost('civil', 5)).toBeNull()
  })

  it('未知 specKey 返回 null', () => {
    expect(nextStageCost('unknown', 0)).toBeNull()
  })
})

describe('specializations 数据完整性', () => {
  it('共 3 个流派', () => {
    expect(SPECIALIZATIONS.length).toBe(3)
    expect(Object.keys(SPECIALIZATION_MAP).sort()).toEqual(['civil', 'military', 'talent'])
  })

  it('每个流派恰好 5 阶段', () => {
    for (const s of SPECIALIZATIONS) {
      expect(s.stages.length).toBe(SPEC_MAX_STAGE)
    }
  })
})
