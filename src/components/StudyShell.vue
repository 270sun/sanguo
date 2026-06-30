<template>
  <!-- 仅在根路径渲染：6 件案上器物作为入口 -->
  <transition name="study-fade">
    <div v-if="isStudy" class="study-shell" :class="{ hovering: !!hover }">
      <!-- 上方：主公低语（hover 器物时换字） -->
      <div class="whisper">
        <transition name="whisper" mode="out-in">
          <span :key="hover || 'idle'">{{ whisperText }}</span>
        </transition>
      </div>

      <!-- 案上器物层：上排 3 件、下排 3 件，避开 CG 中央案几主物 -->
      <div class="desk-items">
        <button
          v-for="it in items"
          :key="it.id"
          class="desk-item"
          :data-item="it.id"
          :class="{ focus: hover === it.id }"
          :style="{ left: it.x + '%', top: it.y + '%' }"
          @mouseenter="hover = it.id"
          @mouseleave="hover = null"
          @click="enter(it)"
        >
          <span class="halo"></span>
          <img class="artifact" :src="itemImg(it.id)" :alt="it.title" draggable="false" />
          <span class="seal">{{ it.title }}</span>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'

const route = useRoute()
const router = useRouter()
const game = useGameStore()

const isStudy = computed(() => route.path === '/')
const hover = ref(null)

const ITEM_BASE = `${import.meta.env.BASE_URL || '/'}img/items/`.replace(/\/+/g, '/')
function itemImg(id) { return `${ITEM_BASE}${id}.png` }

// 上排 3 件（避开 CG 顶部牌匾文字，纵向下移到 44%~46%）
// 下排 3 件（避开 CG 底部桌沿，纵向 78%~80%）
const items = [
  { id: 'city',      title: '城 · 城池', x: 20, y: 46, path: '/city',      tip: '巡视城防，整顿政务' },
  { id: 'heroes',    title: '将 · 武将', x: 50, y: 44, path: '/heroes',    tip: '点阅麾下武将，论功行赏' },
  { id: 'map',       title: '图 · 天下', x: 80, y: 46, path: '/world',     tip: '俯瞰天下舆图·亲点三军出征' },
  { id: 'profile',   title: '主 · 主公', x: 35, y: 80, path: '/profile',   tip: '览阅主公本纪与品阶' },
  { id: 'chronicle', title: '史 · 史册', x: 65, y: 80, path: '/chronicle', tip: '翻阅起居注，回首旧事' }
]

const whisperText = computed(() => {
  if (!hover.value) return `${game.meta.lordName || '主公'} · 入主第 ${game.currentYear || 1} 年 · ${game.currentSeason?.label || ''}`
  const it = items.find((x) => x.id === hover.value)
  return it ? it.tip : ''
})

function enter(it) {
  game.playSfx && game.playSfx('page')
  router.push(it.path)
}
</script>

<style scoped>
.study-shell {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}

/* 上方主公低语条 */
.whisper {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 22px;
  font-family: var(--font-title);
  font-size: 15px;
  color: #f0d590;
  letter-spacing: 4px;
  background: radial-gradient(ellipse at center, rgba(20, 10, 4, .55), transparent 75%);
  text-shadow: 0 0 10px rgba(232, 196, 104, .35), 0 1px 3px rgba(0, 0, 0, .85);
  pointer-events: none;
  white-space: nowrap;
}
.whisper-enter-active,
.whisper-leave-active { transition: opacity .22s ease, transform .22s ease; }
.whisper-enter-from { opacity: 0; transform: translateY(-4px); }
.whisper-leave-to   { opacity: 0; transform: translateY(4px); }

/* 案上器物层 */
.desk-items { position: absolute; inset: 0; }

.desk-item {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 108px;
  height: 108px;
  padding: 0;
  border: 0;
  background: transparent;
  /* 清除全局 button { box-shadow: 4层金牌阴影 }：案上器物按钮是纯透明命中盒，
   * 不应有金色按钮的内嵌高光/外凸阴影。否则 PNG 半透明区域（尤其 city.png 顶部
   * 11% 完全透明 + 中心 48% 半透明）会让背后的米黄色 inset 高光线和深棕外阴影
   * 透出，形成视觉上的"背后方框"。 */
  box-shadow: none;
  cursor: pointer;
  pointer-events: auto;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 父按钮不再做几何动画：保持稳定的命中盒，避免 hover 时元素位移导致鼠标
   * 反复进出元素边界（mouseenter <-> mouseleave 闪动）。视觉效果下沉到子元素。 */
  will-change: auto;
}
.desk-item:hover { z-index: 2; }
/* 修复：全局 button:active { transform: translateY(2px) } 会覆盖父按钮的
 * translate(-50%, -50%) 居中变换，导致按下时整个按钮向右下漂移 (width/2, height/2)。
 * 这里显式恢复居中，确保命中盒静止，所有视觉反馈由 .artifact 子元素承担。 */
