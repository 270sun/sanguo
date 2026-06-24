<template>
  <transition name="evt-modal">
    <div v-if="show" class="evt-mask" @click.self="onSkip">
      <div class="evt-panel ink-frame" :class="typeClass">
        <div class="evt-ribbon">{{ typeLabel }}</div>
        <!-- 类型插画带：AI 实时生成 + SVG 兜底 + 渐变兜底 -->
        <div class="evt-hero">
          <div class="evt-hero-svg" v-html="eventSvg"></div>
          <img
            v-if="!heroImgFailed"
            class="evt-hero-img"
            :class="{ loaded: heroImgLoaded }"
            :src="eventImage(event.type || 'gossip')"
            :alt="typeLabel"
            @load="heroImgLoaded = true"
            @error="heroImgFailed = true"
          />
          <div v-if="!heroImgFailed && !heroImgLoaded" class="evt-hero-loading">绘图中…</div>
        </div>
        <header class="evt-head">
          <div class="evt-icon">{{ event.icon }}</div>
          <div class="evt-title-wrap">
            <div class="evt-title">{{ event.title }}</div>
            <div class="evt-quote">— {{ event.quote }}</div>
          </div>
        </header>

        <div class="evt-desc">{{ event.desc }}</div>

        <div class="evt-choices">
          <button
            v-for="c in event.choices"
            :key="c.key"
            class="evt-choice"
            @click="onChoose(c.key)"
          >
            <div class="ec-label">{{ c.label }}</div>
            <div class="ec-desc">{{ c.desc }}</div>
          </button>
        </div>

        <div v-if="event.lore" class="evt-lore">
          <div class="lore-head" @click="loreOpen = !loreOpen">
            <span>🕮 {{ event.lore.title }}</span>
            <span class="lore-toggle">{{ loreOpen ? '▾' : '▸' }}</span>
          </div>
          <p v-if="loreOpen" class="lore-text">{{ event.lore.text }}</p>
        </div>

        <div class="evt-foot">
          <button class="btn ghost small" @click="onSkip">束之高阁</button>
          <div class="evt-tip">事件将存入 史册卷宗</div>
        </div>

        <transition name="toast">
          <div v-if="toast" class="evt-toast" :class="toast.type">{{ toast.msg }}</div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { EVENT_MAP } from '../data/events.js'
import { EVENT_ICONS } from '../assets/icons.js'
import { eventImage } from '../utils/aiImage.js'

const game = useGameStore()
const show = computed(() => !!game.pendingEvent)
const event = computed(() => {
  if (!game.pendingEvent) return {}
  return EVENT_MAP[game.pendingEvent.key] || {}
})

const loreOpen = ref(false)
const heroImgFailed = ref(false)
const heroImgLoaded = ref(false)
const eventSvg = computed(() => EVENT_ICONS[event.value.type] || EVENT_ICONS.gossip)

watch(() => game.pendingEvent?.key, () => {
  heroImgFailed.value = false
  heroImgLoaded.value = false
})

const TYPE_LABEL = {
  disaster: '天灾',
  crime: '盗匪',
  envoy: '外使',
  market: '集市',
  history: '史事',
  culture: '风物',
  gossip: '逸闻'
}
const typeLabel = computed(() => TYPE_LABEL[event.value.type] || '事件')
const typeClass = computed(() => 'type-' + (event.value.type || 'misc'))

const toast = ref(null)
let toastTimer = null
function showToast(msg, type = 'ok') {
  toast.value = { msg, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 1500)
}

function onChoose(key) {
  const r = game.resolveEvent(key)
  if (!r.ok) {
    showToast(r.reason || '失败', 'err')
    return
  }
  if (r.msg) showToast(r.msg, 'ok')
  loreOpen.value = false
}

function onSkip() {
  game.dismissEvent()
  loreOpen.value = false
}
</script>

