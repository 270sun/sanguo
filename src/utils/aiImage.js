/**
 * 图片资源工具（本地优先 + CDN 兜底版）
 *
 *  优先级：
 *    1. 本地 AI 生成图（ComfyUI / SDXL，由 scripts/gen-assets.mjs 产出到 public/img/）
 *    2. 兜底 CDN —— DiceBear (武将) / Picsum (事件/建筑/背景)
 *
 *  本地图集合由构建期硬编码（LOCAL_*_SET），运行期 O(1) 查询，
 *  既无 onerror 闪烁，也无额外网络探测。
 *
 *  新增本地图后：只需把对应 id/key 加进 LOCAL_*_SET 即可。
 */

/* ============================================================
 *  本地图清单 —— 与 scripts/gen-assets.mjs 的产物严格对应
 * ============================================================ */

const LOCAL_HERO_SET = new Set([
  'caocao', 'caohong', 'caopi', 'caoren', 'caorenmin', 'caoxiu', 'caozhang', 'caozhen',
  'chenggong', 'chengpu', 'dianwei', 'diaochan', 'dingfeng', 'dongzhuo', 'erqiao_da',
  'fazheng', 'fuxi', 'ganning', 'gaoxiang', 'gongsunzan', 'guanning', 'guanping',
  'guanyu', 'gulong', 'guojia', 'hanke', 'huafa', 'huanggai', 'huangzhong', 'huatuo',
  'huaxiong', 'jiangqin', 'jiangwei', 'jianyong', 'jiaxu', 'liaohua', 'lidian',
  'lingong', 'liubang', 'liubei', 'liushaoshou', 'liuzhang', 'liyan', 'lufeng',
  'lusu', 'luxun', 'lvbu', 'lvmeng', 'machao', 'mafu', 'majiale', 'mancong', 'maojie',
  'mengda', 'mengyou', 'mizhu', 'pangtong', 'panzhang', 'sima', 'simashi', 'simazhao',
  'sunce', 'sunjian', 'sunqian', 'sunquan', 'sunshangxiang', 'taishici', 'wangping',
  'wangxiang', 'weiyan', 'wenchou', 'wuyi', 'xiahoudun', 'xiahouyuan', 'xuchu',
  'xuhuang', 'xunyu', 'xushen', 'yanliang', 'yuanshao', 'yueyi', 'yujin', 'yujishi',
  'zhangfei', 'zhanggu', 'zhanghe', 'zhanghong', 'zhangliao', 'zhangni', 'zhangyi',
  'zhaoyun', 'zhongyao', 'zhouyou', 'zhouyu', 'zhouyu_jr', 'zhuge', 'zhugejin',
  'zhuran', 'zhuzhi', 'zuoci'
])

const LOCAL_BUILDING_SET = new Set([
  'lordHall', 'farm', 'market', 'lumber', 'barrack',
  'academy', 'inn', 'strategist', 'workshop'
])

const LOCAL_EVENT_SET = new Set([
  'disaster', 'crime', 'envoy', 'market', 'history', 'culture', 'gossip'
])

const HAS_LOCAL_BG = true

/**
 * 本地图根路径前缀
 * 兼容 GitHub Pages 子路径部署：本地 dev → '/'，CI 构建 → '/sanguo/'
 * （读自 vite.config.js 的 base，无运行时副作用）
 */
const IMG_BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/') + 'img/'

/** 给上层可选：判断某资源是否走本地（用于显示"AI生成"角标等） */
export function hasLocalAsset(kind, id) {
  switch (kind) {
    case 'hero':     return LOCAL_HERO_SET.has(id)
    case 'building': return LOCAL_BUILDING_SET.has(id)
    case 'event':    return LOCAL_EVENT_SET.has(id)
    case 'bg':       return HAS_LOCAL_BG
    default:         return false
  }
}

/* ============================================================
 *  CDN 兜底配置（仍保留原能力）
 * ============================================================ */

// 武将兜底：DiceBear 矢量头像
const DICE_BASE = 'https://api.dicebear.com/7.x'
const DICE_STYLE = 'adventurer'
const HERO_BG = ['c0392b', '8e44ad', '2c3e50', '27ae60', 'd35400', '7f8c8d', 'd4af37', 'b8862e']

// 事件兜底：Picsum 风景
const EVENT_SEEDS = {
  disaster: 'sanguo-storm',
  crime:    'sanguo-night',
  envoy:    'sanguo-palace',
  market:   'sanguo-market',
  history:  'sanguo-scroll',
  culture:  'sanguo-moon',
  gossip:   'sanguo-teahouse'
}

// 建筑兜底：Picsum 灰度风景
const BUILDING_SEEDS = {
  lordHall:   'sanguo-palace-hall',
  farm:       'sanguo-rice-field',
  market:     'sanguo-street',
  lumber:     'sanguo-pine-forest',
  barrack:    'sanguo-fortress',
  academy:    'sanguo-library',
  inn:        'sanguo-lantern-inn',
  strategist: 'sanguo-strategist',
  workshop:   'sanguo-forge'
}

/* ============================================================
 *  对外 API —— 保持原签名，调用方零改动
 * ============================================================ */

/**
 * 武将头像 URL
 * 本地优先 → DiceBear 兜底
 */
export function heroImage(heroId) {
  if (!heroId) return ''
  if (LOCAL_HERO_SET.has(heroId)) {
    return `${IMG_BASE}heroes/${heroId}.png`
  }
  // CDN 兜底
  const sum = String(heroId).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const bg = HERO_BG[sum % HERO_BG.length]
  const seed = encodeURIComponent(heroId)
  return `${DICE_BASE}/${DICE_STYLE}/svg?seed=${seed}&backgroundColor=${bg}&radius=50`
}

/**
 * 事件横幅 URL
 * 本地优先 → Picsum 兜底
 */
export function eventImage(type) {
  if (LOCAL_EVENT_SET.has(type)) {
    return `${IMG_BASE}events/${type}.png`
  }
  const seed = EVENT_SEEDS[type] || EVENT_SEEDS.gossip
  return `https://picsum.photos/seed/${seed}/800/240`
}

/**
 * 全局背景 URL
 * 本地优先 → Picsum 兜底
 */
export function bgImage() {
  if (HAS_LOCAL_BG) {
    return `${IMG_BASE}bg.png`
  }
  return 'https://picsum.photos/seed/sanguo-mountains/1600/900?grayscale&blur=1'
}

/**
 * 建筑底图 URL
 * 本地优先 → Picsum 兜底
 */
export function buildingImage(key) {
  if (LOCAL_BUILDING_SET.has(key)) {
    return `${IMG_BASE}buildings/${key}.png`
  }
  const seed = BUILDING_SEEDS[key] || `sanguo-${key}`
  return `https://picsum.photos/seed/${seed}/300/300?grayscale`
}
