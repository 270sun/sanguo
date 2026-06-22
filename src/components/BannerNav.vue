<template>
  <nav class="banner-nav" :class="{ expanded }">
    <!-- 旗杆 -->
    <div class="flag-pole"></div>

    <!-- 折叠提示按钮（永远显示一面主旗） -->
    <button class="pole-toggle" @click="toggle" :title="expanded ? '收旗' : '点旗布阵'">
      <AppIcon kind="misc" id="flag" :size="18" />
    </button>

    <!-- 5 杆军旗 -->
    <div class="flag-stack">
      <router-link
        v-for="(t, i) in tabs"
        :key="t.path"
        :to="t.path"
        class="flag-item"
        active-class="active"
        :style="{ '--i': i, '--delay': (i * 70) + 'ms' }"
        @click="onPick"
      >
        <div class="flag-cloth">
          <AppIcon class="flag-icon" :kind="t.iconKind" :id="t.iconId" :size="20" />
          <span class="flag-label">{{ t.title }}</span>
        </div>
        <div class="flag-tail"></div>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'

const router = useRouter()
const expanded = ref(true)
const tabs = computed(() =>
  router.options.routes
    .filter((r) => r.meta && r.meta.title && r.meta.iconKind && r.meta.iconId)
    .filter((r) => r.path !== '/chronicle')
    .map((r) => ({ path: r.path, title: r.meta.title, iconKind: r.meta.iconKind, iconId: r.meta.iconId }))
)

function toggle() { expanded.value = !expanded.value }
function onPick() { /* 保留展开 */ }
</script>

<style scoped>
.banner-nav {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}

/* 旗杆装饰 */
.flag-pole {
  position: absolute;
  right: 10px;
  top: -10px;
  bottom: -10px;
  width: 4px;
  background: linear-gradient(180deg, #d4a849 0%, #6e4a20 30%, #3a2410 100%);
  border-left: 1px solid #fff1c2;
  border-right: 1px solid #1a0e07;
  border-radius: 2px;
  box-shadow: 2px 0 6px rgba(0,0,0,.5);
  pointer-events: none;
}
.flag-pole::before, .flag-pole::after {
  content: '';
  position: absolute;
  left: -3px;
  width: 10px;
  height: 10px;
  background: radial-gradient(ellipse at 30% 30%, #fff1c2, #d4a849 40%, #6e4a20);
  border: 1px solid #1a0e07;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0,0,0,.6);
}
.flag-pole::before { top: -8px; }
.flag-pole::after { bottom: -8px; }

/* 折叠按钮 */
.pole-toggle {
  pointer-events: auto;
  position: absolute;
  right: 0;
  top: -52px;
  width: 28px;
  height: 28px;
  background: linear-gradient(180deg, #a8231a 0%, #6e1410 100%);
  color: #fff1c2;
  border: 1px solid #4a0808;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 14px;
  box-shadow:
    inset 0 0 0 1px rgba(255,240,200,.35),
    0 0 8px rgba(168, 35, 26, .7),
    0 2px 4px rgba(0,0,0,.5);
  cursor: pointer;
  transition: transform .25s ease;
}
.pole-toggle:hover { transform: scale(1.1) rotate(10deg); }
.banner-nav.expanded .pole-toggle { transform: rotate(180deg); }

/* 旗组容器 */
.flag-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  padding: 4px 8px 4px 0;
  pointer-events: auto;
}

/* 单面旗 */
.flag-item {
  position: relative;
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #fff1c2;
  height: 36px;
  transform: translateX(120%);
  opacity: 0;
  animation: flag-in .45s cubic-bezier(.2,.8,.25,1.2) forwards;
  animation-delay: var(--delay, 0ms);
  transition: transform .25s ease, filter .25s;
}
.banner-nav:not(.expanded) .flag-item {
  animation: flag-out .35s cubic-bezier(.5,0,.75,0) forwards;
}
@keyframes flag-in {
  0% { transform: translateX(120%) rotate(8deg); opacity: 0; }
  60% { transform: translateX(-4%) rotate(-2deg); opacity: 1; }
  100% { transform: translateX(0) rotate(0); opacity: 1; }
}
@keyframes flag-out {
  to { transform: translateX(120%) rotate(8deg); opacity: 0; }
}

.flag-cloth {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px 4px 8px;
  background:
    linear-gradient(180deg, #c0392b 0%, #8e1a14 60%, #4a0808 100%);
  border: 1px solid #4a0808;
  border-left-width: 0;
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 2px;
  text-shadow: 0 1px 0 rgba(0,0,0,.55);
  position: relative;
  /* 旗帜飘扬感：右侧锯齿 */
  clip-path: polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,240,200,.35),
    inset 0 -2px 4px rgba(0,0,0,.4),
    0 2px 6px rgba(0,0,0,.5);
  filter: saturate(.85) brightness(.85);
  transition: filter .25s, transform .25s;
}
.flag-cloth::before {
  content: '';
  position: absolute;
  inset: 2px;
  border: 1px solid rgba(255, 240, 200, .25);
  pointer-events: none;
  clip-path: polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%);
}
.flag-icon {
  color: #fff1c2;
  filter: drop-shadow(0 1px 0 rgba(0,0,0,.6));
}
.flag-label {
  color: #fff1c2;
  font-weight: 700;
}

/* 旗尾穗 */
.flag-tail {
  width: 4px;
  height: 36px;
  background: linear-gradient(180deg, #d4a849 0%, #6e4a20 100%);
  border-left: 1px solid #fff1c2;
  margin-left: 0;
}

/* 激活态：完整亮起 + 飘扬动画 */
.flag-item.active .flag-cloth {
  filter: saturate(1.2) brightness(1.1);
  transform: translateX(-6px);
  box-shadow:
    inset 0 1px 0 rgba(255,240,200,.55),
    inset 0 -2px 4px rgba(0,0,0,.5),
    0 0 10px rgba(232, 196, 104, .65),
    0 2px 8px rgba(0,0,0,.6);
  animation: flag-wave 2.4s ease-in-out infinite;
}
.flag-item.active .flag-icon {
  filter: drop-shadow(0 0 4px rgba(255, 241, 194, .8));
}
@keyframes flag-wave {
  0%, 100% { transform: translateX(-6px) skewY(0deg); }
  25%      { transform: translateX(-5px) skewY(-1.5deg); }
  75%      { transform: translateX(-7px) skewY(1.5deg); }
}

.flag-item:hover .flag-cloth { filter: saturate(1.1) brightness(1.05); transform: translateX(-3px); }

/* 折叠态：仅展示主按钮 */
.banner-nav:not(.expanded) .flag-pole {
  opacity: .35;
  transition: opacity .35s;
}
</style>