.desk-item:active:not(:disabled) {
  transform: translate(-50%, -50%);
}

/* 器物图（透明 PNG） */
.artifact {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  transform: translateZ(0);
  transform-origin: 50% 50%;
  transition: transform .35s cubic-bezier(.2,.8,.25,1.1),
              filter .35s ease;
  filter: drop-shadow(0 5px 7px rgba(0, 0, 0, .65));
  will-change: transform, filter;
  backface-visibility: hidden;
}
.desk-item:hover .artifact,
.desk-item.focus .artifact {
  transform: translateY(-6px) scale(1.08);
  filter: drop-shadow(0 14px 18px rgba(0, 0, 0, .75))
          drop-shadow(0 0 14px rgba(232, 196, 104, .55));
}
.desk-item:active .artifact {
  transform: translateY(-6px) scale(1.04);
  transition-duration: .12s;
}

/* 金色光晕（hover 时浮现）
 * 设计约束：halo 的最大可见包围盒（hover 时 scale 后 + blur 外溢）必须严格落在
 * 所有 PNG icon 的"不透明主体"区域内，否则在顶部留白较多的 PNG（如 city.png：顶部
 * 79/768 ≈ 11% 完全透明）会从 PNG 上方"漏出"成为一道金色渐变弧线，被误认为
 * "图标上方的渐变上边框"。
 *
 * 关键参数：
 *   inset:    12%   → 静态包围盒 = 108×(1-0.24) ≈ 82px
 *   scale:    1.05  → hover 后 ≈ 86px
 *   blur:     2px   → 外溢 2px，总最大半径 ≈ 45px
 *   相对 108 容器中心：上沿仍距 art top ≈ 11px，恰好处于所有 PNG 的不透明主体内。
 */
.halo {
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  background: radial-gradient(circle at center,
    rgba(232, 196, 104, .35) 0%,
    rgba(232, 196, 104, .12) 35%,
    transparent 72%);
  opacity: 0;
  transform: scale(.7);
  transition: opacity .35s, transform .45s cubic-bezier(.2,.8,.25,1.1);
  filter: blur(2px);
  pointer-events: none;
}
.desk-item:hover .halo,
.desk-item.focus .halo {
  opacity: 1;
  transform: scale(1.05);
}

/* 题字（默认低透常驻，hover 时高亮浮出）
 * z-index:3 必须高于 .artifact 的 2，否则会被 PNG 实体覆盖；
 * bottom 距离 icon 框 -22px，给 PNG 主体 + drop-shadow 留物理隔离带。 */
.seal {
  position: absolute;
  z-index: 3;
  bottom: -22px;
  left: 50%;
  transform: translate(-50%, 0);
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 3px;
  color: #f0d590;
  opacity: 0.78;
  transition: opacity .25s, transform .25s, background .25s, color .25s;
  pointer-events: none;
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: var(--r-sm);
  background: rgba(20, 10, 4, .55);
  border: 1px solid rgba(232, 196, 104, .25);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .9);
}
.desk-item:hover .seal,
.desk-item.focus .seal {
  opacity: 1;
  transform: translate(-50%, -2px);
  background: rgba(20, 10, 4, .82);
  border-color: rgba(232, 196, 104, .55);
  color: #fff1c2;
}

/* 整体淡入淡出 */
.study-fade-enter-active,
.study-fade-leave-active { transition: opacity .35s ease; }
.study-fade-enter-from,
.study-fade-leave-to { opacity: 0; }

/* 中等屏 */
@media (max-width: 1080px) {
  .desk-item { width: 92px; height: 92px; }
  .seal { font-size: 12px; letter-spacing: 2px; bottom: -12px; }
}
/* 移动 / 触控 */
@media (max-width: 640px), (pointer: coarse) {
  .desk-item { width: 72px; height: 72px; }
  .desk-item:hover .artifact { transform: none; }
  .whisper { font-size: 13px; letter-spacing: 2px; top: 56px; padding: 4px 14px; }
  .seal { font-size: 12px; letter-spacing: 1.5px; bottom: -10px; padding: 1px 6px; }
}
</style>
