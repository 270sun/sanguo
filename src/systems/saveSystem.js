import LZString from 'lz-string'

const STORAGE_KEY = 'sanguo_save_v1'
/**
 * 压缩存档采用 UTF16 编码（localStorage 是 UTF16 存储，UTF16 压缩比 Base64 节省约 33%）。
 * 写入时所有内容以 'LZ1|' 前缀打头，便于读取时区分历史明文 JSON。
 */
const COMPRESSED_PREFIX = 'LZ1|'

export function saveToLocal(state) {
  try {
    const json = JSON.stringify(state)
    const compressed = LZString.compressToUTF16(json)
    localStorage.setItem(STORAGE_KEY, COMPRESSED_PREFIX + compressed)
    return true
  } catch (e) {
    console.warn('保存失败', e)
    return false
  }
}

const SAVE_DEBOUNCE_MS = 1500
const SAVE_MAX_DELAY_MS = 5000
let _pendingState = null
let _debounceTimer = null
let _idleHandle = null
let _firstScheduleAt = 0
let _lifecycleBound = false

const _ric =
  typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback.bind(window)
    : (cb) => setTimeout(() => cb({ timeRemaining: () => 8, didTimeout: true }), 0)
const _cic =
  typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function'
    ? window.cancelIdleCallback.bind(window)
    : clearTimeout

function _doSave() {
  if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = null }
  if (_idleHandle != null) { _cic(_idleHandle); _idleHandle = null }
  _firstScheduleAt = 0
  if (!_pendingState) return false
  const snap = _pendingState
  _pendingState = null
  return saveToLocal(snap)
}

function _ensureLifecycleHooks() {
  if (_lifecycleBound || typeof window === 'undefined') return
  _lifecycleBound = true
  const flush = () => { if (_pendingState) _doSave() }
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
  window.addEventListener('pagehide', flush)
  window.addEventListener('beforeunload', flush)
}

export function scheduleSave(state) {
  _ensureLifecycleHooks()
  _pendingState = state
  const now = Date.now()
  if (!_firstScheduleAt) _firstScheduleAt = now
  if (_debounceTimer) clearTimeout(_debounceTimer)
  const overdue = now - _firstScheduleAt >= SAVE_MAX_DELAY_MS
  if (overdue) { _doSave(); return }
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null
    if (_idleHandle != null) _cic(_idleHandle)
    _idleHandle = _ric(() => { _idleHandle = null; _doSave() }, { timeout: 800 })
  }, SAVE_DEBOUNCE_MS)
}

export function flushSave() {
  return _doSave()
}

export function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    // 兼容 v1 之前的明文 JSON 存档（首字符为 '{'）
    if (raw.startsWith(COMPRESSED_PREFIX)) {
      const body = raw.slice(COMPRESSED_PREFIX.length)
      const json = LZString.decompressFromUTF16(body)
      if (!json) return null
      return JSON.parse(json)
    }
    return JSON.parse(raw)
  } catch (e) {
    console.warn('读取存档失败', e)
    return null
  }
}

export function clearLocal() {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportCode(state) {
  const json = JSON.stringify(state)
  return LZString.compressToBase64(json)
}

export function importCode(code) {
  try {
    const json = LZString.decompressFromBase64(code)
    if (!json) return null
    return JSON.parse(json)
  } catch (e) {
    console.warn('导入存档码失败', e)
    return null
  }
}
