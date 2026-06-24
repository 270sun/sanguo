<template>
  <div class="stage">
    <div class="app-shell" :class="{ 'in-subpage': inSubPage }">
      <!-- 全屏沉浸场景背景层：按路由 cross-fade + 子页面 zoom 推进 -->
      <transition name="bg-fade">
        <div class="immersive-bg" :key="route.path" :style="bgStyle"></div>
      </transition>
      <div class="immersive-vignette"></div>

      <!-- 鎏金边框装饰 -->
      <div class="shell-frame">
        <span class="corner tl"></span>
        <span class="corner tr"></span>
        <span class="corner bl"></span>
        <span class="corner br"></span>
      </div>

      <!-- 极简顶部 HUD（仅 40px 透明印玺条） -->
      <ScrollHUD />

      <!-- 根路径：书房 6 件器物入口（自管显隐） -->
      <StudyShell />

      <!-- 主场景：子路由内容卡片化浮起；根路径为空 -->
      <main class="app-main" ref="mainEl" @wheel.passive="onWheel">
        <router-view v-slot="{ Component, route }">
          <transition name="page-rise" mode="out-in">
            <div v-if="route.path !== '/'" class="page-card" :key="route.path">
              <button class="back-to-study" @click="goStudy" title="退回书房">
                <span class="back-glyph">◀</span>
                <span class="back-text">书房</span>
              </button>
              <component :is="Component" />
            </div>
            <div v-else class="page-empty" :key="'study-empty'"></div>
          </transition>
        </router-view>
      </main>

      <EventModal />
      <EndingModal />

      <!-- 飘落落叶/灰烬粒子（沉浸气氛；移动端 3 颗，PC 8 颗；弹窗打开时停渲染减负载） -->
      <div v-if="!hasModalOpen" class="particle-layer" aria-hidden="true">
        <span v-for="i in particleCount" :key="i" class="particle" :style="particleStyle(i)"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from './stores/game'
import ScrollHUD from './components/ScrollHUD.vue'
import StudyShell from './components/StudyShell.vue'
import EventModal from './components/EventModal.vue'
import EndingModal from './components/EndingModal.vue'

const route = useRoute()
const router = useRouter()
const game = useGameStore()
const transitionName = ref('scene-fade')
const mainEl = ref(null)

const inSubPage = computed(() => route.path !== '/')
/** 任一全屏弹窗（事件/结局）打开时，停掉粒子动画以减负载，明显改善弹窗期间的交互流畅度 */
const hasModalOpen = computed(() => !!game.pendingEvent || !!game.pendingEnding)
function goStudy() {
  game.playSfx && game.playSfx('page')
  router.push('/')
}

// 背景图：按当前路由切换，CG 化呈现
const BG_BASE = `${import.meta.env.BASE_URL || '/'}img/bg/`.replace(/\/+/g, '/')
const ROUTE_BG = {
  '/':          'study.png',
  '/city':      'city.png',
  '/heroes':    'heroes.png',
  '/battle':    'battle.png',
  '/map':       'map.png',
  '/profile':   'profile.png',
  '/chronicle': 'chronicle.png'
}
const bgStyle = computed(() => {
  const file = ROUTE_BG[route.path] || 'study.png'
  return { backgroundImage: `url(${BG_BASE}${file})` }
})

/**
 * 鼠标滚轮加速：默认浏览器 wheel step 约 33px，体感"滑很多次才能滚动"。
 * 这里用 rAF 队列把当前 deltaY 放大到 2.6x 平滑滚到目标位置，每帧 0.18 系数衰减，
 * 避免 setInterval 抢占主线程，也避免直接 jump 突兀。
 */
let _wheelTarget = 0
let _wheelRaf = 0
const _isCoarse = (typeof window !== 'undefined') && window.matchMedia('(pointer: coarse)').matches
function onWheel(e) {
  const el = mainEl.value
  if (!el) return
  // 移动/触控屏直接走原生 touch 滚动，不接管
  if (_isCoarse) return
  // 触摸板 / Mac 惯性滚动 deltaMode === 0 且 |deltaY| 小，保留原生体验
  if (e.deltaMode === 0 && Math.abs(e.deltaY) < 30) return
  _wheelTarget = el.scrollTop + e.deltaY * 2.6
  if (_wheelRaf) return
  const step = () => {
    if (!mainEl.value) { _wheelRaf = 0; return }
    const cur = mainEl.value.scrollTop
    const diff = _wheelTarget - cur
    if (Math.abs(diff) < 1) {
      mainEl.value.scrollTop = _wheelTarget
      _wheelRaf = 0
      return
    }
    mainEl.value.scrollTop = cur + diff * 0.22
    _wheelRaf = requestAnimationFrame(step)
  }
  _wheelRaf = requestAnimationFrame(step)
}

