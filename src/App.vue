<template>
  <div class="stage">
    <div class="app-shell">
      <!-- 全屏沉浸场景背景层（图片走 BASE_URL，兼容子路径部署） -->
      <div class="immersive-bg" :style="bgStyle"></div>
      <div class="immersive-vignette"></div>

      <!-- 鎏金边框装饰 -->
      <div class="shell-frame">
        <span class="corner tl"></span>
        <span class="corner tr"></span>
        <span class="corner bl"></span>
        <span class="corner br"></span>
      </div>

      <!-- 顶部下垂卷轴 HUD -->
      <ScrollHUD />

      <!-- 主场景（无 padding，让页面自己掌控布局） -->
      <main class="app-main">
        <router-view v-slot="{ Component, route }">
          <transition :name="transitionName" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>

      <!-- 右侧令旗导航 -->
      <BannerNav />

      <EventModal />
      <EndingModal />

      <!-- 飘落落叶/灰烬粒子（沉浸气氛） -->
      <div class="particle-layer" aria-hidden="true">
        <span v-for="i in 8" :key="i" class="particle" :style="particleStyle(i)"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ScrollHUD from './components/ScrollHUD.vue'
import BannerNav from './components/BannerNav.vue'
import EventModal from './components/EventModal.vue'
import EndingModal from './components/EndingModal.vue'

const route = useRoute()
const transitionName = ref('scene-fade')

// 背景图：用 BASE_URL 拼接，兼容 GitHub Pages 子路径部署
const bgStyle = computed(() => ({
  backgroundImage: `url(${import.meta.env.BASE_URL}img/bg.png)`
}))

const ORDER = ['/city', '/heroes', '/battle', '/map', '/profile', '/chronicle']
watch(
  () => route.path,
  (to, from) => {
    if (!from) return
    const ti = ORDER.indexOf(to)
    const fi = ORDER.indexOf(from)
    if (ti < 0 || fi < 0) { transitionName.value = 'scene-fade'; return }
    transitionName.value = ti > fi ? 'scene-right' : 'scene-left'
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
}
@keyframes bg-pan {
  0%   { transform: scale(1.05) translate(-1%, -1%); }
  100% { transform: scale(1.05) translate(1%, 1%); }
}
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

/* 主场景：不留 padding，由页面自由布局 */
.app-main {
  position: absolute;
  inset: 0;
  z-index: 5;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 130px 56px 16px 8px;
}
.app-main::before {
  content: '';
  position: absolute;
  inset: 120px 50px 8px 2px;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at center, rgba(20, 10, 4, .35) 0%, rgba(20, 10, 4, .55) 100%);
  border-radius: 6px;
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
</style>
