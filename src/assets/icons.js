/**
 * 三国 · 卧龙吟 —— 自绘 SVG 图标库
 *
 * 设计语言：
 *   - 24x24 viewBox，统一比例
 *   - 双色渲染：fill=currentColor（外色 = 鎏金），子描边 stroke=rgba(0,0,0,.55) 形成边缘
 *   - 朱砂红重点（resPay/dismiss/disaster 等）用 fill="#a8231a"
 *   - 完全替代 emoji，提供更稳定可控的"古风游戏 UI"质感
 *
 * 调用建议：通过 <AppIcon kind="res" id="coin" /> 组件统一查表，不要散点 v-html。
 */

/** 通用包装：填充式（实心烫金块面） + 描边（黑墨边） */
const wrap = (inner, viewBox = '0 0 24 24') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" fill="currentColor" stroke="rgba(0,0,0,.45)" stroke-width="0.6" stroke-linejoin="round">${inner}</svg>`

/** 线描包装：仅描边（旧风格，保留兼容） */
const line = (inner, viewBox = '0 0 24 24') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

/* ============================================================
 *  资源图标 —— 替代 🌾 💰 🪵 ⚔️ ⚡
 * ============================================================ */
export const RES_ICONS = {
  // 粮草：束扎的麦穗（饱满米粒造型）
  grain: wrap(`
    <path d="M12 22 V11"/>
    <path d="M12 11 Q7 11 6 6 Q11 7 12 11 Z"/>
    <path d="M12 11 Q17 11 18 6 Q13 7 12 11 Z"/>
    <path d="M12 8 Q8 8 7 4 Q11 4.5 12 8 Z"/>
    <path d="M12 8 Q16 8 17 4 Q13 4.5 12 8 Z"/>
    <path d="M9 22 H15" stroke-width="1.4"/>
  `),
  // 铜钱：圆环 + 方孔（汉代五铢）
  coin: wrap(`
    <circle cx="12" cy="12" r="9"/>
    <rect x="9.3" y="9.3" width="5.4" height="5.4" fill="#1a0e07" stroke="none"/>
    <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="0.8"/>
    <circle cx="12" cy="12" r="6.8" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="0.4"/>
  `),
  // 木材：三段叠放的圆木（端面年轮）
  wood: wrap(`
    <ellipse cx="6.5" cy="9" rx="3.5" ry="2"/>
    <path d="M3 9 V14 Q3 16 6.5 16 Q10 16 10 14 V9"/>
    <ellipse cx="6.5" cy="14" rx="3.5" ry="2" fill="rgba(0,0,0,.18)"/>
    <ellipse cx="15" cy="13" rx="3" ry="1.8"/>
    <path d="M12 13 V17 Q12 18.5 15 18.5 Q18 18.5 18 17 V13"/>
    <ellipse cx="15" cy="17" rx="3" ry="1.8" fill="rgba(0,0,0,.18)"/>
    <circle cx="6.5" cy="9" r="1" fill="rgba(0,0,0,.4)" stroke="none"/>
    <circle cx="15" cy="13" r="0.8" fill="rgba(0,0,0,.4)" stroke="none"/>
  `),
  // 兵力：交叉刀剑（汉环首刀剪影）
  soldier: wrap(`
    <path d="M5 19 L18 6 L20 8 L7 21 Z"/>
    <path d="M19 5 L21 7 L19 9 L17 7 Z"/>
    <path d="M19 19 L6 6 L4 8 L17 21 Z"/>
    <path d="M5 5 L3 7 L5 9 L7 7 Z"/>
    <circle cx="12" cy="12" r="1.6" fill="#a8231a" stroke="none"/>
  `),
  // 精力：道家雷符（金箔闪电）
  ap: wrap(`
    <path d="M13 2 L4 13 H10 L9 22 L20 10 H13 Z"/>
    <path d="M13 2 L4 13 H10 L9 22 L20 10 H13 Z" fill="none" stroke="rgba(255,240,180,.45)" stroke-width="0.4"/>
  `),
  jadeShard: wrap(`
    <path d="M12 2 L20 10 L12 22 L4 10 Z"/>
    <path d="M4 10 H20 M12 2 V22" stroke="rgba(0,0,0,.45)" stroke-width="0.5" fill="none"/>
    <path d="M9 7 L12 10 L15 7" fill="none" stroke="rgba(255,255,220,.55)" stroke-width="0.6"/>
  `)
}

