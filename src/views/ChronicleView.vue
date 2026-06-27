﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <div class="chronicle-view">
    <header class="ch-head paper-bg">
      <div class="ch-title-row">
        <div class="ch-title">史册卷宗</div>
        <div class="ch-stats">
          <span class="ch-year">{{ game.currentYear }}年·{{ game.currentSeason.label }}季</span>
          <span class="ch-count">共 {{ game.chronicle.length }} 卷</span>
        </div>
      </div>
      <div class="ch-sub">"以铜为镜，可正衣冠；以史为镜，可知兴替"</div>
      <div class="ch-filter">
        <button
          v-for="f in filters"
          :key="f.key"
          class="ch-filter-btn"
          :class="{ active: filterKey === f.key }"
          @click="filterKey = f.key"
        >
          {{ f.icon }} {{ f.label }}
        </button>
      </div>
    </header>

    <div v-if="filtered.length === 0" class="ch-empty">
      <div class="empty-icon">📜</div>
      <div class="empty-text">尚无史册记录</div>
      <div class="empty-hint">游戏中触发的事件与决断将自动收录于此</div>
    </div>

    <ol v-else class="ch-list">
      <li
        v-for="(c, i) in filtered"
        :key="c.id"
        class="ch-item"
        :class="['type-' + (c.type || 'misc'), { 'is-key': isKey(c) }]"
      >
        <div class="ch-spine">{{ filtered.length - i }}</div>
        <div class="ch-card paper-bg">
          <div v-if="isKey(c)" class="ch-stamp" :title="stampTitle(c)">
            <span class="stamp-char">{{ stampChar(c) }}</span>
          </div>
          <div class="ch-card-head">
            <span class="ch-icon">{{ c.icon }}</span>
            <span class="ch-event-title">{{ c.eventTitle }}</span>
            <span class="ch-type-pill">{{ typeLabel(c.type) }}</span>
          </div>
          <div class="ch-meta">
            <span class="ch-date">{{ formatTs(c.ts) }}</span>
          </div>
          <div v-if="c.choiceLabel" class="ch-choice" :class="{ flavor: c.type === 'season' }">
            <span v-if="c.type !== 'season'" class="ch-choice-label">► 主公定夺：</span>
            <span class="ch-choice-text">{{ c.choiceLabel }}</span>
          </div>
          <div v-if="c.effects" class="ch-result">{{ c.effects }}</div>
          <div v-if="c.msg" class="ch-result">{{ c.msg }}</div>
          <div v-if="loreOf(c)" class="ch-lore" @click="toggleLore(c.id)">
            <div class="ch-lore-head">
              🕮 {{ loreOf(c).title }}
              <span class="ch-lore-toggle">{{ openId === c.id ? '▾' : '▸' }}</span>
            </div>
            <p v-if="openId === c.id" class="ch-lore-text">{{ loreOf(c).text }}</p>
          </div>
        </div>
      </li>
    </ol>

    <div v-if="game.chronicle.length > 0" class="ch-foot">
      <button class="btn ghost" @click="onClear">焚毁旧册（清空）</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { EVENT_MAP } from '../data/events.js'

const game = useGameStore()
const openId = ref(null)
const filterKey = ref('all')

const filters = [
  { key: 'all',      label: '全部', icon: '☰' },
  { key: 'season',   label: '岁时', icon: '季' },
  { key: 'disaster', label: '天灾', icon: '☀️' },
  { key: 'crime',    label: '盗匪', icon: '🗡' },
  { key: 'envoy',    label: '外使', icon: '🐎' },
  { key: 'market',   label: '集市', icon: '💰' },
  { key: 'history',  label: '史事', icon: '📖' },
  { key: 'culture',  label: '风物', icon: '🎋' },
  { key: 'gossip',   label: '逸闻', icon: '🍵' }
]

const TYPE_LABEL = {
  disaster: '天灾', crime: '盗匪', envoy: '外使', market: '集市',
  history: '史事', culture: '风物', gossip: '逸闻', season: '岁时'
}
function typeLabel(t) { return TYPE_LABEL[t] || '事件' }

const filtered = computed(() => {
  if (filterKey.value === 'all') return game.chronicle
  return game.chronicle.filter((c) => c.type === filterKey.value)
})

function isKey(c) {
  return c.type === 'season' || c.type === 'history' || /城破|攻取|大捷/.test(c.eventTitle || '')
}
function stampChar(c) {
  if (c.type === 'season') return '岁'
  if (c.type === 'history') return '史'
  return '勝'
}
function stampTitle(c) {
  if (c.type === 'season') return '岁时印 · 季节更迭'
  if (c.type === 'history') return '史官印 · 重要事件'
  return '功业印 · 大捷'
}

function loreOf(c) {
  const e = EVENT_MAP[c.eventKey]
  return e?.lore
}
function toggleLore(id) {
  openId.value = openId.value === id ? null : id
}

function formatTs(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function onClear() {
  if (!confirm('焚毁全部史册？此操作不可逆。')) return
  game.chronicle = []
  game.saveToLocal()
}
</script>

<style scoped>
.chronicle-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 6px;
}

