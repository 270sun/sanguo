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

      <!-- 器物热区层：用绝对定位百分比放置在书房 CG 的"案几"区域 -->
      <div class="desk-items">
        <button
          v-for="it in items"
          :key="it.id"
          class="desk-item"
          :class="['pos-' + it.id, { focus: hover === it.id }]"
          :style="{ left: it.x + '%', top: it.y + '%' }"
          @mouseenter="hover = it.id"
          @mouseleave="hover = null"
          @click="enter(it)"
        >
          <span class="halo"></span>
          <span class="glyph">{{ it.glyph }}</span>
          <span class="seal">{{ it.title }}</span>
        </button>
      </div>

      <!-- 中央：朱印（点击 = 当前主公印玺速览，预留扩展） -->
      <div class="center-seal" aria-hidden="true">
        <span>三</span>
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

const items = [
  { id: 'city',      title: '城',  glyph: '城', x: 22, y: 58, path: '/city',      tip: '巡视城防，整顿政务' },
  { id: 'heroes',    title: '将',  glyph: '将', x: 38, y: 50, path: '/heroes',    tip: '点阅麾下武将，论功行赏' },
  { id: 'battle',    title: '战',  glyph: '战', x: 54, y: 56, path: '/battle',    tip: '亲点三军，出征讨贼' },
  { id: 'map',       title: '图',  glyph: '图', x: 70, y: 50, path: '/map',       tip: '俯瞰天下舆图，洞察四方' },
  { id: 'profile',   title: '主',  glyph: '主', x: 16, y: 78, path: '/profile',   tip: '览阅主公本纪与品阶' },
  { id: 'chronicle', title: '史',  glyph: '史', x: 80, y: 78, path: '/chronicle', tip: '翻阅起居注，回首旧事' }
]

const whisperText = computed(() => {
  if (!hover.value) return `${game.meta.lordName || '主公'} · 入主第${game.currentYear || 1}年`
  const it = items.find((x) => x.id === hover.value)
  return it ? it.tip : ''
})

function enter(it) {
  game.playSfx && game.playSfx('page')
  router.push(it.path)
}
</script>

<style scoped>
/* 整层放在 main 之上、HUD 之下 —— 仅根路径出现 */
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
  background:
    radial-gradient(ellipse at center, rgba(20, 10, 4, .55), transparent 75%);
  text-shadow: 0 0 10px rgba(232, 196, 104, .35), 0 1px 3px rgba(0, 0, 0, .85);
  pointer-events: none;
}

/* 案上器物层 */
.desk-items {
  position: absolute;
  inset: 0;
}
.desk-item {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 96px;
  height: 96px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .25s cubic-bezier(.2,.8,.25,1.1);
}
.desk-item:hover { transform: translate(-50%, -54%) scale(1.06); }
.desk-item:active { transform: translate(-50%, -50%) scale(.96); }

/* 器物光晕（hover 时浮现金色光） */
.halo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at center,
    rgba(232, 196, 104, .35) 0%,
    rgba(232, 196, 104, .15) 30%,
    transparent 70%);
  opacity: 0;
  transform: scale(.7);
  transition: opacity .35s, transform .45s cubic-bezier(.2,.8,.25,1.1);
  filter: blur(2px);
}
.desk-item:hover .halo,
.desk-item.focus .halo {
  opacity: 1;
  transform: scale(1.15);
}

/* 字形（鎏金小篆） */
.glyph {
  position: relative;
  z-index: 2;
  font-family: var(--font-title);
  font-size: 30px;
  color: #f4dca0;
  text-shadow:
    0 0 12px rgba(232, 196, 104, .55),
    0 2px 4px rgba(0, 0, 0, .9);
  pointer-events: none;
  user-select: none;
}

/* 题字（hover 时浮出） */
.seal {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translate(-50%, 6px);
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 4px;
  color: #c19a52;
  opacity: 0;
  transition: opacity .25s, transform .25s;
  pointer-events: none;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .8);
}
.desk-item:hover .seal,
.desk-item.focus .seal {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* 中央朱印（书房正中央的"三"字朱红印章） */
.center-seal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 78px;
  height: 78px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(135deg, #b1281f 0%, #8c1a14 100%);
  box-shadow:
    0 0 0 2px #6b110c,
    0 0 18px rgba(177, 40, 31, .45),
    inset 0 0 12px rgba(0, 0, 0, .35);
  color: #f7e5b8;
  font-family: var(--font-title);
  font-size: 44px;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, .7);
  opacity: .88;
  pointer-events: none;
  /* 朱印细微呼吸 */
  animation: seal-pulse 4.6s ease-in-out infinite;
}
@keyframes seal-pulse {
  0%, 100% { box-shadow: 0 0 0 2px #6b110c, 0 0 18px rgba(177, 40, 31, .45), inset 0 0 12px rgba(0, 0, 0, .35); }
  50%      { box-shadow: 0 0 0 2px #6b110c, 0 0 28px rgba(232, 110, 90, .55), inset 0 0 12px rgba(0, 0, 0, .35); }
}

/* 整体淡入淡出 */
.study-fade-enter-active,
.study-fade-leave-active { transition: opacity .35s ease; }
.study-fade-enter-from,
.study-fade-leave-to { opacity: 0; }

/* 移动端：器物缩小 + 站位调整为两行三列均布 */
@media (max-width: 640px), (pointer: coarse) {
  .desk-item { width: 72px; height: 72px; }
  .glyph { font-size: 24px; }
  .center-seal { width: 60px; height: 60px; font-size: 34px; }
  .desk-item:hover { transform: translate(-50%, -50%) scale(1); }
}
</style>