/* ============================================================
 *  Tab 图标 —— 替代 🏯 ⚔️ 🐎 🗺️ 👑
 * ============================================================ */
export const TAB_ICONS = {
  // 城池：三层飞檐宝塔
  city: wrap(`
    <path d="M12 2 L9 5 H15 Z"/>
    <path d="M7 6 H17 L18 8 H6 Z"/>
    <rect x="8.5" y="8" width="7" height="3"/>
    <path d="M6 11 H18 L19 13 H5 Z"/>
    <rect x="7.5" y="13" width="9" height="4"/>
    <path d="M5 17 H19 L20 19 H4 Z"/>
    <rect x="6" y="19" width="12" height="3"/>
    <rect x="11" y="14" width="2" height="3" fill="#1a0e07" stroke="none"/>
    <rect x="11" y="20" width="2" height="2" fill="#1a0e07" stroke="none"/>
  `),
  // 武将：兜鍪（带朱缨的将军盔）
  heroes: wrap(`
    <path d="M12 3 L13 5 L13 6 L11 6 L11 5 Z" fill="#a8231a" stroke="none"/>
    <path d="M11 5 L11 7 Q9 8 9 11 Q5 11 5 14 H19 Q19 11 15 11 Q15 8 13 7 L13 5 Z"/>
    <path d="M5 14 H19 V17 H5 Z"/>
    <path d="M8 17 V20 H10 V17"/>
    <path d="M14 17 V20 H16 V17"/>
    <circle cx="12" cy="12.5" r="1" fill="#1a0e07" stroke="none"/>
  `),
  // 出征：军旗（红绸金杆）
  battle: wrap(`
    <path d="M5 2 V22" stroke-width="1.6"/>
    <path d="M5 3 L18 3 L20 5 L18 7 L20 9 L5 9 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <circle cx="5" cy="2" r="1.2"/>
    <path d="M3 22 H7" stroke-width="1.6"/>
    <path d="M9 5 L13 7 M13 5 L9 7" stroke-width="0.8"/>
  `),
  // 天下：卷轴地图
  map: wrap(`
    <path d="M3 5 H21 V19 H3 Z"/>
    <path d="M3 5 L3 19" stroke="rgba(0,0,0,.55)" stroke-width="1.2"/>
    <path d="M21 5 L21 19" stroke="rgba(0,0,0,.55)" stroke-width="1.2"/>
    <path d="M6 8 Q9 10 12 9 Q15 8 18 11" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="0.8"/>
    <path d="M7 14 Q10 13 13 15 Q16 17 18 15" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="0.8"/>
    <circle cx="10" cy="11" r="0.8" fill="#a8231a" stroke="none"/>
    <circle cx="15" cy="14" r="0.8" fill="#a8231a" stroke="none"/>
  `),
  // 主公：旒冕（带玉珠的帝王冠）
  profile: wrap(`
    <path d="M3 8 L5 14 H19 L21 8 L17 11 L12 6 L7 11 Z"/>
    <path d="M5 14 H19 V17 H5 Z"/>
    <circle cx="6" cy="8" r="1" fill="#a8231a" stroke="none"/>
    <circle cx="12" cy="6" r="1" fill="#a8231a" stroke="none"/>
    <circle cx="18" cy="8" r="1" fill="#a8231a" stroke="none"/>
    <path d="M8 17 V19 M12 17 V19 M16 17 V19" stroke-width="1"/>
  `)
}

/* ============================================================
 *  治理仪表 —— 替代 🔬 📚 🛡️ 💼
 * ============================================================ */
