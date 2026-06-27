﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <div class="china-map" :class="{ compact }">
    <svg class="map-svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet">
      <defs>
        <!-- 整片大陆唯一底纹理（中原带 PNG，统一一张图覆盖全陆地） -->
        <pattern id="pat-land" patternUnits="userSpaceOnUse" width="1000" height="700">
          <image :href="img('zhongyuan')" x="0" y="0" width="1000" height="700" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
        </pattern>

        <!-- 海洋纹理（远景蓝灰扰动） -->
        <pattern id="pat-sea" patternUnits="userSpaceOnUse" width="220" height="220">
          <rect width="220" height="220" fill="#0e2336" />
          <path d="M 0 40 Q 55 30 110 40 T 220 40 M 0 90 Q 55 80 110 90 T 220 90 M 0 140 Q 55 130 110 140 T 220 140 M 0 190 Q 55 180 110 190 T 220 190"
            fill="none" stroke="rgba(120,170,210,0.16)" stroke-width="1" />
        </pattern>

        <!-- 5 个地理带的半透明色相罩（统一叠在大陆纹理上，仅用于色调区分） -->
        <linearGradient id="tint-beijiang" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(160,180,220,0.42)" />
          <stop offset="100%" stop-color="rgba(120,140,180,0.30)" />
        </linearGradient>
        <linearGradient id="tint-xiyu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(230,195,120,0.40)" />
          <stop offset="100%" stop-color="rgba(200,160,90,0.30)" />
        </linearGradient>
        <linearGradient id="tint-zhongyuan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(220,180,110,0.18)" />
          <stop offset="100%" stop-color="rgba(180,130,70,0.18)" />
        </linearGradient>
        <linearGradient id="tint-jiangnan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(120,180,140,0.32)" />
          <stop offset="100%" stop-color="rgba(90,150,110,0.30)" />
        </linearGradient>
        <linearGradient id="tint-nanchu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(90,160,120,0.42)" />
          <stop offset="100%" stop-color="rgba(70,120,90,0.40)" />
        </linearGradient>

        <!-- 羊皮卷暗角 -->
        <radialGradient id="parchment-vignette" cx="50%" cy="55%" r="80%">
          <stop offset="55%" stop-color="#000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000" stop-opacity="0.75" />
        </radialGradient>

        <!-- 海岸虚线（双层 stroke 模拟古地图海岸涌纹） -->
        <filter id="coast-glow" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- 占领发光描边 -->
        <filter id="own-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood flood-color="#d4af37" flood-opacity="0.85" />
          <feComposite in2="blur" operator="in" />
          <feComposite in="SourceGraphic" operator="over" />
        </filter>

        <!-- 烽烟 -->
        <filter id="smoke" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="3" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>

        <!-- 河流渐变 -->
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(120,180,220,0.2)" />
          <stop offset="50%" stop-color="rgba(140,200,230,0.85)" />
          <stop offset="100%" stop-color="rgba(120,180,220,0.2)" />
        </linearGradient>
        <linearGradient id="huanghe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(210,170,80,0.2)" />
          <stop offset="50%" stop-color="rgba(230,190,90,0.85)" />
          <stop offset="100%" stop-color="rgba(210,170,80,0.2)" />
        </linearGradient>

        <!-- 山脉锯齿 -->
        <symbol id="mtn" viewBox="0 0 40 16">
          <path d="M 0 16 L 8 4 L 14 12 L 20 2 L 26 11 L 32 5 L 40 16 Z"
            fill="rgba(40,28,16,0.85)" stroke="rgba(232,196,104,0.7)" stroke-width="0.6" />
        </symbol>

        <!-- 大陆整体外轮廓（包络 13 州的一条平滑曲线，模拟中华大陆海岸线） -->
        <path id="continent-shape" :d="CONTINENT_D" />

        <!-- 用大陆轮廓裁剪一切陆地图层 -->
        <clipPath id="land-clip">
          <use href="#continent-shape" />
        </clipPath>
      </defs>

      <!-- 海洋底 -->
      <rect x="0" y="0" width="1000" height="700" fill="url(#pat-sea)" />

      <!-- 大陆阴影投射在海上（让陆地"浮"起来） -->
      <use href="#continent-shape" fill="rgba(0,0,0,0.45)" transform="translate(6,8)" />

      <!-- 大陆统一底色（纹理） -->
      <use href="#continent-shape" fill="url(#pat-land)" />

      <!-- 大陆带土黄底色（在 PNG 上面叠一层让色更暖） -->
      <use href="#continent-shape" fill="rgba(196,150,80,0.35)" />

      <!-- 5 个地理带色相罩 + 13 州 polygon（无缝接合在共享边上） -->
      <g clip-path="url(#land-clip)">
        <!-- 5 个地理带的大块色相罩，按州的所属 zone 聚合 -->
        <path v-for="r in regions" :key="`tint-${r.id}`"
          :d="r.path"
          :fill="`url(#tint-${r.zone})`"
          pointer-events="none" />
      </g>

      <!-- 13 州交互层 -->
      <g class="regions">
        <path
          v-for="r in regions"
          :key="r.id"
          :class="['region', `pat-${r.zone}`, { owned: isOwned(r.id), selected: selectedId === r.id, locked: isLocked(r.id) }]"
          :d="r.path"
          fill="transparent"
          @click="onPick(r)"
          @mouseenter="hoverId = r.id"
          @mouseleave="hoverId = null"
        />
        <!-- 州界（细金线，统一柔和） -->
        <path
          v-for="r in regions"
          :key="`b-${r.id}`"
          :d="r.path"
          fill="none"
          stroke="rgba(232,196,104,0.32)"
          stroke-width="0.9"
          pointer-events="none"
          stroke-linejoin="round"
        />
        <!-- 占领描边 -->
        <path
          v-for="r in ownedRegions"
          :key="`own-${r.id}`"
          :d="r.path"
          class="own-overlay"
          fill="none"
          stroke="#d4af37"
          stroke-width="2.5"
          filter="url(#own-glow)"
          pointer-events="none"
        />
        <!-- 选中描边 -->
        <path
          v-if="selectedRegion"
          :d="selectedRegion.path"
          class="sel-overlay"
          fill="none"
          stroke="#ffd86b"
          stroke-width="2.5"
          stroke-dasharray="8 5"
          pointer-events="none"
        />
        <!-- 海岸线（大陆外轮廓双层 stroke） -->
        <use href="#continent-shape" fill="none"
          stroke="rgba(232,196,104,0.55)" stroke-width="2.4" filter="url(#coast-glow)" pointer-events="none" />
        <use href="#continent-shape" fill="none"
          stroke="rgba(20,10,4,0.85)" stroke-width="1.1" pointer-events="none" />
      </g>

      <!-- 河流：黄河 / 长江 / 汉水 -->
      <g clip-path="url(#land-clip)">
        <path
          d="M 90 250 Q 220 200 340 240 Q 480 280 600 220 Q 740 170 920 220"
          fill="none" stroke="url(#huanghe)" stroke-width="6" stroke-linecap="round" opacity="0.9"
        />
        <path
          d="M 110 470 Q 260 440 420 480 Q 580 520 740 470 Q 850 450 940 470"
          fill="none" stroke="url(#river)" stroke-width="7" stroke-linecap="round" opacity="0.9"
        />
        <path
          d="M 400 470 Q 370 400 400 340"
          fill="none" stroke="url(#river)" stroke-width="3" stroke-linecap="round" opacity="0.7"
        />
      </g>

      <!-- 山脉 -->
      <g class="mountains" opacity="0.85" clip-path="url(#land-clip)">
        <use href="#mtn" x="260" y="160" width="80" height="22" />
        <use href="#mtn" x="340" y="170" width="80" height="22" />
        <use href="#mtn" x="100" y="320" width="100" height="26" />
        <use href="#mtn" x="200" y="340" width="100" height="24" />
        <use href="#mtn" x="700" y="540" width="90" height="22" />
        <use href="#mtn" x="780" y="555" width="90" height="22" />
      </g>

      <!-- 小郡县（可点击征伐，纳入游戏） -->
      <g class="minor-cities" clip-path="url(#land-clip)">
        <g v-for="c in MINOR_CITIES" :key="`mc-${c.id}`"
           class="minor-city t-node"
           :class="{ owned: isOwned(c.id), selected: selectedId === c.id, hover: hoverId === c.id, locked: isLocked(c.id) }"
           :transform="`translate(${c.x}, ${c.y})`"
           @click="onMinorPick(c)"
           @mouseenter="hoverId = c.id"
           @mouseleave="hoverId = null">

          <g v-if="isOwned(c.id)" class="flag-grp">
            <line x1="0" y1="-2" x2="0" y2="-20" stroke="#d4af37" stroke-width="1.1" />
            <path d="M 0 -20 L 10 -17 L 7 -13 L 10 -9 L 0 -12 Z"
                  fill="#a8231a" stroke="#4a0808" stroke-width="0.5"
                  class="flag-wave" />
          </g>

          <rect x="-3.2" y="-3.2" width="6.4" height="6.4"
                class="mc-core"
                :fill="isOwned(c.id) ? '#a8231a' : 'rgba(20,10,4,0.88)'"
                stroke="rgba(232,196,104,0.8)" stroke-width="0.8" />
          <rect x="-1.3" y="-1.3" width="2.6" height="2.6" fill="rgba(232,196,104,0.9)" />

          <text :x="c.lx || 6" :y="c.ly || 2.5"
                :text-anchor="c.ta || 'start'" class="mc-text">{{ c.n }}</text>

          <circle v-if="selectedId === c.id" r="11" class="sel-ring"
                  fill="none" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="3 3" />
        </g>
      </g>

      <!-- 烽烟 -->
      <g class="smokes">
        <g v-for="t in smokeList" :key="`s-${t.id}`"
           :transform="`translate(${pos(t).x}, ${pos(t).y - 4})`">
          <path
            d="M 0 0 Q -3 -10 0 -22 Q 3 -34 -1 -46 Q -4 -58 1 -70"
            fill="none" stroke="rgba(180,180,180,0.55)" stroke-width="3"
            stroke-linecap="round" filter="url(#smoke)"
            class="smoke-path"
          />
          <path
            d="M 0 0 Q 2 -12 -1 -24 Q -5 -36 0 -48 Q 5 -60 -2 -72"
            fill="none" stroke="rgba(140,140,140,0.4)" stroke-width="2"
            stroke-linecap="round" filter="url(#smoke)"
            class="smoke-path delay"
          />
        </g>
      </g>

      <!-- 13 州主城标签 + 旗帜 -->
      <g class="t-nodes">
        <g v-for="t in majorTerritories" :key="t.id"
           class="t-node"
           :class="{ owned: isOwned(t.id), selected: selectedId === t.id, hover: hoverId === t.id, locked: isLocked(t.id) }"
           :transform="`translate(${pos(t).x}, ${pos(t).y})`"
           @click="$emit('pick', t)"
           @mouseenter="hoverId = t.id"
           @mouseleave="hoverId = null">

          <g v-if="isOwned(t.id)" class="flag-grp">
            <line x1="0" y1="-2" x2="0" y2="-34" stroke="#d4af37" stroke-width="1.6" />
            <path d="M 0 -34 L 16 -30 L 12 -24 L 16 -18 L 0 -22 Z"
                  fill="#a8231a" stroke="#4a0808" stroke-width="0.8"
                  class="flag-wave" />
          </g>

          <circle r="14" class="city-halo" :fill="tierColor(t.tier)" opacity="0.18" />
          <circle r="9" class="city-core"
                  :fill="isOwned(t.id) ? '#a8231a' : '#1a0e07'"
                  :stroke="tierColor(t.tier)" stroke-width="2" />
          <circle r="3.5" :fill="tierColor(t.tier)" />

          <text class="t-text" :y="28" text-anchor="middle">{{ shortName(t.name) }}</text>

          <circle v-if="selectedId === t.id" r="20" class="sel-ring"
                  fill="none" stroke="#d4af37" stroke-width="1.8" stroke-dasharray="5 4" />
        </g>
      </g>

      <!-- 暗角 -->
      <rect x="0" y="0" width="1000" height="700" fill="url(#parchment-vignette)" pointer-events="none" />

      <!-- 四角装饰 -->
      <g class="corner-deco" opacity="0.55" pointer-events="none">
        <path d="M 14 14 L 60 14 M 14 14 L 14 60" stroke="#d4af37" stroke-width="1.4" fill="none" />
        <path d="M 986 14 L 940 14 M 986 14 L 986 60" stroke="#d4af37" stroke-width="1.4" fill="none" />
        <path d="M 14 686 L 60 686 M 14 686 L 14 640" stroke="#d4af37" stroke-width="1.4" fill="none" />
        <path d="M 986 686 L 940 686 M 986 686 L 986 640" stroke="#d4af37" stroke-width="1.4" fill="none" />
      </g>

      <!-- 罗盘 -->
      <g class="compass" transform="translate(60, 620)" opacity="0.78">
        <circle r="28" fill="rgba(20,10,4,0.7)" stroke="#d4af37" stroke-width="1.2" />
        <circle r="22" fill="none" stroke="rgba(232,196,104,0.4)" stroke-width="0.6" />
        <text y="-14" text-anchor="middle" class="cmp-c">北</text>
        <text y="22" text-anchor="middle" class="cmp-c">南</text>
        <text x="-19" y="5" text-anchor="middle" class="cmp-c">西</text>
        <text x="19" y="5" text-anchor="middle" class="cmp-c">东</text>
        <path d="M 0 -10 L 5 0 L 0 10 L -5 0 Z" fill="#a8231a" stroke="#d4af37" stroke-width="0.6" />
      </g>

      <!-- 图例 -->
      <g class="legend" transform="translate(840, 30)">
        <rect x="-6" y="-14" width="146" height="92" fill="rgba(20,10,4,0.75)" stroke="rgba(232,196,104,0.55)" stroke-width="1" />
        <text x="64" y="0" text-anchor="middle" class="lg-title">图 例</text>
        <g v-for="(t, i) in tierLegend" :key="t.tier" :transform="`translate(8, ${14 + i * 14})`">
          <circle r="4" :fill="t.color" />
          <text x="10" y="3" class="lg-text">{{ t.label }}</text>
          <text x="50" y="3" class="lg-text">{{ t.tip }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { TERRITORIES, TERRITORY_MAP, MAJOR_TERRITORIES, TIER_META } from '../data/territories.js'

const props = defineProps({
  ownedIds: { type: Array, default: () => [] },
  cooldown: { type: Object, default: () => ({}) },
  selectedId: { type: String, default: null },
  compact: { type: Boolean, default: false }
})

const emit = defineEmits(['pick'])
const hoverId = ref(null)

const territories = computed(() => TERRITORIES)
const majorTerritories = computed(() => MAJOR_TERRITORIES)

const IMG_BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/') + 'img/maps/'
function img(name) { return `${IMG_BASE}${name}.png` }

/**
 * 大陆整体外轮廓：一条平滑曲线包络所有 13 州，模拟中华大陆海岸线。
 * 顺时针：从西北贺兰山起 → 北疆草原 → 辽东半岛 → 山东半岛 → 江淮 → 闽越 → 交趾 → 巴蜀 → 西凉 → 回到起点。
 */
const CONTINENT_D =
  'M 60 200 ' +
  'Q 90 130 180 80 ' +          // 西北 → 河套
  'Q 280 50 410 55 ' +          // 并州北
  'Q 540 50 620 75 ' +          // 幽州北
  'Q 700 95 720 160 ' +         // 辽东
  'Q 740 200 760 230 ' +        // 渤海湾
  'Q 760 260 720 285 ' +
  'Q 770 320 770 365 ' +        // 山东半岛突出
  'Q 770 410 720 430 ' +
  'Q 760 460 820 490 ' +        // 江苏沿海
  'Q 870 530 820 590 ' +        // 浙闽
  'Q 790 640 700 660 ' +        // 闽南
  'Q 620 680 500 678 ' +        // 南陲北缘
  'Q 380 680 280 670 ' +        // 交州
  'Q 200 660 150 600 ' +        // 南岭
  'Q 80 550 60 470 ' +          // 益州西
  'Q 40 380 50 290 ' +          // 凉州西
  'Q 50 230 60 200 Z'

/**
 * 13 州 polygon：相邻州**共享同一条边**，确保接缝无缝、整体看是一张完整大陆切片。
 * 整体落在 CONTINENT_D 的包络范围内。
 */
const regions = [
  // ---- 北疆 ----
  { id: 'bingzhou', zone: 'beijiang',
    path: 'M 90 200 Q 130 110 220 80 Q 320 65 410 75 L 420 180 L 350 220 L 230 215 L 130 230 Z' },
  { id: 'youzhou', zone: 'beijiang',
    path: 'M 410 75 Q 520 60 620 80 Q 700 100 720 160 Q 740 200 720 230 L 600 240 L 500 230 L 420 180 Z' },

  // ---- 西域（凉州） ----
  { id: 'liangzhou', zone: 'xiyu',
    path: 'M 60 200 Q 50 240 50 290 Q 50 360 70 420 L 160 410 L 200 320 L 180 230 L 130 230 L 90 200 Z' },

  // ---- 中原（司隶/豫/兖/青/冀/徐） ----
  { id: 'jizhou', zone: 'zhongyuan',
    path: 'M 230 215 L 350 220 L 420 180 L 500 230 L 480 320 L 380 340 L 280 320 L 200 320 L 180 230 Z' },
  { id: 'luoyang', zone: 'zhongyuan',
    path: 'M 280 320 L 380 340 L 380 400 L 300 410 L 240 380 Z' },
  { id: 'yuzhou', zone: 'zhongyuan',
    path: 'M 240 380 L 300 410 L 380 400 L 400 470 L 320 490 L 230 460 Z' },
  { id: 'yanzhou', zone: 'zhongyuan',
    path: 'M 380 340 L 480 320 L 540 360 L 530 430 L 460 430 L 400 470 L 380 400 Z' },
  { id: 'qingzhou', zone: 'zhongyuan',
    path: 'M 500 230 L 600 240 L 720 230 Q 720 285 720 340 L 640 370 L 540 360 L 480 320 Z' },
  { id: 'xuzhou', zone: 'zhongyuan',
    path: 'M 540 360 L 640 370 L 720 340 Q 770 365 720 430 L 620 460 L 530 430 Z' },

  // ---- 江南（荆/扬/益） ----
  { id: 'yizhou', zone: 'jiangnan',
    path: 'M 70 420 L 160 410 L 200 320 L 230 460 L 200 540 L 80 550 Q 50 470 70 420 Z' },
  { id: 'jingzhou', zone: 'jiangnan',
    path: 'M 200 540 L 230 460 L 320 490 L 400 470 L 410 560 L 340 610 L 230 610 Q 200 600 200 540 Z' },
  { id: 'yangzhou', zone: 'jiangnan',
    path: 'M 400 470 L 460 430 L 530 430 L 620 460 L 720 430 Q 760 460 820 490 Q 800 580 740 620 L 600 620 L 480 600 L 410 560 Z' },

  // ---- 南陲（交州） ----
  { id: 'jiaozhou', zone: 'nanchu',
    path: 'M 230 610 L 340 610 L 410 560 L 480 600 L 600 620 L 740 620 Q 790 640 700 660 Q 500 680 280 670 Q 200 660 230 610 Z' }
]
const regionMap = Object.fromEntries(regions.map((r) => [r.id, r]))

/** 每个州的"中心坐标"，由 polygon 平均估算 */
const CENTERS = {
  bingzhou:  { x: 270, y: 150 },
  youzhou:   { x: 550, y: 150 },
  liangzhou: { x: 125, y: 310 },
  jizhou:    { x: 340, y: 270 },
  luoyang:   { x: 320, y: 370 },
  yuzhou:    { x: 320, y: 430 },
  yanzhou:   { x: 460, y: 390 },
  qingzhou:  { x: 610, y: 300 },
  xuzhou:    { x: 630, y: 400 },
  yizhou:    { x: 150, y: 470 },
  jingzhou:  { x: 310, y: 540 },
  yangzhou:  { x: 590, y: 525 },
  jiaozhou:  { x: 470, y: 640 }
}
function pos(t) { return CENTERS[t.id] || { x: 500, y: 350 } }

/**
 * 历史小郡县（**可点击征伐，纳入游戏逻辑**）：
 * id 与 territories.js 一一对应；lx/ly 为标签相对小城点的偏移；ta=text-anchor。
 */
const MINOR_CITIES = [
  // 北疆 - 并州
  { id: 'yanmen',     n: '雁门',    x: 240, y: 110, ta: 'middle', lx: 0, ly: -6 },
  { id: 'yunzhong',   n: '云中',    x: 195, y: 135, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'taiyuan',    n: '太原',    x: 305, y: 175, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'shangdang',  n: '上党',    x: 360, y: 200, ta: 'start',  lx: 6,  ly: 2.5 },

  // 北疆 - 幽州
  { id: 'yuyang',     n: '渔阳',    x: 490, y: 105, ta: 'middle', lx: 0, ly: -6 },
  { id: 'youbeiping', n: '右北平',  x: 555, y: 125, ta: 'start',  lx: 6, ly: 2.5 },
  { id: 'liaodong',   n: '辽东',    x: 660, y: 125, ta: 'start',  lx: 6, ly: 2.5 },
  { id: 'jixian',     n: '蓟县',    x: 460, y: 175, ta: 'end',    lx: -5, ly: 2.5 },

  // 西凉
  { id: 'wuwei',      n: '武威',    x: 100, y: 245, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'zhangye',    n: '张掖',    x: 80,  y: 290, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'dunhuang',   n: '敦煌',    x: 65,  y: 350, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'jincheng',   n: '金城',    x: 160, y: 360, ta: 'start',  lx: 6,  ly: 2.5 },

  // 冀州
  { id: 'yecheng',    n: '邺城',    x: 380, y: 240, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'qinghe',     n: '清河',    x: 440, y: 270, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'changshan',  n: '常山',    x: 260, y: 240, ta: 'end',    lx: -5, ly: 2.5 },

  // 司隶（洛阳周边）
  { id: 'changan',    n: '长安',    x: 240, y: 350, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'honglong',   n: '弘农',    x: 290, y: 388, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'henei',      n: '河内',    x: 365, y: 335, ta: 'start',  lx: 6,  ly: 2.5 },

  // 兖州
  { id: 'chenliu',    n: '陈留',    x: 425, y: 360, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'puyang',     n: '濮阳',    x: 480, y: 355, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'taishan',    n: '泰山',    x: 510, y: 400, ta: 'start',  lx: 6,  ly: 2.5 },

  // 青州
  { id: 'beihai',     n: '北海',    x: 670, y: 260, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'donglai',    n: '东莱',    x: 700, y: 310, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'qiguo',      n: '齐国',    x: 580, y: 300, ta: 'end',    lx: -5, ly: 2.5 },

  // 徐州
  { id: 'pengcheng',  n: '彭城',    x: 600, y: 380, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'xiapi',      n: '下邳',    x: 660, y: 410, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'guangling',  n: '广陵',    x: 680, y: 445, ta: 'start',  lx: 6,  ly: 2.5 },

  // 豫州
  { id: 'rounan',     n: '汝南',    x: 360, y: 440, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'yingchuan',  n: '颍川',    x: 290, y: 405, ta: 'end',    lx: -5, ly: 2.5 },

  // 益州
  { id: 'hanzhong',   n: '汉中',    x: 195, y: 405, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'chengdu',    n: '成都',    x: 130, y: 475, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'bajun',      n: '巴郡',    x: 200, y: 510, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'yongchang',  n: '永昌',    x: 100, y: 530, ta: 'end',    lx: -5, ly: 2.5 },

  // 荆州
  { id: 'xiangyang',  n: '襄阳',    x: 290, y: 495, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'jiangling',  n: '江陵',    x: 340, y: 560, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'changsha',   n: '长沙',    x: 360, y: 595, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'wuling',     n: '武陵',    x: 260, y: 575, ta: 'end',    lx: -5, ly: 2.5 },

  // 扬州
  { id: 'jianye',     n: '建业',    x: 670, y: 480, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'wujun',      n: '吴郡',    x: 720, y: 510, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'huiji',      n: '会稽',    x: 730, y: 565, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'lujiang',    n: '庐江',    x: 520, y: 500, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'yuzhang',    n: '豫章',    x: 545, y: 575, ta: 'middle', lx: 0,  ly: -6 },

  // 交州
  { id: 'nanhai',     n: '南海',    x: 410, y: 660, ta: 'start',  lx: 6,  ly: 2.5 },
  { id: 'cangwu',     n: '苍梧',    x: 320, y: 645, ta: 'end',    lx: -5, ly: 2.5 },
  { id: 'rinan',      n: '日南',    x: 560, y: 660, ta: 'start',  lx: 6,  ly: 2.5 }
]

function isOwned(id) { return props.ownedIds.includes(id) }
function isLocked(id) {
  const ts = props.cooldown[id] || 0
  return ts > Date.now()
}
function tierColor(tier) { return TIER_META[tier]?.color || '#d4af37' }
function shortName(name) { return name.replace(/^.+·/, '').slice(0, 3) }
function onPick(r) {
  const t = TERRITORIES.find((x) => x.id === r.id)
  if (t) emit('pick', t)
}
function onMinorPick(c) {
  const t = TERRITORY_MAP[c.id]
  if (t) emit('pick', t)
}

const ownedRegions = computed(() => regions.filter((r) => isOwned(r.id)))
const selectedRegion = computed(() => regionMap[props.selectedId] || null)
const smokeList = computed(() =>
  majorTerritories.value.filter((t) => !isOwned(t.id) && t.tier >= 3)
)

const tierLegend = [
  { tier: 0, color: TIER_META[0].color, label: '王畿', tip: '主公根本' },
  { tier: 1, color: TIER_META[1].color, label: '小郡', tip: '易取之地' },
  { tier: 2, color: TIER_META[2].color, label: '大州', tip: '兵家必争' },
  { tier: 3, color: TIER_META[3].color, label: '边疆', tip: '难征之险' },
  { tier: 4, color: TIER_META[4].color, label: '极远', tip: '南蛮瘴气' }
]
</script>

<style scoped>
.china-map {
  width: 100%;
  aspect-ratio: 10 / 7;
  max-height: 82vh;
  position: relative;
  border: 1px solid rgba(232, 196, 104, 0.55);
  background:
    radial-gradient(ellipse at center, rgba(40, 22, 10, 0.4), rgba(10, 5, 3, 0.85)),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0 0.15  0 0 0 0.18 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: cover, 160px 160px;
  box-shadow:
    inset 0 0 22px rgba(0, 0, 0, 0.65),
    0 4px 14px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}
.china-map.compact { max-height: 68vh; }
.map-svg { width: 100%; height: 100%; display: block; }

/* 州交互层 */
.region {
  cursor: pointer;
  transition: filter 0.25s ease;
}
.region:hover {
  filter: brightness(1.25) drop-shadow(0 0 6px rgba(232, 196, 104, 0.55));
}
.region.locked {
  opacity: 0.55;
  filter: grayscale(0.4);
}
.own-overlay { pointer-events: none; opacity: 0.95; }
.sel-overlay {
  pointer-events: none;
  animation: dash-spin 12s linear infinite;
}
@keyframes dash-spin {
  to { stroke-dashoffset: -260; }
}

/* 城池节点 */
.t-node { cursor: pointer; }
.city-halo {
  transform-box: fill-box;
  transform-origin: center;
  animation: halo-pulse 2.8s ease-in-out infinite;
}
@keyframes halo-pulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(1.25); }
}
.t-node.hover .city-core {
  filter: drop-shadow(0 0 8px #ffd86b) brightness(1.2);
}
.t-node.owned .city-core {
  filter: drop-shadow(0 0 5px rgba(168, 35, 26, 0.9));
}
.t-node.selected .city-core {
  filter: drop-shadow(0 0 8px #d4af37);
}
.t-text {
  font-family: var(--font-title);
  font-size: 14px;
  fill: #ffe89a;
  font-weight: 700;
  paint-order: stroke;
  stroke: #0a0503;
  stroke-width: 3;
  stroke-linejoin: round;
  letter-spacing: 1.5px;
  pointer-events: none;
}
.t-node.owned .t-text { fill: #fff5cf; stroke-width: 3.5; }

.sel-ring {
  transform-box: fill-box;
  transform-origin: center;
  animation: ring-spin 6s linear infinite;
}
@keyframes ring-spin { to { transform: rotate(360deg); } }

.flag-wave {
  transform-box: fill-box;
  transform-origin: 0 100%;
  animation: flag-flutter 2.5s ease-in-out infinite;
}
@keyframes flag-flutter {
  0%, 100% { transform: skewX(0deg); }
  50%      { transform: skewX(-5deg); }
}

.smoke-path {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: smoke-rise 4s ease-in-out infinite;
}
.smoke-path.delay { animation-delay: 1.2s; animation-duration: 5s; opacity: 0.7; }
@keyframes smoke-rise {
  0%   { opacity: 0; transform: translateY(0) scale(0.6); }
  30%  { opacity: 0.7; }
  100% { opacity: 0; transform: translateY(-12px) scale(1.15); }
}

.lg-title {
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 4px;
  fill: var(--c-gold);
}
.lg-text {
  font-family: var(--font-title);
  font-size: 12px;
  fill: var(--c-gold-light);
  letter-spacing: 1px;
}
.cmp-c {
  font-family: var(--font-title);
  font-size: 12px;
  fill: var(--c-gold);
  letter-spacing: 1px;
}

/* 小郡县（可点击） */
.minor-city { opacity: 0.85; cursor: pointer; transition: opacity 0.2s ease; }
.minor-city.owned { opacity: 1; }
.minor-city.hover { opacity: 1; }
.minor-city.hover .mc-core {
  filter: drop-shadow(0 0 5px #ffd86b) brightness(1.25);
}
.minor-city.owned .mc-core {
  filter: drop-shadow(0 0 3px rgba(168, 35, 26, 0.85));
}
.minor-city.locked { opacity: 0.45; filter: grayscale(0.5); }
.mc-text {
  font-family: var(--font-title);
  font-size: 12px;
  fill: rgba(232, 196, 104, 0.78);
  letter-spacing: 0.5px;
  paint-order: stroke;
  stroke: rgba(20, 10, 4, 0.85);
  stroke-width: 2;
  stroke-linejoin: round;
  font-weight: 400;
}
</style>
