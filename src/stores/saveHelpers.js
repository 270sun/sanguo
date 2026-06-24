/**
 * 存档相关纯工具函数 —— 与 Pinia store 解耦的最小工具集。
 *
 * 抽离原则：
 *   - 只放无 store / 无 DOM 依赖的纯函数
 *   - 同名导出，调用方零行为变化
 *   - 便于 vitest 单元测试与跨 store 复用
 */

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

/**
 * 默认值深合并：对象递归合并，数组与原值整体替换，保留 data 中默认未声明的字段。
 *
 * 行为对照：
 *   - defaults 是叶子（非 plain object）→ 返回 data 优先（undefined 时回退 defaults）
 *   - 双方均为 plain object → 递归合并
 *   - 数组 / 原值 → data 覆盖
 *   - data 多出 defaults 没有的 key → 原样保留（向前兼容旧档新字段）
 */
export function deepMergeDefaults(defaults, data) {
  if (!isPlainObject(defaults)) return data === undefined ? defaults : data
  const out = {}
  for (const k of Object.keys(defaults)) {
    const dv = defaults[k]
    const sv = data?.[k]
    if (sv === undefined || sv === null) {
      out[k] = dv
    } else if (isPlainObject(dv) && isPlainObject(sv)) {
      out[k] = deepMergeDefaults(dv, sv)
    } else {
      out[k] = sv
    }
  }
  if (isPlainObject(data)) {
    for (const k of Object.keys(data)) {
      if (!(k in out)) out[k] = data[k]
    }
  }
  return out
}