export const GOV_ICONS = {
  // 科技：浑天仪（汉张衡）
  tech: wrap(`
    <circle cx="12" cy="12" r="8"/>
    <ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="0.6"/>
    <ellipse cx="12" cy="12" rx="3" ry="8" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="0.6"/>
    <circle cx="12" cy="12" r="2" fill="#a8231a" stroke="none"/>
    <path d="M12 4 V2 M12 20 V22 M4 12 H2 M20 12 H22"/>
  `),
  // 文化：捆扎的竹简卷
  culture: wrap(`
    <rect x="4" y="5" width="2" height="14"/>
    <rect x="7" y="5" width="2" height="14"/>
    <rect x="10" y="5" width="2" height="14"/>
    <rect x="13" y="5" width="2" height="14"/>
    <rect x="16" y="5" width="2" height="14"/>
    <path d="M3 8 H19" stroke="#a8231a" stroke-width="1.2"/>
    <path d="M3 16 H19" stroke="#a8231a" stroke-width="1.2"/>
  `),
  // 治安：虎首盾牌
  security: wrap(`
    <path d="M12 2 L4 5 V12 Q4 18 12 22 Q20 18 20 12 V5 Z"/>
    <path d="M9 9 Q9 8 10 8 Q11 8 11 9" fill="#1a0e07" stroke="none"/>
    <path d="M13 9 Q13 8 14 8 Q15 8 15 9" fill="#1a0e07" stroke="none"/>
    <path d="M10 13 Q12 15 14 13" fill="none" stroke="#1a0e07" stroke-width="0.8"/>
    <path d="M11 11 L13 11" stroke="#a8231a" stroke-width="0.8"/>
  `),
  // 商业：元宝（船形银锭）
  commerce: wrap(`
    <path d="M4 14 Q6 9 12 9 Q18 9 20 14 Q20 17 12 17 Q4 17 4 14 Z"/>
    <ellipse cx="12" cy="14" rx="6" ry="2" fill="rgba(0,0,0,.25)" stroke="none"/>
    <path d="M8 11 Q12 13 16 11" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="0.6"/>
  `)
}

/* ============================================================
 *  建筑图标 —— 与 src/data/buildings.js 的 key 一一对应
 *  （CityView 已不再叠加，仅在弹窗/队列里小尺寸用）
 * ============================================================ */
export const BUILDING_ICONS = {
  lordHall: wrap(`
    <path d="M3 10 L12 4 L21 10 Z"/>
    <rect x="5" y="10" width="14" height="10"/>
    <rect x="9" y="14" width="6" height="6" fill="#1a0e07" stroke="none"/>
    <path d="M12 4 V2"/>
    <circle cx="12" cy="2" r="0.8" fill="#a8231a" stroke="none"/>
  `),
  farm: wrap(`
    <path d="M12 6 Q9 8 9 12 Q9 16 12 19 Q15 16 15 12 Q15 8 12 6 Z"/>
    <path d="M12 6 V19" stroke="rgba(0,0,0,.55)" stroke-width="0.8"/>
    <path d="M9 11 Q12 12 15 11 M9 14 Q12 15 15 14" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="0.4"/>
    <path d="M3 21 H21" stroke="#1a0e07" stroke-width="1.4"/>
  `),
  market: wrap(`
    <path d="M3 9 L5 5 H19 L21 9 Z"/>
    <rect x="5" y="9" width="14" height="11"/>
    <rect x="9" y="13" width="6" height="7" fill="#1a0e07" stroke="none"/>
    <path d="M12 5 V2"/>
    <rect x="10" y="2" width="4" height="1" fill="#a8231a" stroke="none"/>
  `),
  lumber: wrap(`
    <path d="M8 4 L4 14 H12 Z"/>
    <path d="M8 8 L5 16 H11 Z"/>
    <rect x="7" y="14" width="2" height="6" fill="#3a2410" stroke="none"/>
    <path d="M14 21 L21 14"/>
    <path d="M17 11 L21 15 L18 18 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
  `),
  barrack: wrap(`
    <path d="M3 20 H21"/>
    <path d="M4 20 V12 H6 V14 H8 V12 H10 V14 H12 V12 H14 V14 H16 V12 H18 V14 H20 V20 Z"/>
    <path d="M12 12 V3" stroke-width="1.4"/>
    <path d="M11 3 H13 V5 L12 6 L11 5 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
  `),
  academy: wrap(`
    <path d="M2 6 Q2 4 4 4 L11 4 V19 H4 Q2 19 2 17 Z"/>
    <path d="M22 6 Q22 4 20 4 L13 4 V19 H20 Q22 19 22 17 Z"/>
    <path d="M4 8 H9 M4 11 H9 M4 14 H8" fill="none" stroke="#1a0e07" stroke-width="0.6"/>
    <path d="M15 8 H20 M15 11 H20 M16 14 H20" fill="none" stroke="#1a0e07" stroke-width="0.6"/>
    <path d="M11 4 L12 3 L13 4" stroke="#a8231a"/>
  `),
  inn: wrap(`
    <rect x="4" y="9" width="16" height="11"/>
    <path d="M4 9 L7 5 H17 L20 9 Z"/>
    <ellipse cx="12" cy="14" rx="2.5" ry="3" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <path d="M12 11 V9 M12 17 V19" stroke-width="0.8"/>
  `),
  strategist: wrap(`
    <path d="M12 22 V13" stroke-width="1.4"/>
    <path d="M4 12 Q4 5 12 4 Q20 5 20 12 Q16 14 12 14 Q8 14 4 12 Z"/>
    <path d="M8 12 V5 M12 13 V4 M16 12 V5" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="0.6"/>
  `),
  workshop: wrap(`
    <path d="M3 14 H17 L14 18 H6 Z"/>
    <rect x="9" y="14" width="2" height="6" fill="#3a2410" stroke="none"/>
    <path d="M5 20 H15"/>
    <path d="M15 4 L21 10 L18 13 L12 7 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
  `)
}