.ch-head {
  border: 1.5px solid var(--c-gold-dark);
  padding: 10px 12px 6px;
  box-shadow: inset 0 0 0 1px rgba(255, 240, 200, .35);
}
.ch-title-row { display: flex; justify-content: space-between; align-items: baseline; }
.ch-title {
  font-family: var(--font-title);
  font-size: 18px;
  letter-spacing: 6px;
  color: var(--c-ink);
  font-weight: 800;
}
.ch-stats {
  font-size: 13px;
  color: var(--c-muted);
  letter-spacing: 1px;
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.ch-year {
  color: var(--c-red);
  font-family: var(--font-title);
  font-weight: 700;
  letter-spacing: 2px;
}
.ch-count { color: var(--c-muted); }
.ch-sub {
  font-size: 13px;
  color: var(--c-gold-dark);
  letter-spacing: 1px;
  font-style: italic;
  margin: 4px 0 8px;
}
.ch-filter {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.ch-filter-btn {
  background: rgba(255, 240, 200, .35);
  border: 1px solid var(--c-line);
  color: var(--c-muted);
  font-size: 12px;
  padding: 3px 7px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
}
.ch-filter-btn:hover { color: var(--c-ink); border-color: var(--c-gold-dark); }
.ch-filter-btn.active {
  background: var(--c-red);
  color: #fff5cf;
  border-color: var(--c-red);
}

.ch-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--c-muted);
}
.empty-icon { font-size: 48px; opacity: .55; margin-bottom: 8px; }
.empty-text { font-family: var(--font-title); letter-spacing: 4px; font-size: 15px; }
.empty-hint { font-size: 13px; margin-top: 4px; letter-spacing: 1px; }

.ch-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ch-item { position: relative; display: flex; gap: 8px; }
.ch-spine {
  flex-shrink: 0;
  width: 22px;
  background: linear-gradient(180deg, #8a2525 0%, #5a1818 100%);
  color: #fff5cf;
  font-family: var(--font-title);
  font-size: 12px;
  text-align: center;
  padding: 6px 2px;
  letter-spacing: 1px;
  border: 1px solid var(--c-gold-dark);
  box-shadow: inset 0 0 0 1px rgba(255, 240, 200, .35);
  writing-mode: vertical-rl;
  text-orientation: upright;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ch-card {
  flex: 1;
  border: 1px solid var(--c-line);
  padding: 8px 10px;
  position: relative;
}
.ch-stamp {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 32px;
  height: 32px;
  border: 2px solid var(--c-red);
  background: rgba(255, 240, 200, .35);
  color: var(--c-red);
  font-family: var(--font-title);
  font-weight: 900;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-8deg);
  opacity: .85;
  box-shadow: 0 0 0 1px rgba(180, 30, 30, .25) inset, 0 0 4px rgba(180, 30, 30, .15);
  pointer-events: auto;
  cursor: help;
}
.ch-stamp .stamp-char {
  text-shadow: 0 0 2px rgba(180, 30, 30, .5);
  letter-spacing: 0;
}
.is-key .ch-card {
  border-color: var(--c-red);
  box-shadow: inset 0 0 0 1px rgba(180, 30, 30, .15);
}
.type-season .ch-card { border-left: 3px solid #86c46b; }
.type-season .ch-type-pill { background: #2c5a3d; }
.ch-choice.flavor {
  color: var(--c-gold-dark);
  font-style: italic;
  font-family: var(--font-title);
  letter-spacing: 2px;
}
.ch-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px dashed var(--c-line);
  padding-bottom: 4px;
  margin-bottom: 4px;
}
.ch-icon { font-size: 18px; }
.ch-event-title {
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 3px;
  color: var(--c-ink);
  font-weight: 700;
}
.ch-type-pill {
  margin-left: auto;
  font-size: 12px;
  letter-spacing: 1px;
  padding: 1px 6px;
  background: rgba(40, 24, 14, .85);
  color: #fff5cf;
}
.type-disaster .ch-type-pill { background: #6b1d1d; }
.type-crime .ch-type-pill { background: #4a2c1a; }
.type-envoy .ch-type-pill { background: #2b4d6d; }
.type-market .ch-type-pill { background: #8a6a1a; }
.type-history .ch-type-pill { background: #3d2c52; }
.type-culture .ch-type-pill { background: #2c5a3d; }

.ch-meta { font-size: 12px; color: var(--c-muted); margin-bottom: 4px; letter-spacing: 1px; }
.ch-date { font-family: var(--font-num); }
.ch-choice { font-size: 13px; color: var(--c-ink); margin-bottom: 3px; }
.ch-choice-label { color: var(--c-red); font-weight: 600; }
.ch-choice-text { font-family: var(--font-title); letter-spacing: 1px; }
.ch-result {
  font-size: 13px;
  color: var(--c-gold-dark);
  background: rgba(232, 196, 104, .12);
  padding: 4px 6px;
  border-left: 2px solid var(--c-gold-dark);
  margin-bottom: 4px;
}

.ch-lore {
  margin-top: 4px;
  cursor: pointer;
  border-top: 1px dashed var(--c-line);
  padding-top: 4px;
}
.ch-lore-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 1px;
  color: var(--c-gold-dark);
}
.ch-lore-text {
  font-size: 13px;
  color: var(--c-ink);
  line-height: 1.65;
  margin: 4px 0 0;
  padding: 6px 8px;
  background: rgba(255, 240, 200, .55);
  border-left: 2px solid var(--c-gold-dark);
}

.ch-foot { display: flex; justify-content: center; margin-top: 4px; }
.btn.ghost {
  background: transparent;
  border: 1px solid var(--c-muted);
  color: var(--c-muted);
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 2px;
  padding: 5px 14px;
  cursor: pointer;
}
.btn.ghost:hover { border-color: var(--c-red); color: var(--c-red); }
</style>
