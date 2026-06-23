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
  { id: 'map',       title: '图 · 天下', x: 80, y: 46, path: '/map',       tip: '俯瞰天下舆图，洞察四方' },
  { id: 'battle',    title: '战 · 出征', x: 20, y: 80, path: '/battle',    tip: '亲点三军，出征讨贼' },
  { id: 'profile',   title: '主 · 主公', x: 50, y: 78, path: '/profile',   tip: '览阅主公本纪与品阶' },
  { id: 'chronicle', title: '史 · 史册', x: 80, y: 80, path: '/chronicle', tip: '翻阅起居注，回首旧事' }
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
  font-size: 14px;
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
  cursor: pointer;
  pointer-events: auto;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .35s cubic-bezier(.2,.8,.25,1.1);
  /* 默认轻微浮影 */
  filter: drop-shadow(0 5px 7px rgba(0, 0, 0, .65));
}
.desk-item:hover {
  transform: translate(-50%, -56%) scale(1.08);
  filter: drop-shadow(0 14px 18px rgba(0, 0, 0, .75))
          drop-shadow(0 0 14px rgba(232, 196, 104, .55));
}
.desk-item:active {
  transform: translate(-50%, -50%) scale(.96);
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
}

/* 金色光晕（hover 时浮现） */
.halo {
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  background: radial-gradient(circle at center,
    rgba(232, 196, 104, .35) 0%,
    rgba(232, 196, 104, .12) 35%,
    transparent 72%);
  opacity: 0;
  transform: scale(.7);
  transition: opacity .35s, transform .45s cubic-bezier(.2,.8,.25,1.1);
  filter: blur(3px);
  pointer-events: none;
}
.desk-item:hover .halo,
.desk-item.focus .halo {
  opacity: 1;
  transform: scale(1.18);
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
  font-size: 11px;
  letter-spacing: 3px;
  color: #f0d590;
  opacity: 0.78;
  transition: opacity .25s, transform .25s, background .25s, color .25s;
  pointer-events: none;
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 3px;
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
  .seal { font-size: 10px; letter-spacing: 2px; bottom: -12px; }
}
/* 移动 / 触控 */
@media (max-width: 640px), (pointer: coarse) {
  .desk-item { width: 72px; height: 72px; }
  .desk-item:hover { transform: translate(-50%, -50%) scale(1); }
  .whisper { font-size: 12px; letter-spacing: 2px; top: 56px; padding: 4px 14px; }
  .seal { font-size: 9px; letter-spacing: 1.5px; bottom: -10px; padding: 1px 6px; }
}
</style>