/* ============================================================
 *  事件图标 —— 替代 ☀️ 🦗 🔥 🗡️ 🥷 🐎 💼 🎪 🌾 🧙 🟡 📜
 * ============================================================ */
export const EVENT_ICONS = {
  // 灾：风暴闪电
  disaster: wrap(`
    <path d="M13 2 L4 13 H10 L9 22 L20 10 H13 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
  `),
  // 蝗：长翼蝗虫
  locust: wrap(`
    <ellipse cx="12" cy="14" rx="4" ry="6"/>
    <path d="M8 10 Q4 6 6 4 Q10 5 11 9" fill="none" stroke-width="0.8"/>
    <path d="M16 10 Q20 6 18 4 Q14 5 13 9" fill="none" stroke-width="0.8"/>
    <circle cx="11" cy="10" r="0.5" fill="#1a0e07" stroke="none"/>
    <circle cx="13" cy="10" r="0.5" fill="#1a0e07" stroke="none"/>
    <path d="M9 18 L7 21 M15 18 L17 21" stroke-width="0.6"/>
  `),
  // 火：烈焰
  fire: wrap(`
    <path d="M12 2 Q15 6 14 10 Q17 9 17 14 Q17 20 12 22 Q7 20 7 14 Q7 9 10 10 Q9 6 12 2 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <path d="M12 12 Q14 14 13 17 Q12 19 11 17 Q10 14 12 12 Z" fill="#fff5cf" stroke="none"/>
  `),
  // 盗匪：弯刀（红缨黑刃）
  crime: wrap(`
    <path d="M4 20 Q12 18 18 6 L20 8 Q14 22 4 22 Z"/>
    <path d="M18 6 L21 5 L22 7 L19 8 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <circle cx="5" cy="21" r="1.5" fill="#1a0e07" stroke="none"/>
  `),
  // 刺客：黑头巾蒙面
  ninja: wrap(`
    <path d="M12 3 Q5 3 5 11 Q5 16 12 21 Q19 16 19 11 Q19 3 12 3 Z"/>
    <rect x="5" y="10" width="14" height="3" fill="#1a0e07" stroke="none"/>
    <circle cx="10" cy="11.5" r="0.9" fill="#a8231a" stroke="none"/>
    <circle cx="14" cy="11.5" r="0.9" fill="#a8231a" stroke="none"/>
  `),
  // 使节：奔马（驿马）
  envoy: wrap(`
    <path d="M3 16 Q5 12 9 12 L15 12 Q18 12 19 9 L21 7 L20 11 L21 12 L19 14 L18 14 Q17 17 14 17 H10 Q8 17 7 19 L5 21 L4 19 L6 17 L4 17 Z"/>
    <circle cx="19" cy="9" r="0.6" fill="#1a0e07" stroke="none"/>
    <path d="M8 17 V21 M12 17 V21" stroke-width="0.8"/>
    <path d="M16 8 Q17 6 18 5" fill="none" stroke="#a8231a" stroke-width="1"/>
  `),
  // 商：天平称
  trade: wrap(`
    <path d="M12 4 V20" stroke-width="1.4"/>
    <path d="M4 8 H20"/>
    <path d="M4 8 L2 13 Q2 15 5 15 Q8 15 8 13 L6 8" fill="rgba(232,196,104,.6)"/>
    <path d="M16 8 L14 13 Q14 15 17 15 Q20 15 20 13 L18 8" fill="rgba(232,196,104,.6)"/>
    <circle cx="12" cy="4" r="1.2" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <path d="M9 20 H15"/>
  `),
  // 庆典：红灯笼
  festival: wrap(`
    <path d="M12 4 Q8 4 8 8 V14 Q8 18 12 18 Q16 18 16 14 V8 Q16 4 12 4 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <path d="M8 6 L16 6 M8 16 L16 16" stroke="rgba(255,240,180,.85)" stroke-width="0.8"/>
    <rect x="10" y="2" width="4" height="2"/>
    <path d="M12 18 V21" stroke-width="1"/>
    <path d="M10 21 L14 21" stroke="#3a2410" stroke-width="1"/>
  `),
  // 史册：合本竹简
  history: wrap(`
    <path d="M3 4 L21 4 L21 20 L3 20 Z"/>
    <path d="M3 4 L21 4 L20 6 L4 6 Z" fill="rgba(0,0,0,.3)" stroke="none"/>
    <path d="M6 9 H18 M6 12 H18 M6 15 H14" stroke="#1a0e07" stroke-width="0.6"/>
    <circle cx="17" cy="17" r="1.2" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
  `),
  // 风物：古琴（七弦）
  culture: wrap(`
    <path d="M3 9 Q3 7 5 7 H19 Q21 7 21 9 V14 Q21 16 19 16 H5 Q3 16 3 14 Z"/>
    <path d="M3 9 H21 M3 10.5 H21 M3 12 H21 M3 13.5 H21" stroke="rgba(0,0,0,.55)" stroke-width="0.4"/>
    <circle cx="6" cy="11.5" r="0.7" fill="#a8231a" stroke="none"/>
    <circle cx="18" cy="11.5" r="0.7" fill="#a8231a" stroke="none"/>
  `),
  // 逸闻：茶碗冒烟
  gossip: wrap(`
    <path d="M5 12 H17 V18 Q17 20 14 20 H8 Q5 20 5 18 Z"/>
    <path d="M17 13 Q21 14 21 16 Q21 18 17 18" fill="none"/>
    <path d="M8 10 Q9 8 8 6 M12 10 Q13 8 12 6 M16 10 Q17 8 16 6" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="0.6"/>
  `)
}

