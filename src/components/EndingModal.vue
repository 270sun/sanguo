<template>
  <transition name="ending-fade">
    <div v-if="game.pendingEnding" class="ending-mask" @click.self="close">
      <div class="scroll-wrap">
        <div class="scroll-cap top"></div>
        <div class="scroll-paper">
          <div class="seal" :title="seal.title">
            <span class="seal-text">{{ seal.text }}</span>
          </div>
          <h1 class="ending-title">{{ data.title }}</h1>
          <div class="ending-sub">{{ data.subtitle }}</div>

          <div class="ending-poem">
            <div v-for="(line, i) in data.poem" :key="i" class="poem-line" :style="poemDelay(i)">
              {{ line }}
            </div>
          </div>

          <div class="ending-stats">
            <div class="stat-row">
              <span class="stat-label">已据州郡</span>
              <b class="stat-num">{{ game.territories.length }}</b>
              <span class="stat-unit">/ 13</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">麾下武将</span>
              <b class="stat-num">{{ game.heroes.length }}</b>
              <span class="stat-unit">员</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">岁次</span>
              <b class="stat-num">{{ game.currentYear }}</b>
              <span class="stat-unit">年 · {{ game.currentSeason.label }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">声望</span>
              <b class="stat-num">{{ Math.floor(game.resources.reputation) }}</b>
            </div>
          </div>

          <div class="ending-flavor">{{ data.flavor }}</div>

          <button class="ending-btn" @click="close">{{ data.btn }}</button>
        </div>
        <div class="scroll-cap bottom"></div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const game = useGameStore()

const ENDINGS = {
  hegemony: {
    title: '霸 业 初 成',
    subtitle: '八州在手 · 威震四方',
    poem: [
      '金戈铁马，气吞万里如虎；',
      '八州在手，群雄敛锋而拜。',
      '主公之名，已动天下耳目。'
    ],
    flavor: '风云方起，前路尚有五州未平。九鼎之归，犹待主公一统。',
    btn: '继续征伐 »',
    seal: { text: '霸', title: '霸业之印' }
  },
  unify: {
    title: '一 统 天 下',
    subtitle: '十三州尽归 · 海内归心',
    poem: [
      '三川北虏乱如麻，四海南奔似永嘉；',
      '今朝天下定一统，万里山河尽王化。',
      '主公功业，史册留名。'
    ],
    flavor: '黄沙百战穿金甲，不破楼兰终不还。主公已得天下，可重启新局。',
    btn: '功成名就',
    seal: { text: '統', title: '一统之印' }
  }
}

const data = computed(() => ENDINGS[game.pendingEnding] || ENDINGS.hegemony)
const seal = computed(() => data.value.seal)

function poemDelay(i) {
  return { animationDelay: (0.5 + i * 0.6) + 's' }
}

function close() {
  game.dismissEnding()
}
</script>

<style scoped>
.ending-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: radial-gradient(ellipse at center, rgba(20, 8, 4, .82) 0%, rgba(0, 0, 0, .95) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  backdrop-filter: blur(2px);
}

.scroll-wrap {
  position: relative;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  animation: scroll-unfold 1.2s cubic-bezier(.2, .8, .25, 1.05);
}
@keyframes scroll-unfold {
  0%   { opacity: 0; transform: scaleY(.05) translateY(-20px); filter: blur(4px); }
  40%  { opacity: 1; transform: scaleY(.1); }
  100% { opacity: 1; transform: scaleY(1) translateY(0); filter: blur(0); }
}

.scroll-cap {
  height: 14px;
  background: linear-gradient(180deg, #6b3a18 0%, #3a1f0c 100%);
  border: 1px solid var(--c-gold-dark);
  box-shadow:
    inset 0 1px 0 rgba(255, 220, 160, .35),
    inset 0 -1px 0 rgba(0, 0, 0, .5),
    0 0 8px rgba(232, 196, 104, .35);
  border-radius: 3px;
  position: relative;
}
.scroll-cap::before,
.scroll-cap::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 12px;
  height: 18px;
  background: radial-gradient(ellipse, var(--c-gold) 30%, #6b3a18 70%);
  border: 1px solid var(--c-gold-dark);
  border-radius: 50%;
  transform: translateY(-50%);
}
.scroll-cap::before { left: -6px; }
.scroll-cap::after  { right: -6px; }

.scroll-paper {
  position: relative;
  background:
    radial-gradient(circle at 30% 20%, rgba(232, 196, 104, .15), transparent 60%),
    linear-gradient(180deg, #f3e2b8 0%, #e8d09c 100%);
  color: var(--c-ink);
  padding: 30px 26px 24px;
  border-left: 1px solid var(--c-gold-dark);
  border-right: 1px solid var(--c-gold-dark);
  text-align: center;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .55),
    inset 0 0 30px rgba(140, 80, 30, .25),
    0 0 24px rgba(0, 0, 0, .65);
}

.seal {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 44px;
  height: 44px;
  border: 3px solid var(--c-red);
  background: rgba(255, 240, 200, .3);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-10deg);
  box-shadow:
    inset 0 0 0 1px rgba(180, 30, 30, .25),
    0 0 4px rgba(180, 30, 30, .25);
  animation: seal-stamp 1.6s ease-out;
  cursor: help;
}
@keyframes seal-stamp {
  0%   { opacity: 0; transform: rotate(-10deg) scale(2.2); }
  60%  { opacity: 0; transform: rotate(-10deg) scale(2.2); }
  75%  { opacity: 1; transform: rotate(-10deg) scale(.85); }
  100% { opacity: 1; transform: rotate(-10deg) scale(1); }
}
.seal-text {
  font-family: var(--font-title);
  font-weight: 900;
  font-size: 24px;
  color: var(--c-red);
  text-shadow: 0 0 2px rgba(180, 30, 30, .65);
}

.ending-title {
  font-family: var(--font-title);
  font-size: 30px;
  letter-spacing: 8px;
  color: var(--c-ink);
  font-weight: 900;
  margin: 8px 0 4px;
  text-shadow: 0 0 10px rgba(232, 196, 104, .35);
  animation: title-glow 2.4s ease-in-out infinite alternate;
}
@keyframes title-glow {
  0%   { text-shadow: 0 0 6px rgba(232, 196, 104, .25); }
  100% { text-shadow: 0 0 14px rgba(232, 196, 104, .6); }
}
.ending-sub {
  font-size: 12px;
  letter-spacing: 4px;
  color: var(--c-red);
  font-style: italic;
  margin-bottom: 14px;
}

.ending-poem {
  margin: 14px 0 16px;
  padding: 10px 8px;
  border-top: 1px dashed var(--c-gold-dark);
  border-bottom: 1px dashed var(--c-gold-dark);
}
.poem-line {
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 2px;
  line-height: 1.9;
  color: var(--c-ink);
  opacity: 0;
  animation: poem-in .8s ease-out forwards;
}
@keyframes poem-in {
  0%   { opacity: 0; transform: translateY(6px); filter: blur(2px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}

.ending-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 14px;
  margin: 10px 0 14px;
  padding: 8px;
  background: rgba(40, 24, 14, .08);
  border: 1px solid rgba(140, 80, 30, .35);
}
.stat-row {
  font-size: 11px;
  color: var(--c-muted);
  display: flex;
  align-items: baseline;
  gap: 4px;
  letter-spacing: 1px;
}
.stat-label { font-family: var(--font-title); }
.stat-num {
  font-family: var(--font-num);
  font-size: 16px;
  color: var(--c-red);
  font-weight: 700;
}
.stat-unit { font-size: 10px; color: var(--c-muted); }

.ending-flavor {
  font-size: 11px;
  font-style: italic;
  color: var(--c-gold-dark);
  letter-spacing: 1px;
  line-height: 1.7;
  margin: 6px 0 14px;
}

.ending-btn {
  background: linear-gradient(180deg, var(--c-red) 0%, #6a1a1a 100%);
  color: #fff5cf;
  border: 1px solid var(--c-gold-dark);
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 6px;
  padding: 8px 24px;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(232, 196, 104, .35);
  transition: transform .15s, box-shadow .15s;
}
.ending-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 14px rgba(232, 196, 104, .6);
}
.ending-btn:active { transform: translateY(0); }

.ending-fade-enter-active,
.ending-fade-leave-active {
  transition: opacity .4s ease;
}
.ending-fade-enter-from,
.ending-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .ending-mask { backdrop-filter: none; }
}
</style>
