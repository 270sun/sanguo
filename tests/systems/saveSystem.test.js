import { describe, it, expect, beforeEach } from 'vitest'
import LZString from 'lz-string'
import {
  saveToLocal,
  loadFromLocal,
  clearLocal,
  exportCode,
  importCode
} from '../../src/systems/saveSystem.js'

const STORAGE_KEY = 'sanguo_save_v1'

// jsdom 默认提供 localStorage；这里手动垫一层保证 node 环境也可跑
if (typeof globalThis.localStorage === 'undefined') {
  const store = {}
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] }
  }
}

beforeEach(() => {
  globalThis.localStorage.clear()
})

describe('saveSystem.saveToLocal / loadFromLocal', () => {
  it('写入后能读回相同对象', () => {
    const state = { resources: { coin: 1234, grain: 567 }, version: 'a' }
    expect(saveToLocal(state)).toBe(true)
    const loaded = loadFromLocal()
    expect(loaded).toEqual(state)
  })

  it('写入的内容带 LZ1| 前缀（已启用压缩）', () => {
    saveToLocal({ a: 1 })
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    expect(raw.startsWith('LZ1|')).toBe(true)
  })

  it('压缩后体积小于原始 JSON（大对象）', () => {
    const big = {
      heroes: Array.from({ length: 100 }, (_, i) => ({
        id: 'hero_' + i,
        level: 1,
        exp: 0,
        tasks: ['patrol', 'drill']
      }))
    }
    const json = JSON.stringify(big)
    saveToLocal(big)
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    const compressedBody = raw.slice(4)
    // 压缩后 UTF16 char 数应明显小于原始 JSON 长度
    expect(compressedBody.length).toBeLessThan(json.length)
  })

  it('空 localStorage 时 loadFromLocal 返回 null', () => {
    expect(loadFromLocal()).toBeNull()
  })
})

describe('saveSystem 兼容旧明文存档', () => {
  it('能读取不带 LZ1| 前缀的明文 JSON（老用户兼容）', () => {
    const state = { resources: { coin: 999 } }
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    expect(loadFromLocal()).toEqual(state)
  })

  it('读取损坏的 JSON 返回 null（不崩溃）', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{not-valid-json')
    expect(loadFromLocal()).toBeNull()
  })

  it('读取损坏的压缩内容返回 null', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'LZ1|@@@invalid-lz-string@@@')
    expect(loadFromLocal()).toBeNull()
  })
})

describe('saveSystem.clearLocal', () => {
  it('清空后 load 返回 null', () => {
    saveToLocal({ a: 1 })
    clearLocal()
    expect(loadFromLocal()).toBeNull()
  })
})

describe('saveSystem export/import code (Base64)', () => {
  it('exportCode 输出可被 LZString 解出', () => {
    const state = { x: 1, y: { z: [1, 2, 3] } }
    const code = exportCode(state)
    const json = LZString.decompressFromBase64(code)
    expect(JSON.parse(json)).toEqual(state)
  })

  it('exportCode -> importCode round-trip 一致', () => {
    const state = { resources: { coin: 88 }, heroes: ['guanyu'] }
    const code = exportCode(state)
    expect(importCode(code)).toEqual(state)
  })

  it('importCode 接收无效码返回 null', () => {
    expect(importCode('@@@not-base64@@@')).toBeNull()
  })
})