/* ============================================================
 *  任务图标 —— 替代 🛡️ ⚔️ 🌾 🪵
 * ============================================================ */
export const TASK_ICONS = {
  patrol:  GOV_ICONS.security,
  drill:   RES_ICONS.soldier,
  farm:    RES_ICONS.grain,
  logging: RES_ICONS.wood
}

/* ============================================================
 *  流派图标 —— 替代 📜 ⚒️ 🪶
 * ============================================================ */
export const SPEC_ICONS = {
  wenzhi:  GOV_ICONS.culture,
  wugong:  wrap(`
    <path d="M12 2 V8" stroke-width="1.4"/>
    <path d="M8 8 L12 5 L16 8 L17 14 L12 22 L7 14 Z"/>
    <circle cx="12" cy="13" r="1.4" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
  `),
  zonghen: wrap(`
    <path d="M12 22 V13" stroke-width="1.4"/>
    <path d="M3 11 Q3 4 12 4 Q21 4 21 11 Q15 13 12 13 Q9 13 3 11 Z"/>
    <path d="M7 11 V5 M12 13 V4 M17 11 V5" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="0.6"/>
  `)
}
// 流派 key 别名：对齐 src/data/specializations.js 中的 civil/military/talent
SPEC_ICONS.civil    = SPEC_ICONS.wenzhi
SPEC_ICONS.military = SPEC_ICONS.wugong
SPEC_ICONS.talent   = SPEC_ICONS.zonghen

