import { describe, it, expect } from 'vitest'
import {
  SEASONS,
  SEASON_LEN_SEC,
  seasonOfElapsed,
  seasonProgressOfElapsed,
  yearOfElapsed,
  dayOfElapsed,
  buffSummary
} from '../../src/data/season.js'

describe('season.seasonOfElapsed', () => {
  it('第 0 秒为春', () => {
    expect(seasonOfElapsed(0).key).toBe('spring')
  })

  it('SEASON_LEN_SEC 秒后切到夏', () => {
    expect(seasonOfElapsed(SEASON_LEN_SEC).key).toBe('summer')
  })

  it('2 倍长度后切到秋', () => {
    expect(seasonOfElapsed(SEASON_LEN_SEC * 2).key).toBe('autumn')
  })

  it('3 倍长度后切到冬', () => {
    expect(seasonOfElapsed(SEASON_LEN_SEC * 3).key).toBe('winter')
  })

  it('4 倍长度后回到春（一年循环）', () => {
    expect(seasonOfElapsed(SEASON_LEN_SEC * 4).key).toBe('spring')
  })
})

describe('season.seasonProgressOfElapsed', () => {
  it('季节开头 progress=0', () => {
    expect(seasonProgressOfElapsed(0)).toBe(0)
  })

  it('季节中点 progress≈0.5', () => {
    expect(seasonProgressOfElapsed(SEASON_LEN_SEC / 2)).toBeCloseTo(0.5, 2)
  })

  it('progress 永远 ≤ 1', () => {
    expect(seasonProgressOfElapsed(SEASON_LEN_SEC - 0.001)).toBeLessThan(1)
  })
})

describe('season.yearOfElapsed', () => {
  it('第一年为 184（黄巾起义之年）', () => {
    expect(yearOfElapsed(0)).toBe(184)
  })

  it('一周年后 = 185', () => {
    expect(yearOfElapsed(SEASON_LEN_SEC * 4)).toBe(185)
  })
})

describe('season.dayOfElapsed', () => {
  it('季节开头为 1 月 1 日', () => {
    expect(dayOfElapsed(0)).toBe(1)
  })

  it('季节末尾不超过 30', () => {
    expect(dayOfElapsed(SEASON_LEN_SEC - 1)).toBeLessThanOrEqual(30)
  })
})

describe('season.buffSummary', () => {
  it('春的描述包含粮+10%', () => {
    const txt = buffSummary(SEASONS[0])
    expect(txt).toMatch(/粮\+10%/)
  })

  it('冬的描述包含战力+20%', () => {
    const winter = SEASONS.find((s) => s.key === 'winter')
    const txt = buffSummary(winter)
    expect(txt).toMatch(/战力\+20%/)
  })
})

describe('season 数据完整性', () => {
  it('恰好 4 季', () => {
    expect(SEASONS.length).toBe(4)
  })

  it('每季都有 rates 4 项 + powerMul + eventBias', () => {
    for (const s of SEASONS) {
      expect(Object.keys(s.rates).sort()).toEqual(['coin', 'grain', 'soldier', 'wood'])
      expect(typeof s.powerMul).toBe('number')
      expect(s.eventBias).toBeDefined()
    }
  })
})
