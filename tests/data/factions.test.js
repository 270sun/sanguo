import { describe, it, expect } from 'vitest'
import {
  FACTIONS,
  INITIAL_WORLD,
  FACTION_AI,
  ownerOf,
  factionOf,
  isPlayerOwned,
  neighborsOf
} from '../../src/data/factions.js'
import { MAJOR_IDS } from '../../src/data/territories.js'

describe('factions.ownerOf', () => {
  it('已知州返回正确归属', () => {
    expect(ownerOf(INITIAL_WORLD, 'luoyang')).toBe('player')
    expect(ownerOf(INITIAL_WORLD, 'jizhou')).toBe('yuanshao')
  })

  it('未知州返回 bandits 兜底', () => {
    expect(ownerOf(INITIAL_WORLD, 'unknown')).toBe('bandits')
  })

  it('world 为空时不报错', () => {
    expect(ownerOf(null, 'luoyang')).toBe('bandits')
    expect(ownerOf({}, 'luoyang')).toBe('bandits')
  })
})

describe('factions.isPlayerOwned', () => {
  it('初始世界洛阳属于玩家', () => {
    expect(isPlayerOwned(INITIAL_WORLD, 'luoyang')).toBe(true)
  })

  it('初始世界其它州不属于玩家', () => {
    expect(isPlayerOwned(INITIAL_WORLD, 'jizhou')).toBe(false)
    expect(isPlayerOwned(INITIAL_WORLD, 'yangzhou')).toBe(false)
  })
})

describe('factions.factionOf', () => {
  it('返回对应势力对象', () => {
    expect(factionOf('player').name).toBe('主公')
    expect(factionOf('caocao').shortName).toBe('曹')
  })

  it('未知 key 返回 bandits', () => {
    expect(factionOf('unknown').key).toBe('bandits')
  })
})

describe('factions.neighborsOf', () => {
  it('洛阳的邻居含豫州/兖州', () => {
    const n = neighborsOf('luoyang')
    expect(n).toContain('yuzhou')
    expect(n).toContain('yanzhou')
  })

  it('邻居关系对称（A 是 B 邻居则 B 也是 A 邻居）', () => {
    for (const id of MAJOR_IDS) {
      for (const nb of neighborsOf(id)) {
        expect(neighborsOf(nb)).toContain(id)
      }
    }
  })

  it('未知州返回空数组', () => {
    expect(neighborsOf('unknown')).toEqual([])
  })
})

describe('factions 数据完整性', () => {
  it('INITIAL_WORLD 覆盖所有 13 个主城', () => {
    for (const id of MAJOR_IDS) {
      expect(INITIAL_WORLD[id]).toBeDefined()
    }
    expect(Object.keys(INITIAL_WORLD).length).toBe(MAJOR_IDS.size)
  })

  it('FACTION_AI 每个势力都有 aggression', () => {
    for (const key of Object.keys(FACTION_AI)) {
      expect(typeof FACTION_AI[key].aggression).toBe('number')
      expect(Array.isArray(FACTION_AI[key].prefers)).toBe(true)
    }
  })

  it('player 势力被标记为 isPlayer', () => {
    expect(FACTIONS.player.isPlayer).toBe(true)
  })
})