const ORDER = ['/city', '/heroes', '/battle', '/map', '/profile', '/chronicle']
watch(
  () => route.path,
  (to, from) => {
    if (!from) return
    const ti = ORDER.indexOf(to)
    const fi = ORDER.indexOf(from)
    if (ti < 0 || fi < 0) { transitionName.value = 'scene-fade'; return }
    transitionName.value = ti > fi ? 'scene-right' : 'scene-left'
    game.playSfx('page')
  }
)

function particleStyle(i) {
  const left = (i * 13 + 7) % 100
  const delay = (i * 1.4) % 8
  const dur = 12 + (i % 5) * 2
  const drift = (i % 2 === 0 ? 1 : -1) * (10 + (i * 7) % 30)
  return {
    left: left + '%',
    animationDelay: -delay + 's',
    animationDuration: dur + 's',
    '--drift': drift + 'px'
  }
}

// 设备性能档位：移动端 / 触控屏 / 窄屏 → 减半粒子，降级动画
const isLowPower = (typeof window !== 'undefined') &&
  (window.matchMedia('(max-width: 768px)').matches ||
   window.matchMedia('(pointer: coarse)').matches ||
   window.matchMedia('(prefers-reduced-motion: reduce)').matches)
const particleCount = isLowPower ? 3 : 8
</script>

<style scoped>
.stage {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  background: #0a0503;
}
.app-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
  background: transparent;
  box-shadow:
    0 0 0 1px var(--c-gold-dark),
    0 0 24px rgba(232, 196, 104, .35),
    0 0 60px rgba(0, 0, 0, .9);
}

/* 沉浸场景背景层（独立于 #app::before，作用于壳内） */
.immersive-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: brightness(.92) saturate(1.05);
  animation: bg-pan 30s ease-in-out infinite alternate;
  transition: filter .55s ease;
}
@keyframes bg-pan {
  0%   { transform: scale(1.05) translate(-1%, -1%); }
  100% { transform: scale(1.05) translate(1%, 1%); }
}
/* 背景 cross-fade 过渡 */
.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity .65s ease;
}
.bg-fade-enter-from,
.bg-fade-leave-to { opacity: 0; }
.bg-fade-leave-active { position: absolute; inset: 0; }
.immersive-vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(20, 8, 4, .65) 100%),
    linear-gradient(180deg, rgba(20, 8, 4, .55) 0%, transparent 25%, transparent 70%, rgba(10, 4, 2, .85) 100%);
}

/* 鎏金边框 + 四角云纹 */
.shell-frame {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 80;
  border: 1px solid rgba(232, 196, 104, .35);
  box-shadow:
    inset 0 0 0 2px rgba(0, 0, 0, .55),
    inset 0 0 24px rgba(0, 0, 0, .5);
}
.corner {
  position: absolute;
  width: 26px;
  height: 26px;
  pointer-events: none;
}
.corner::before, .corner::after {
  content: '';
  position: absolute;
  background: var(--c-gold);
  box-shadow: 0 0 6px rgba(232, 196, 104, .65);
}
.corner::before { width: 26px; height: 2px; }
.corner::after  { width: 2px;  height: 26px; }
.corner.tl { top: 4px; left: 4px; }
.corner.tl::before { top: 0; left: 0; }
.corner.tl::after  { top: 0; left: 0; }
.corner.tr { top: 4px; right: 4px; }
.corner.tr::before { top: 0; right: 0; }
.corner.tr::after  { top: 0; right: 0; }
.corner.bl { bottom: 4px; left: 4px; }
.corner.bl::before { bottom: 0; left: 0; }
.corner.bl::after  { bottom: 0; left: 0; }
.corner.br { bottom: 4px; right: 4px; }
.corner.br::before { bottom: 0; right: 0; }
.corner.br::after  { bottom: 0; right: 0; }

/* 主场景：唯一全局滚动容器（页面组件不再自带 height/overflow，以免双层滚动卡顿） */
.app-main {
  position: absolute;
  inset: 0;
  z-index: 5;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  padding: 56px 12px 32px 12px;
  /* 鎏金细滚动条（Firefox） */
  scrollbar-width: thin;
  scrollbar-color: rgba(232, 196, 104, .55) rgba(20, 10, 4, .35);
}
/* 鎏金细滚动条（WebKit） */
.app-main::-webkit-scrollbar { width: 6px; height: 6px; }
.app-main::-webkit-scrollbar-track {
  background: rgba(20, 10, 4, .35);
  border-radius: var(--r-sm);
}
.app-main::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--c-gold-dark), var(--c-gold));
  border-radius: var(--r-sm);
  border: 1px solid rgba(20, 10, 4, .55);
}
.app-main::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--c-gold), var(--c-gold-light));
}
.app-main::before {
  content: '';
  position: absolute;
  inset: 48px 6px 24px 6px;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at center, rgba(20, 10, 4, .35) 0%, rgba(20, 10, 4, .55) 100%);
  border-radius: var(--r-md);
  backdrop-filter: blur(.5px);
}

/* ============================================================
   路由切换：场景平移 + 墨点遮罩
   ============================================================ */