/* ============================================================
 *  杂项 UI —— 替代 ☰ ✓ ✗ × ★ ⚐ 🎲 📜 印 等散点
 * ============================================================ */
export const MISC_ICONS = {
  // 印：朱砂大印
  seal: wrap(`
    <rect x="4" y="4" width="16" height="16"/>
    <rect x="6" y="6" width="12" height="12" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <path d="M9 10 H15 M9 14 H15 M12 9 V15" stroke="#fff5cf" stroke-width="0.9"/>
  `),
  // 卷轴
  scroll: wrap(`
    <path d="M4 4 H20 V20 H4 Z"/>
    <path d="M4 4 V20" stroke="#1a0e07" stroke-width="1.2"/>
    <path d="M20 4 V20" stroke="#1a0e07" stroke-width="1.2"/>
    <path d="M7 8 H17 M7 12 H17 M7 16 H14" stroke="#1a0e07" stroke-width="0.6"/>
  `),
  // 骰子（招募刷新）
  refresh: wrap(`
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="7" cy="7" r="1.4" fill="#a8231a" stroke="none"/>
    <circle cx="12" cy="12" r="1.4" fill="#1a0e07" stroke="none"/>
    <circle cx="17" cy="17" r="1.4" fill="#1a0e07" stroke="none"/>
    <circle cx="17" cy="7" r="1.4" fill="#1a0e07" stroke="none"/>
    <circle cx="7" cy="17" r="1.4" fill="#1a0e07" stroke="none"/>
  `),
  // 勾选（战报胜）
  check: wrap(`
    <path d="M4 12 L10 18 L20 6" fill="none" stroke-width="2.4"/>
  `),
  // 叉（战报败 / 遣散）
  cross: wrap(`
    <path d="M5 5 L19 19 M19 5 L5 19" fill="none" stroke-width="2.4" stroke="#a8231a"/>
  `),
  // 旗帜（驻守）
  flag: wrap(`
    <path d="M5 2 V22" stroke-width="1.6"/>
    <path d="M5 3 L18 3 L16 7 L18 11 L5 11 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <path d="M3 22 H7" stroke-width="1.6"/>
  `),
  // 星（羁绊）
  star: wrap(`
    <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18 21 L12 16.5 L6 21 L8 13.5 L2 9 L9.5 9 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
  `),
  // 营造（建造队列）
  build: wrap(`
    <path d="M14 2 L22 10 L20 12 L18 10 L13 15 L11 13 L16 8 L14 6 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)"/>
    <path d="M11 13 L3 21 L5 23 L13 15"/>
  `),
  // 全部（菜单）
  list: wrap(`
    <path d="M4 6 H20 M4 12 H20 M4 18 H20" fill="none" stroke-width="2"/>
  `),
  // 通用占位
  hourglass: wrap(`
    <path d="M6 3 H18 V6 Q18 9 12 12 Q6 15 6 18 V21 H18 V18 Q18 15 12 12 Q18 9 18 6 V3"/>
    <path d="M5 3 H19 M5 21 H19" stroke-width="1.2"/>
    <path d="M9 6 H15 L12 11 Z" fill="#a8231a" stroke="rgba(0,0,0,.55)" stroke-width="0.4"/>
  `),
  fallback: wrap(`<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8 L16 16 M16 8 L8 16" stroke="#1a0e07" stroke-width="1.2"/>`)
}

/* ============================================================
 *  统一查表：AppIcon 组件用
 * ============================================================ */
export const ICON_GROUPS = {
  res:      RES_ICONS,
  tab:      TAB_ICONS,
  gov:      GOV_ICONS,
  building: BUILDING_ICONS,
  event:    EVENT_ICONS,
  task:     TASK_ICONS,
  spec:     SPEC_ICONS,
  misc:     MISC_ICONS
}

export const FALLBACK_ICON = MISC_ICONS.fallback