<style scoped>
.evt-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 12px;
  backdrop-filter: blur(2px);
}
.evt-panel {
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 86vh;
  overflow-y: auto;
  background:
    linear-gradient(180deg, rgba(255, 245, 210, .98), rgba(220, 195, 140, .98));
  border: 2px solid var(--c-gold-dark);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .55),
    0 12px 48px rgba(0, 0, 0, .8),
    0 0 24px rgba(232, 196, 104, .35);
  padding: 14px 14px 12px;
}
.evt-ribbon {
  position: absolute;
  top: 0;
  right: 14px;
  background: var(--c-red);
  color: #fff5cf;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 3px;
  padding: 4px 10px 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .5);
}
.type-disaster .evt-ribbon { background: #6b1d1d; }
.type-crime .evt-ribbon { background: #4a2c1a; }
.type-envoy .evt-ribbon { background: #2b4d6d; }
.type-market .evt-ribbon { background: #8a6a1a; }
.type-history .evt-ribbon { background: #3d2c52; }
.type-culture .evt-ribbon { background: #2c5a3d; }
.type-gossip .evt-ribbon { background: #5a4a2c; }

/* 类型插画带 —— 顶部 90px 横幅，jpg 加载失败时由 SVG + 渐变兜底 */
.evt-hero {
  position: relative;
  width: calc(100% + 28px);
  margin: -14px -14px 10px;
  height: 90px;
  overflow: hidden;
  border-bottom: 1.5px solid var(--c-gold-dark);
  background: linear-gradient(135deg, #b89060, #6e4a20);
}
.evt-hero-img {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity .5s ease;
}
.evt-hero-img.loaded { opacity: .96; }
.evt-hero-svg {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 245, 210, .85);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.55));
  pointer-events: none;
}
.evt-hero-svg :deep(svg) { width: 56px; height: 56px; }
.evt-hero-loading {
  position: absolute;
  z-index: 3;
  right: 10px;
  bottom: 6px;
  font-family: var(--font-title);
  font-size: 12px;
  letter-spacing: 3px;
  color: rgba(255, 245, 210, .85);
  text-shadow: 0 1px 3px rgba(0,0,0,.7);
  animation: heroBlink 1.2s ease-in-out infinite;
}
@keyframes heroBlink { 0%,100% { opacity: .4; } 50% { opacity: 1; } }
/* 7 种事件类型的渐变兜底 */
.type-disaster .evt-hero { background: linear-gradient(135deg, #6b1d1d, #2a0808); }
.type-crime    .evt-hero { background: linear-gradient(135deg, #4a2c1a, #1a0e07); }
.type-envoy    .evt-hero { background: linear-gradient(135deg, #2b4d6d, #0e1f30); }
.type-market   .evt-hero { background: linear-gradient(135deg, #8a6a1a, #3a2a08); }
.type-history  .evt-hero { background: linear-gradient(135deg, #3d2c52, #14091e); }
.type-culture  .evt-hero { background: linear-gradient(135deg, #2c5a3d, #0a1a12); }
.type-gossip   .evt-hero { background: linear-gradient(135deg, #5a4a2c, #1c1408); }

.evt-head {
  display: flex;
  gap: 10px;
  align-items: center;
  border-bottom: 1.5px solid var(--c-line);
  padding-bottom: 8px;
  margin-bottom: 8px;
  padding-right: 60px;
}
.evt-icon {
  font-size: 36px;
  filter: drop-shadow(0 0 6px rgba(232, 196, 104, .55));
}
.evt-title {
  font-family: var(--font-title);
  font-size: 18px;
  letter-spacing: 4px;
  color: var(--c-ink);
  font-weight: 800;
}
.evt-quote {
  font-size: 13px;
  color: var(--c-gold-dark);
  letter-spacing: 1px;
  font-style: italic;
  margin-top: 2px;
}

.evt-desc {
  font-size: 13px;
  color: var(--c-ink);
  letter-spacing: 0.5px;
  line-height: 1.75;
  background: rgba(255, 240, 200, .55);
  border-left: 3px solid var(--c-red);
  padding: 8px 10px;
  margin-bottom: 10px;
}

.evt-choices {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}
.evt-choice {
  text-align: left;
  background: rgba(255, 245, 210, .85);
  border: 1px solid var(--c-line);
  padding: 8px 10px;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s, border-color .15s;
  font-family: inherit;
  color: var(--c-ink);
}
.evt-choice:hover {
  transform: translateX(2px);
  border-color: var(--c-red);
  background: rgba(255, 215, 100, .55);
  box-shadow: 0 0 8px rgba(232, 196, 104, .55);
}
.ec-label {
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 2px;
  font-weight: 700;
  margin-bottom: 2px;
}
.ec-desc {
  font-size: 13px;
  color: var(--c-muted);
  line-height: 1.4;
}

.evt-lore {
  border-top: 1px dashed var(--c-line);
  padding-top: 6px;
  margin-bottom: 8px;
}
.lore-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--c-gold-dark);
}
.lore-text {
  font-size: 13px;
  color: var(--c-ink);
  letter-spacing: 0.5px;
  line-height: 1.7;
  margin: 6px 0 0;
  padding: 6px 8px;
  background: rgba(255, 240, 200, .6);
  border-left: 2px solid var(--c-gold-dark);
}

.evt-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--c-line);
  padding-top: 6px;
}
.evt-tip {
  font-size: 12px;
  color: var(--c-muted);
  letter-spacing: 1px;
}
.btn.ghost.small {
  font-size: 12px;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--c-muted);
  color: var(--c-muted);
  cursor: pointer;
}
.btn.ghost.small:hover { border-color: var(--c-red); color: var(--c-red); }

.evt-toast {
  position: absolute;
  left: 50%;
  bottom: 50px;
  transform: translateX(-50%);
  padding: 6px 14px;
  font-size: 13px;
  letter-spacing: 1px;
  border: 1px solid var(--c-gold-dark);
  background: rgba(40, 24, 14, .92);
  color: #fff5cf;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .55);
  pointer-events: none;
}
.evt-toast.err { color: #ffb0b0; border-color: var(--c-red); }
.toast-enter-active, .toast-leave-active { transition: opacity .25s, transform .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }

.evt-modal-enter-active, .evt-modal-leave-active { transition: opacity .25s ease; }
.evt-modal-enter-active .evt-panel,
.evt-modal-leave-active .evt-panel { transition: transform .3s ease; }
.evt-modal-enter-from { opacity: 0; }
.evt-modal-leave-to { opacity: 0; }
.evt-modal-enter-from .evt-panel { transform: scale(.92); }
.evt-modal-leave-to .evt-panel { transform: scale(.96); }

@media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .evt-mask { backdrop-filter: none; }
}
</style>