.scene-right-enter-active,
.scene-right-leave-active,
.scene-left-enter-active,
.scene-left-leave-active,
.scene-fade-enter-active,
.scene-fade-leave-active {
  transition: opacity .45s ease, transform .45s cubic-bezier(.2, .8, .25, 1.05), filter .45s;
}
.scene-right-enter-from { opacity: 0; transform: translateX(40px) scale(.98); filter: blur(2px); }
.scene-right-leave-to   { opacity: 0; transform: translateX(-40px) scale(.98); filter: blur(2px); }
.scene-left-enter-from  { opacity: 0; transform: translateX(-40px) scale(.98); filter: blur(2px); }
.scene-left-leave-to    { opacity: 0; transform: translateX(40px) scale(.98); filter: blur(2px); }
.scene-fade-enter-from  { opacity: 0; transform: scale(.96); filter: blur(3px); }
.scene-fade-leave-to    { opacity: 0; transform: scale(1.02); filter: blur(3px); }

/* 飘落粒子（落叶/灰烬） */
.particle-layer {
  position: absolute;
  inset: 0;
  z-index: 70;
  pointer-events: none;
  overflow: hidden;
}
.particle {
  position: absolute;
  top: -10px;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, rgba(255, 200, 120, .85) 0%, rgba(168, 35, 26, .55) 70%, transparent 100%);
  border-radius: 50%;
  filter: blur(.3px);
  animation: particle-fall linear infinite;
  opacity: .65;
}
@keyframes particle-fall {
  0%   { transform: translate3d(0, -10px, 0) rotate(0); opacity: 0; }
  10%  { opacity: .65; }
  90%  { opacity: .55; }
  100% { transform: translate3d(var(--drift, 0), 105vh, 0) rotate(360deg); opacity: 0; }
}

/* ============================================================
   主公书房子页面卡片 + 镜头推进
   ============================================================ */
/* 进入子页面：背景图轻 zoom 推进 + 加暗，把焦点交给卡片 */
.app-shell.in-subpage .immersive-bg {
  transform: scale(1.06);
  filter: brightness(.62) saturate(1.05) blur(.5px);
  transition: transform .55s cubic-bezier(.2,.8,.25,1.05), filter .45s ease;
}
.immersive-bg {
  transform: scale(1.0);
  transition: transform .55s cubic-bezier(.2,.8,.25,1.05), filter .45s ease;
}

/* 内容卡片：仿宣纸鎏金边 */
.page-card {
  position: relative;
  margin: 0 auto;
  max-width: 1080px;
  min-height: calc(100vh - 120px);
  padding: 44px 22px 28px 22px;
  background:
    linear-gradient(180deg, rgba(28, 16, 8, .82) 0%, rgba(20, 10, 4, .92) 100%);
  border-radius: var(--r-lg);
  box-shadow:
    0 0 0 1px rgba(232, 196, 104, .45),
    0 0 0 6px rgba(20, 10, 4, .55),
    0 0 32px rgba(0, 0, 0, .65);
}

/* 返回书房按钮 */
.back-to-study {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 30;
  height: 30px;
  padding: 0 14px 0 10px;
  border: 1px solid rgba(232, 196, 104, .55);
  border-radius: var(--r-lg);
  background: linear-gradient(180deg, rgba(40, 22, 10, .85), rgba(20, 10, 4, .9));
  color: #f0d590;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform .18s, box-shadow .18s, color .18s;
}
.back-to-study:hover {
  color: #fff1c2;
  transform: translateX(-2px);
  box-shadow: 0 0 12px rgba(232, 196, 104, .35);
}
.back-glyph { font-size: 12px; opacity: .8; }
.back-text { color: inherit; }

.page-empty { width: 100%; height: 100%; }

/* 卡片浮起过渡 */
.page-rise-enter-active,
.page-rise-leave-active {
  transition: opacity .35s ease, transform .35s cubic-bezier(.2,.8,.25,1.1);
}
.page-rise-enter-from {
  opacity: 0;
  transform: translateY(18px) scale(.985);
}
.page-rise-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(.99);
}

/* ============================================================
   移动端 / 触控屏性能降级：去 GPU 重 backdrop-filter + 简化 transition
   ============================================================ */
@media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .app-main::before { backdrop-filter: none; }
  .immersive-bg { animation: none !important; }
  .app-shell.in-subpage .immersive-bg { transform: none; filter: brightness(.6); }
  .page-card { padding: 40px 12px 20px 12px; border-radius: var(--r-md); }
  /* 路由切换去掉 filter: blur()——它在移动 GPU 上每帧都重新合成 */
  .scene-right-enter-from,
  .scene-right-leave-to,
  .scene-left-enter-from,
  .scene-left-leave-to,
  .scene-fade-enter-from,
  .scene-fade-leave-to { filter: none !important; }
  .scene-right-enter-active,
  .scene-right-leave-active,
  .scene-left-enter-active,
  .scene-left-leave-active,
  .scene-fade-enter-active,
  .scene-fade-leave-active { transition: opacity .25s ease, transform .25s ease !important; }
}
</style>
