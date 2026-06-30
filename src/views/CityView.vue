<template>
  <section class="view city-view">
    <!-- 顶部治理迷你条（治安/科技/文化/商业）：沿用原设计 -->
    <div class="gov-section">
      <div class="gov-head">
        <AppIcon kind="misc" id="scroll" :size="12" tone="gold" />
        <span class="gh-title">民生治理</span>
        <span class="gh-tip">数值 0-100，影响产出与事件</span>
      </div>
      <div class="gov-strip">
        <div
          v-for="g in game.governanceList"
          :key="g.key"
          class="gov-pill"
          :style="{ borderColor: g.color }"
          :title="govTipOf(g.key)"
        >
          <div class="gp-top">
            <AppIcon class="gp-icon" kind="gov" :id="g.iconId || g.key" :size="13" :color="g.color" />
            <span class="gp-label">{{ g.label }}</span>
            <span class="gp-num" :style="{ color: g.color }">{{ g.value }}<span class="gp-num-max">/100</span></span>
          </div>
          <span class="gp-bar">
            <span class="gp-fill" :style="{ width: g.value + '%', background: g.color }"></span>
          </span>
        </div>
      </div>
    </div>

    <!-- 建造队列摘要条 -->
    <div class="queue-strip" v-if="game.buildQueue.length">
      <span class="qs-label">
        <AppIcon kind="misc" id="build" :size="13" />
        营造
      </span>
      <div v-for="q in game.buildQueue" :key="q.key" class="qs-item" @click="open(q.key)">
        <AppIcon class="qs-icon" kind="building" :id="q.key" :size="14" />
        <span class="qs-bar">
          <span class="qs-fill" :style="{ width: pctOf(q) + '%' }"></span>
        </span>
        <span class="qs-time">{{ remainOf(q) }}s</span>
      </div>
      <span class="qs-cap">{{ game.buildQueue.length }}/{{ game.parallelBuildCap }}</span>
    </div>

    <!-- 城池俯瞰图 + SVG 热区 -->
    <div class="map-stage" ref="stageEl">
      <svg
        class="city-map"
        viewBox="0 0 800 520"
        preserveAspectRatio="xMidYMid meet"
        @mousemove="onSvgMove"
      >
        <!-- 古地图羊皮纸底 + 建筑通用资源 -->
        <defs>
          <radialGradient id="parchment" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#f3e1ad" />
            <stop offset="65%" stop-color="#cfa86a" />
            <stop offset="100%" stop-color="#7a4f22" />
          </radialGradient>
          <pattern id="wave" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 7 Q3.5 3 7 7 T14 7" stroke="rgba(80,40,15,.25)" fill="none" stroke-width=".7" />
          </pattern>
          <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
            <feDisplacementMap in="SourceGraphic" scale="1.8" />
          </filter>

          <!-- 朱红屋顶（高光向上、暗赭向下） -->
          <linearGradient id="roofRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d44a3a" />
            <stop offset="55%" stop-color="#a8231a" />
            <stop offset="100%" stop-color="#6e1410" />
          </linearGradient>
          <!-- 翠绿屋顶（农院/驿站可选） -->
          <linearGradient id="roofGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6e8c3c" />
            <stop offset="100%" stop-color="#3d5510" />
          </linearGradient>
          <!-- 鎏金檐 / 匾额 -->
          <linearGradient id="goldPlate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fff5cf" />
            <stop offset="45%" stop-color="#e8c468" />
            <stop offset="100%" stop-color="#a87a28" />
          </linearGradient>
          <!-- 木墙身（朱柱白壁） -->
          <linearGradient id="wallWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f0dca6" />
            <stop offset="100%" stop-color="#c9a96a" />
          </linearGradient>
          <!-- 暗木 / 营帐布 -->
          <linearGradient id="darkWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7a4a22" />
            <stop offset="100%" stop-color="#3d220f" />
          </linearGradient>
          <!-- 田垄绿（农田专用） -->
          <linearGradient id="farmField" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a8c768" />
            <stop offset="100%" stop-color="#5a7a2a" />
          </linearGradient>
          <!-- 炉火光晕 -->
          <radialGradient id="forgeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffe08a" stop-opacity=".95" />
            <stop offset="60%" stop-color="#ff7a28" stop-opacity=".55" />
            <stop offset="100%" stop-color="#a8231a" stop-opacity="0" />
          </radialGradient>
          <!-- 灯笼光晕 -->
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffd266" stop-opacity=".9" />
            <stop offset="100%" stop-color="#a8231a" stop-opacity="0" />
          </radialGradient>
          <!-- 瓦片纹（屋顶专用） -->
          <pattern id="tilePat" width="8" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 6 Q4 0 8 6" stroke="rgba(20,8,4,.45)" fill="none" stroke-width=".6" />
          </pattern>

          <!-- 通用：金色描边发光（hover/选中时启用） -->
          <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feFlood flood-color="#ffe08a" flood-opacity=".85" />
            <feComposite in2="b" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <!-- 通用：建筑底盘投影 -->
          <filter id="dropSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" />
            <feOffset dx="0" dy="2" result="off" />
            <feComponentTransfer><feFuncA type="linear" slope=".55" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <!-- 复用符号：歇山顶（朱红瓦 + 金檐 + 鸱吻） -->
          <g id="roofGable">
            <!-- 屋脊连接线 -->
            <polygon points="-44,-4 -36,-22 36,-22 44,-4" fill="url(#roofRed)" stroke="#3d150d" stroke-width="1.4" stroke-linejoin="round" />
            <polygon points="-44,-4 -36,-22 36,-22 44,-4" fill="url(#tilePat)" />
            <!-- 屋脊线 -->
            <line x1="-36" y1="-22" x2="36" y2="-22" stroke="#3d150d" stroke-width="1.6" />
            <!-- 鸱吻（左右脊兽） -->
            <path d="M-38 -22 q-3 -4 -5 -2 q1 3 5 2 z" fill="#e8c468" stroke="#3d150d" stroke-width=".6" />
            <path d="M38 -22 q3 -4 5 -2 q-1 3 -5 2 z" fill="#e8c468" stroke="#3d150d" stroke-width=".6" />
            <!-- 飞檐翘角 -->
            <path d="M-44 -4 q-4 0 -6 -2" stroke="#3d150d" stroke-width="1.2" fill="none" />
            <path d="M44 -4 q4 0 6 -2" stroke="#3d150d" stroke-width="1.2" fill="none" />
            <!-- 金檐 -->
            <rect x="-44" y="-5" width="88" height="3" fill="url(#goldPlate)" stroke="#3d150d" stroke-width=".5" />
          </g>
          <!-- 复用符号：单层瓦顶（小屋通用） -->
          <g id="roofSmall">
            <polygon points="-28,-2 -22,-16 22,-16 28,-2" fill="url(#roofRed)" stroke="#3d150d" stroke-width="1.2" stroke-linejoin="round" />
            <polygon points="-28,-2 -22,-16 22,-16 28,-2" fill="url(#tilePat)" />
            <line x1="-22" y1="-16" x2="22" y2="-16" stroke="#3d150d" stroke-width="1.2" />
            <rect x="-28" y="-3" width="56" height="2.5" fill="url(#goldPlate)" stroke="#3d150d" stroke-width=".4" />
          </g>
          <!-- 复用符号：朱柱白壁墙身（带门） -->
          <g id="wallBase">
            <rect x="-30" y="-2" width="60" height="22" fill="url(#wallWood)" stroke="#3d220f" stroke-width="1.3" />
            <!-- 朱柱 -->
            <rect x="-30" y="-2" width="3.5" height="22" fill="#a8231a" stroke="#3d150d" stroke-width=".4" />
            <rect x="26.5" y="-2" width="3.5" height="22" fill="#a8231a" stroke="#3d150d" stroke-width=".4" />
            <!-- 门洞 -->
            <rect x="-7" y="6" width="14" height="14" fill="#2a1810" stroke="#3d150d" stroke-width=".8" />
            <line x1="0" y1="6" x2="0" y2="20" stroke="#e8c468" stroke-width=".6" />
            <!-- 横梁 -->
            <line x1="-30" y1="4" x2="30" y2="4" stroke="#3d150d" stroke-width=".8" />
          </g>
          <!-- 复用符号：金色匾额（写一个字） -->
          <g id="plaque">
            <rect x="-12" y="-6" width="24" height="12" rx="1" fill="url(#goldPlate)" stroke="#3d150d" stroke-width=".8" />
            <rect x="-12" y="-6" width="24" height="12" rx="1" fill="none" stroke="#fff5cf" stroke-width=".4" />
          </g>
        </defs>

        <!-- 底色 + 水纹 -->
        <rect x="0" y="0" width="800" height="520" fill="url(#parchment)" />
        <rect x="0" y="0" width="800" height="520" fill="url(#wave)" opacity=".5" />

        <!-- 城墙轮廓（八边形） -->
        <polygon
          class="city-wall"
          points="120,80 680,80 760,180 760,400 680,460 120,460 40,400 40,180"
          fill="rgba(120,75,30,.18)"
          stroke="#5b3416"
          stroke-width="3.5"
          stroke-linejoin="round"
        />
        <!-- 城门四面：与道路交汇点对齐 -->
        <g class="city-gate" stroke="#3d220f" stroke-width="2.5">
          <!-- 北门（顶）×2 -->
          <line x1="300" y1="78" x2="300" y2="110" />
          <line x1="500" y1="78" x2="500" y2="110" />
          <!-- 南门（底）×2 -->
          <line x1="300" y1="450" x2="300" y2="462" />
          <line x1="500" y1="450" x2="500" y2="462" />
          <!-- 西门（左）×2 -->
          <line x1="38" y1="215" x2="80" y2="215" />
          <line x1="38" y1="340" x2="80" y2="340" />
          <!-- 东门（右）×2 -->
          <line x1="720" y1="215" x2="762" y2="215" />
          <line x1="720" y1="340" x2="762" y2="340" />
        </g>

        <!-- 道路网：井字格穿过建筑列/行之间，不压建筑 -->
        <g class="road" stroke="#7c542a" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round">
          <!-- 两条纵向主道：在第1-2列、第2-3列之间 -->
          <line x1="300" y1="95" x2="300" y2="450" />
          <line x1="500" y1="95" x2="500" y2="450" />
          <!-- 两条横向主道：在第1-2行、第2-3行之间 -->
          <line x1="60" y1="215" x2="740" y2="215" />
          <line x1="60" y1="340" x2="740" y2="340" />
        </g>
        <!-- 道路鹅卵石阴影线（更细、错位） -->
        <g class="road-shadow" stroke="#3d220f" stroke-width="1" fill="none" opacity=".25" stroke-dasharray="2 5" stroke-linecap="round">
          <line x1="300" y1="95" x2="300" y2="450" />
          <line x1="500" y1="95" x2="500" y2="450" />
          <line x1="60" y1="215" x2="740" y2="215" />
          <line x1="60" y1="340" x2="740" y2="340" />
        </g>

        <!-- 9 个建筑热区 -->
        <g
          v-for="b in buildingHotspots"
          :key="b.key"
          class="hotspot"
          :class="{
            locked: !game.city[b.key],
            building: !!game.buildQueue.find((q) => q.key === b.key),
            flashing: flashKey === b.key,
            hover: hoverKey === b.key
          }"
          :transform="`translate(${b.x}, ${b.y})`"
          @click="open(b.key)"
          @mouseenter="hoverKey = b.key"
          @mouseleave="hoverKey = null"
        >
          <!-- 屋影：根据 type 切换形状（精修汉风建筑示意） -->
          <g v-if="b.type === 'palace'" class="b-body">
            <!-- 主公府：双层歇山顶 + 朱柱白壁 + 金匾 + 石阶 -->
            <!-- 石阶 -->
            <polygon points="-44,38 44,38 38,46 -38,46" fill="#9c8458" stroke="#3d220f" stroke-width="1" />
            <line x1="-38" y1="46" x2="38" y2="46" stroke="#3d220f" stroke-width=".6" />
            <line x1="-22" y1="42" x2="22" y2="42" stroke="#3d220f" stroke-width=".4" opacity=".6" />
            <!-- 二楼墙身 -->
            <use href="#wallBase" transform="translate(0, 18) scale(.95, 1)" />
            <!-- 二楼歇山顶（朱红） -->
            <use href="#roofGable" transform="translate(0, 18) scale(1.05, 1)" />
            <!-- 一楼小檐口 -->
            <rect x="-46" y="-4" width="92" height="3" fill="url(#goldPlate)" stroke="#3d150d" stroke-width=".5" />
            <!-- 一楼墙身 -->
            <use href="#wallBase" transform="translate(0, -8) scale(.72, .55)" />
            <!-- 顶层歇山顶 -->
            <use href="#roofGable" transform="translate(0, -16) scale(.78, .85)" />
            <!-- 金顶旗杆 -->
            <line x1="0" y1="-36" x2="0" y2="-52" stroke="#3d220f" stroke-width="1.6" />
            <polygon points="0,-52 12,-48 0,-44" fill="#a8231a" stroke="#3d150d" stroke-width=".8" />
            <circle cx="0" cy="-52" r="1.6" fill="url(#goldPlate)" stroke="#3d150d" stroke-width=".4" />
            <!-- 金匾"汉" -->
            <use href="#plaque" transform="translate(0, 8) scale(1.1, 1)" />
            <text x="0" y="12" text-anchor="middle" font-size="9" font-weight="700" fill="#3d150d" font-family="serif">汉</text>
          </g>

          <g v-else-if="b.type === 'farm'" class="b-body">
            <!-- 农田：田字 + 稻穗 + 田埂草棚 -->
            <!-- 田垄底盘（带斜俯视感） -->
            <polygon points="-40,-16 40,-16 44,22 -44,22" fill="url(#farmField)" stroke="#3d5510" stroke-width="1.5" stroke-linejoin="round" />
            <!-- 田字格 -->
            <line x1="0" y1="-16" x2="0" y2="22" stroke="#3d5510" stroke-width="1.2" />
            <line x1="-42" y1="3" x2="42" y2="3" stroke="#3d5510" stroke-width="1.2" />
            <!-- 每格内的稻穗（向上的细线） -->
            <g stroke="#d4a437" stroke-width="1.1" stroke-linecap="round" fill="none">
              <path d="M-30 -10 q-1.5 -3 0 -6 m0 6 q1.5 -3 0 -6" />
              <path d="M-18 -8 q-1.5 -3 0 -6 m0 6 q1.5 -3 0 -6" />
              <path d="M18 -8 q-1.5 -3 0 -6 m0 6 q1.5 -3 0 -6" />
              <path d="M30 -10 q-1.5 -3 0 -6 m0 6 q1.5 -3 0 -6" />
              <path d="M-30 14 q-1.5 -3 0 -6 m0 6 q1.5 -3 0 -6" />
              <path d="M-18 16 q-1.5 -3 0 -6 m0 6 q1.5 -3 0 -6" />
              <path d="M18 16 q-1.5 -3 0 -6 m0 6 q1.5 -3 0 -6" />
              <path d="M30 14 q-1.5 -3 0 -6 m0 6 q1.5 -3 0 -6" />
            </g>
            <!-- 田边草棚 -->
            <polygon points="-46,-16 -34,-24 -22,-16" fill="#7a4a22" stroke="#3d220f" stroke-width="1" />
            <rect x="-44" y="-16" width="20" height="8" fill="#caa468" stroke="#3d220f" stroke-width=".8" />
            <!-- 稻草人 -->
            <line x1="32" y1="-16" x2="32" y2="-32" stroke="#3d220f" stroke-width="1.2" />
            <line x1="26" y1="-26" x2="38" y2="-26" stroke="#3d220f" stroke-width="1" />
            <circle cx="32" cy="-34" r="2.4" fill="#caa468" stroke="#3d220f" stroke-width=".6" />
          </g>

          <g v-else-if="b.type === 'market'" class="b-body">
            <!-- 市集：店铺 + 红伞 + 灯笼 + 摊位 -->
            <!-- 摊位底座 -->
            <rect x="-38" y="14" width="76" height="6" fill="url(#darkWood)" stroke="#3d220f" stroke-width="1" />
            <!-- 主店铺 -->
            <use href="#wallBase" transform="translate(0, -2) scale(.95, .85)" />
            <use href="#roofSmall" transform="translate(0, -2) scale(1.05, 1)" />
            <!-- 招幌（左侧布幡） -->
            <line x1="-32" y1="-14" x2="-32" y2="14" stroke="#3d220f" stroke-width="1.4" />
            <rect x="-38" y="-10" width="12" height="20" fill="#c7382e" stroke="#3d150d" stroke-width=".8" />
            <text x="-32" y="-2" text-anchor="middle" font-size="6" fill="#fff5cf" font-family="serif">酒</text>
            <text x="-32" y="6" text-anchor="middle" font-size="6" fill="#fff5cf" font-family="serif">市</text>
            <!-- 右侧红灯笼 -->
            <line x1="28" y1="-18" x2="28" y2="-2" stroke="#3d220f" stroke-width=".8" />
            <ellipse cx="28" cy="2" rx="5" ry="6" fill="url(#lanternGlow)" opacity=".5" />
            <ellipse cx="28" cy="2" rx="3.5" ry="4.5" fill="#d44a3a" stroke="#3d150d" stroke-width=".8" />
            <line x1="28" y1="-2" x2="28" y2="6" stroke="#3d150d" stroke-width=".4" />
            <line x1="28" y1="6.5" x2="28" y2="9" stroke="#3d220f" stroke-width=".6" />
            <!-- 摊位货架水果（黄圆点） -->
            <circle cx="-12" cy="11" r="1.8" fill="#e8c468" stroke="#3d220f" stroke-width=".3" />
            <circle cx="-6" cy="11" r="1.8" fill="#d4a437" stroke="#3d220f" stroke-width=".3" />
            <circle cx="6" cy="11" r="1.8" fill="#e8c468" stroke="#3d220f" stroke-width=".3" />
            <circle cx="12" cy="11" r="1.8" fill="#a8231a" stroke="#3d150d" stroke-width=".3" />
          </g>

          <g v-else-if="b.type === 'lumber'" class="b-body">
            <!-- 伐木场：树桩 + 圆木堆 + 斧头 -->
            <!-- 棚屋 -->
            <polygon points="-32,-2 -22,-14 22,-14 32,-2" fill="url(#darkWood)" stroke="#3d220f" stroke-width="1.2" />
            <rect x="-30" y="-2" width="60" height="14" fill="url(#wallWood)" stroke="#3d220f" stroke-width="1" />
            <!-- 原木堆 -->
            <ellipse cx="-14" cy="14" rx="10" ry="5" fill="#a17040" stroke="#3d220f" stroke-width="1" />
            <ellipse cx="0" cy="14" rx="10" ry="5" fill="#8a5a2a" stroke="#3d220f" stroke-width="1" />
            <ellipse cx="14" cy="14" rx="10" ry="5" fill="#a17040" stroke="#3d220f" stroke-width="1" />
            <ellipse cx="-7" cy="8" rx="10" ry="5" fill="#9c6638" stroke="#3d220f" stroke-width="1" />
            <ellipse cx="7" cy="8" rx="10" ry="5" fill="#9c6638" stroke="#3d220f" stroke-width="1" />
            <!-- 木桩年轮 -->
            <circle cx="-14" cy="14" r="2.6" fill="#5b3416" stroke="#caa468" stroke-width=".4" />
            <circle cx="0" cy="14" r="2.6" fill="#5b3416" stroke="#caa468" stroke-width=".4" />
            <circle cx="14" cy="14" r="2.6" fill="#5b3416" stroke="#caa468" stroke-width=".4" />
            <!-- 斧头插在最上 -->
            <line x1="-7" y1="8" x2="-12" y2="-2" stroke="#3d220f" stroke-width="1.6" />
            <polygon points="-12,-2 -10,-6 -16,-6 -14,-1" fill="url(#goldPlate)" stroke="#3d220f" stroke-width=".5" />
          </g>

          <g v-else-if="b.type === 'barrack'" class="b-body">
            <!-- 兵营：辕门 + 营帐 + 军旗 + 长矛 -->
            <!-- 主营帐（圆锥状） -->
            <polygon points="-26,18 0,-20 26,18" fill="url(#darkWood)" stroke="#3d220f" stroke-width="1.6" stroke-linejoin="round" />
            <line x1="0" y1="-20" x2="0" y2="18" stroke="#3d150d" stroke-width=".8" />
            <line x1="-26" y1="18" x2="-12" y2="-2" stroke="#3d150d" stroke-width=".6" opacity=".6" />
            <line x1="26" y1="18" x2="12" y2="-2" stroke="#3d150d" stroke-width=".6" opacity=".6" />
            <!-- 帐门 -->
            <path d="M-6 18 L0 6 L6 18 Z" fill="#1a0e08" stroke="#3d150d" stroke-width=".6" />
            <!-- 主帐顶旗 -->
            <line x1="0" y1="-20" x2="0" y2="-36" stroke="#3d220f" stroke-width="1.6" />
            <polygon points="0,-36 18,-32 0,-28" fill="#a8231a" stroke="#3d150d" stroke-width=".8" />
            <text x="6" y="-30" font-size="6" fill="#fff5cf" font-family="serif">兵</text>
            <!-- 左右长矛 -->
            <line x1="-30" y1="18" x2="-32" y2="-12" stroke="#3d220f" stroke-width="1.3" />
            <polygon points="-32,-12 -34,-16 -30,-16" fill="url(#goldPlate)" stroke="#3d220f" stroke-width=".4" />
            <line x1="30" y1="18" x2="32" y2="-12" stroke="#3d220f" stroke-width="1.3" />
            <polygon points="32,-12 30,-16 34,-16" fill="url(#goldPlate)" stroke="#3d220f" stroke-width=".4" />
          </g>

          <g v-else-if="b.type === 'workshop'" class="b-body">
            <!-- 工坊：铸炉 + 火光 + 烟囱 + 铁砧 -->
            <!-- 主屋 -->
            <use href="#wallBase" transform="translate(-2, 2) scale(.95, .9)" />
            <use href="#roofSmall" transform="translate(-2, 2) scale(1, 1)" />
            <!-- 烟囱 -->
            <rect x="10" y="-22" width="8" height="14" fill="url(#darkWood)" stroke="#3d220f" stroke-width=".8" />
            <ellipse cx="14" cy="-24" rx="8" ry="3.5" fill="rgba(160,140,100,.55)" />
            <ellipse cx="14" cy="-28" rx="6" ry="3" fill="rgba(180,160,120,.4)" />
            <!-- 炉口火光 -->
            <ellipse cx="-14" cy="14" rx="8" ry="5" fill="url(#forgeGlow)" />
            <path d="M-18 12 Q-14 4 -10 12" fill="#ff7a28" stroke="#a8231a" stroke-width=".6" opacity=".9" />
            <path d="M-16 13 Q-14 8 -12 13" fill="#ffd266" stroke="#a8231a" stroke-width=".4" />
            <!-- 铁砧 -->
            <rect x="6" y="14" width="14" height="6" fill="#3d220f" stroke="#000" stroke-width=".4" />
            <polygon points="6,14 4,11 22,11 20,14" fill="#5b3416" stroke="#000" stroke-width=".4" />
          </g>

          <g v-else-if="b.type === 'academy'" class="b-body">
            <!-- 武馆：演武台 + 兵器架 + 箭靶 -->
            <!-- 演武台基座 -->
            <polygon points="-36,18 36,18 32,26 -32,26" fill="#9c8458" stroke="#3d220f" stroke-width="1" />
            <rect x="-30" y="0" width="60" height="18" fill="url(#wallWood)" stroke="#3d220f" stroke-width="1.2" />
            <!-- 演武台顶（小亭子） -->
            <use href="#roofSmall" transform="translate(0, 4) scale(.95, .85)" />
            <!-- 朱柱 -->
            <rect x="-30" y="0" width="3" height="18" fill="#a8231a" stroke="#3d150d" stroke-width=".3" />
            <rect x="27" y="0" width="3" height="18" fill="#a8231a" stroke="#3d150d" stroke-width=".3" />
            <!-- 左侧兵器架 -->
            <line x1="-22" y1="0" x2="-22" y2="-20" stroke="#3d220f" stroke-width="1.6" />
            <line x1="-30" y1="-20" x2="-14" y2="-20" stroke="#3d220f" stroke-width="1.2" />
            <line x1="-28" y1="-20" x2="-28" y2="-28" stroke="#3d220f" stroke-width=".8" />
            <polygon points="-28,-28 -30,-32 -26,-32" fill="url(#goldPlate)" stroke="#3d220f" stroke-width=".4" />
            <line x1="-22" y1="-20" x2="-22" y2="-30" stroke="#3d220f" stroke-width=".8" />
            <polygon points="-22,-30 -24,-34 -20,-34" fill="url(#goldPlate)" stroke="#3d220f" stroke-width=".4" />
            <!-- 右侧箭靶 -->
            <circle cx="22" cy="-10" r="8" fill="#f0dca6" stroke="#3d220f" stroke-width="1" />
            <circle cx="22" cy="-10" r="5" fill="#a8231a" stroke="#3d150d" stroke-width=".5" />
            <circle cx="22" cy="-10" r="2.2" fill="#fff5cf" stroke="#3d150d" stroke-width=".4" />
            <line x1="22" y1="-2" x2="22" y2="0" stroke="#3d220f" stroke-width="1" />
          </g>

          <g v-else-if="b.type === 'inn'" class="b-body">
            <!-- 驿站：双檐小屋 + 灯笼 + 拴马柱 -->
            <use href="#wallBase" transform="translate(0, 0) scale(.95, .9)" />
            <use href="#roofSmall" transform="translate(0, 0) scale(1, 1)" />
            <!-- 屋脊上小幡 -->
            <line x1="0" y1="-16" x2="0" y2="-26" stroke="#3d220f" stroke-width="1.2" />
            <rect x="0" y="-26" width="10" height="6" fill="#a8231a" stroke="#3d150d" stroke-width=".4" />
            <text x="5" y="-21" text-anchor="middle" font-size="5" fill="#fff5cf" font-family="serif">驿</text>
            <!-- 双灯笼 -->
            <line x1="-24" y1="-2" x2="-24" y2="6" stroke="#3d220f" stroke-width=".6" />
            <ellipse cx="-24" cy="10" rx="4.5" ry="5.5" fill="url(#lanternGlow)" opacity=".55" />
            <ellipse cx="-24" cy="10" rx="3" ry="4" fill="#d44a3a" stroke="#3d150d" stroke-width=".6" />
            <line x1="-24" y1="14" x2="-24" y2="16" stroke="#3d220f" stroke-width=".5" />
            <line x1="24" y1="-2" x2="24" y2="6" stroke="#3d220f" stroke-width=".6" />
            <ellipse cx="24" cy="10" rx="4.5" ry="5.5" fill="url(#lanternGlow)" opacity=".55" />
            <ellipse cx="24" cy="10" rx="3" ry="4" fill="#d44a3a" stroke="#3d150d" stroke-width=".6" />
            <line x1="24" y1="14" x2="24" y2="16" stroke="#3d220f" stroke-width=".5" />
            <!-- 拴马柱 -->
            <rect x="-36" y="14" width="3" height="10" fill="#3d220f" />
            <circle cx="-34.5" cy="14" r="1.6" fill="url(#goldPlate)" stroke="#3d220f" stroke-width=".3" />
          </g>

          <g v-else-if="b.type === 'strategist'" class="b-body">
            <!-- 军师府：四角小亭 + 卷轴 + 围栏 -->
            <!-- 围栏 -->
            <line x1="-36" y1="22" x2="36" y2="22" stroke="#3d220f" stroke-width="1.2" />
            <line x1="-30" y1="18" x2="-30" y2="22" stroke="#3d220f" stroke-width="1" />
            <line x1="-15" y1="18" x2="-15" y2="22" stroke="#3d220f" stroke-width="1" />
            <line x1="15" y1="18" x2="15" y2="22" stroke="#3d220f" stroke-width="1" />
            <line x1="30" y1="18" x2="30" y2="22" stroke="#3d220f" stroke-width="1" />
            <!-- 亭子四柱 -->
            <rect x="-26" y="-2" width="3" height="22" fill="#a8231a" stroke="#3d150d" stroke-width=".3" />
            <rect x="23" y="-2" width="3" height="22" fill="#a8231a" stroke="#3d150d" stroke-width=".3" />
            <!-- 屋顶 -->
            <polygon points="-32,-2 -22,-20 22,-20 32,-2" fill="url(#roofRed)" stroke="#3d150d" stroke-width="1.4" stroke-linejoin="round" />
            <polygon points="-32,-2 -22,-20 22,-20 32,-2" fill="url(#tilePat)" />
            <rect x="-32" y="-3" width="64" height="2.5" fill="url(#goldPlate)" stroke="#3d150d" stroke-width=".4" />
            <!-- 翘檐 -->
            <path d="M-32 -2 q-4 0 -6 -2" stroke="#3d150d" stroke-width="1" fill="none" />
            <path d="M32 -2 q4 0 6 -2" stroke="#3d150d" stroke-width="1" fill="none" />
            <!-- 屋顶圆球饰 -->
            <line x1="0" y1="-20" x2="0" y2="-28" stroke="#3d220f" stroke-width="1.2" />
            <circle cx="0" cy="-30" r="2.2" fill="url(#goldPlate)" stroke="#3d150d" stroke-width=".4" />
            <!-- 亭内卷轴桌案 -->
            <rect x="-18" y="6" width="36" height="14" fill="url(#wallWood)" stroke="#3d220f" stroke-width=".8" />
            <!-- 桌上展开的卷轴 -->
            <rect x="-12" y="4" width="24" height="8" fill="#f3e1ad" stroke="#3d220f" stroke-width=".6" />
            <line x1="-9" y1="8" x2="9" y2="8" stroke="#3d150d" stroke-width=".3" />
            <line x1="-9" y1="10" x2="9" y2="10" stroke="#3d150d" stroke-width=".3" />
            <!-- 卷轴两端 -->
            <rect x="-14" y="3" width="2" height="10" fill="#5b3416" />
            <rect x="12" y="3" width="2" height="10" fill="#5b3416" />
          </g>

          <!-- 名牌 -->
          <g class="nameplate" :transform="`translate(0, ${b.type === 'palace' ? 56 : 38})`">
            <rect x="-32" y="-9" width="64" height="18" rx="2" fill="rgba(20,10,4,.82)" stroke="#e8c468" stroke-width=".8" />
            <text x="0" y="4" text-anchor="middle" fill="#f0d590" font-size="11" font-family="serif">
              {{ b.name }}<tspan dx="3" fill="#fff5cf">{{ game.city[b.key] || 0 }}</tspan>
            </text>
          </g>

          <!-- 建造中进度环 -->
          <g v-if="game.buildQueue.find((q) => q.key === b.key)" class="build-ring" transform="translate(0,0)">
            <circle r="32" fill="none" stroke="rgba(255,215,100,.25)" stroke-width="3" />
            <circle
              r="32"
              fill="none"
              stroke="#fff5cf"
              stroke-width="3"
              :stroke-dasharray="201"
              :stroke-dashoffset="201 - 201 * pctOf(game.buildQueue.find((q) => q.key === b.key)) / 100"
              transform="rotate(-90)"
            />
          </g>

          <!-- 驻守徽记 -->
          <g v-if="garrisonCountOf(b.key) > 0" class="garr-badge" :transform="`translate(28, -${b.type === 'palace' ? 38 : 24})`">
            <circle r="10" fill="#a8231a" stroke="#3d150d" stroke-width="1.5" />
            <text x="0" y="4" text-anchor="middle" fill="#fff1c2" font-size="11" font-weight="700">{{ garrisonCountOf(b.key) }}</text>
          </g>
        </g>

        <!-- 河流装饰：贴城墙底部弧线，不进入建筑区 -->
        <path d="M40 440 Q 200 432 380 444 T 760 436" stroke="#4a8cbe" stroke-width="5" fill="none" opacity=".5" />
        <!-- 门名注记：四面 8 门简化为四个角落标识，避免与建筑/道路混淆 -->
        <text x="80" y="95" fill="#5b3416" font-size="11" font-family="serif" opacity=".7">北门</text>
        <text x="700" y="95" fill="#5b3416" font-size="11" font-family="serif" opacity=".7">东门</text>
        <text x="80" y="475" fill="#5b3416" font-size="11" font-family="serif" opacity=".7">西门</text>
        <text x="700" y="475" fill="#5b3416" font-size="11" font-family="serif" opacity=".7">南门</text>
      </svg>

      <!-- hover 气泡（绝对定位、跟随热区） -->
      <transition name="tip-fade">
        <div v-if="hoverInfo" class="hover-tip" :style="hoverTipStyle">
          <div class="ht-title">{{ hoverInfo.name }} · Lv {{ game.city[hoverInfo.key] || 0 }}</div>
          <div class="ht-desc">{{ hoverInfo.desc }}</div>
          <div v-if="hoverInfo.locked" class="ht-locked">▎尚未建造，点击新建</div>
          <div v-else class="ht-meta">▎点击查看详情/升级/施令</div>
        </div>
      </transition>
    </div>

    <p class="city-foot">▎拖动城图·点击建筑·决策内政▎</p>

    <BuildingDetailModal :show="modalOpen" :building="activeKey" @close="modalOpen = false" />

    <transition name="flash">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'
import { BUILDING_MAP } from '../data/buildings.js'
import BuildingDetailModal from '../components/BuildingDetailModal.vue'
import AppIcon from '../components/AppIcon.vue'

const game = useGameStore()

const modalOpen = ref(false)
const activeKey = ref('')
const flashKey = ref('')
const toast = ref(null)
const hoverKey = ref(null)
const stageEl = ref(null)
const mouseX = ref(0)
const mouseY = ref(0)

/** 9 个建筑在 800x520 viewBox 中的位置 + 视觉类型
 *  采用 3 列(x=200/400/600) × 3 行(y=150/280/400) 齐整阵列：
 *    横向间距 200px、纵向间距 130px / 120px，建筑半径约 50px，互不重叠。
 *    palace 主公府位于绝对中心 (400, 280)。
 */
const HOTSPOTS_LAYOUT = [
  // 第一行：农田 / 武馆 / 市集
  { key: 'farm',       x: 200, y: 150, type: 'farm' },
  { key: 'academy',    x: 400, y: 150, type: 'academy' },
  { key: 'market',     x: 600, y: 150, type: 'market' },
  // 第二行：伐木 / 主公府(中心) / 工坊
  { key: 'lumber',     x: 200, y: 280, type: 'lumber' },
  { key: 'lordHall',   x: 400, y: 280, type: 'palace' },
  { key: 'workshop',   x: 600, y: 280, type: 'workshop' },
  // 第三行：兵营 / 军师府 / 驿站
  { key: 'barrack',    x: 200, y: 400, type: 'barrack' },
  { key: 'strategist', x: 400, y: 400, type: 'strategist' },
  { key: 'inn',        x: 600, y: 400, type: 'inn' }
]
const buildingHotspots = computed(() =>
  HOTSPOTS_LAYOUT.map((p) => ({ ...p, ...(BUILDING_MAP[p.key] || {}) }))
)

const hoverInfo = computed(() => {
  if (!hoverKey.value) return null
  const cfg = BUILDING_MAP[hoverKey.value]
  if (!cfg) return null
  return {
    key: hoverKey.value,
    name: cfg.name,
    desc: cfg.desc,
    locked: !game.city[hoverKey.value]
  }
})

const hoverTipStyle = computed(() => ({
  left: mouseX.value + 'px',
  top: (mouseY.value - 8) + 'px'
}))

function onSvgMove(e) {
  if (!stageEl.value) return
  const rect = stageEl.value.getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
}

function open(key) {
  activeKey.value = key
  modalOpen.value = true
}
function garrisonCountOf(key) {
  return (game.garrison[key] || []).length
}
const GOV_TIPS = {
  security: '治安：越低越易触发匪患/民变事件；建议保持 60 以上',
  tech:     '科技：每 1 点 +0.1% 全资源产出（粮/钱/木/兵）',
  culture:  '文化：每 1 点 +0.05% 全资源产出，同时影响民心恢复',
  commerce: '商业：每 1 点 +0.15% 铜钱产出，是主要的财政支柱'
}
function govTipOf(key) { return GOV_TIPS[key] || key }

const tickNow = ref(Date.now())
let timer = null
onMounted(() => {
  timer = setInterval(() => { tickNow.value = Date.now() }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

function pctOf(q) {
  void tickNow.value
  if (!q) return 0
  const total = q.totalSec * 1000
  const elapsed = Date.now() - q.startAt
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}
function remainOf(q) {
  void tickNow.value
  return Math.max(0, Math.ceil((q.doneAt - Date.now()) / 1000))
}
</script>

<style scoped>
.city-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100%;
}

/* ============== 治理条 ============== */
.gov-section { display: flex; flex-direction: column; gap: 4px; }
.gov-head { display: flex; align-items: center; gap: 5px; padding: 0 2px; }
.gh-title { font-family: var(--font-title); font-size: 13px; font-weight: 700; color: var(--c-gold); letter-spacing: .12em; }
.gh-tip { font-size: 12px; color: var(--c-paper-dark); opacity: .75; margin-left: auto; }
.gov-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.gov-pill {
  display: flex; flex-direction: column; gap: 3px; padding: 4px 6px 5px;
  background: linear-gradient(180deg, rgba(40,24,14,.82), rgba(20,10,4,.88));
  border: 1px solid rgba(232,196,104,.45); border-left-width: 3px; border-radius: var(--r-sm);
  box-shadow: 0 2px 4px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,0,0,.35); cursor: help;
}
.gp-top { display: flex; align-items: center; gap: 4px; line-height: 1; }
.gp-icon { font-size: 13px; flex: 0 0 auto; }
.gp-label { font-size: 13px; color: var(--c-gold-light); font-family: var(--font-title); letter-spacing: .04em; flex: 1; }
.gp-num { font-family: var(--font-num); font-size: 13px; font-weight: 700; text-align: right; }
.gp-num-max { font-size: 12px; font-weight: 400; color: var(--c-paper-dark); opacity: .7; margin-left: 1px; }
.gp-bar { display: block; height: 4px; background: rgba(0,0,0,.45); border-radius: var(--r-sm); overflow: hidden; }
.gp-fill { display: block; height: 100%; transition: width .35s; }

/* ============== 队列条 ============== */
.queue-strip {
  display: flex; align-items: center; gap: 6px; padding: 4px 8px;
  background: linear-gradient(180deg, rgba(60,30,10,.85), rgba(30,14,6,.9));
  border: 1px solid var(--c-gold-dark); border-radius: var(--r-sm); font-size: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,.55);
}
.qs-label { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-title); letter-spacing: 2px; color: var(--c-gold-light); flex-shrink: 0; }
.qs-item { display: flex; align-items: center; gap: 3px; flex: 1; cursor: pointer; min-width: 0; }
.qs-icon { font-size: 15px; flex-shrink: 0; color: var(--c-gold); }
.qs-bar { flex: 1; height: 5px; background: rgba(0,0,0,.55); border: 1px solid var(--c-gold-dark); min-width: 30px; overflow: hidden; }
.qs-fill { display: block; height: 100%; background: linear-gradient(90deg, #b8862e, #d4af37, #fff5cf); background-size: 200% 100%; animation: build-flow 2.5s linear infinite; transition: width .4s; }
@keyframes build-flow { 0% { background-position: 0 0; } 100% { background-position: -200% 0; } }
.qs-time { font-family: var(--font-num); color: var(--c-gold-light); flex-shrink: 0; }
.qs-cap { font-family: var(--font-num); color: var(--c-muted); flex-shrink: 0; }

/* ============== 城池地图 ============== */
.map-stage {
  position: relative;
  flex: 1;
  min-height: 360px;
  background:
    radial-gradient(ellipse at center, rgba(20,10,4,.35), rgba(20,10,4,.55) 90%);
  border: 1px solid var(--c-gold-dark);
  border-radius: var(--r-md);
  box-shadow: 0 4px 14px rgba(0,0,0,.55), inset 0 0 16px rgba(0,0,0,.45);
  overflow: hidden;
}
.city-map {
  display: block;
  width: 100%;
  height: 100%;
  cursor: default;
}

/* 城墙/道路/水纹基础样式（无效互动） */
.city-wall { pointer-events: none; }
.city-gate, .road { pointer-events: none; }

/* 热区 */
.hotspot { cursor: pointer; transition: transform .25s cubic-bezier(.2,.8,.25,1.1); }
.hotspot .b-body { transition: filter .3s ease, transform .25s ease; transform-box: fill-box; transform-origin: center; }
.hotspot:hover { transform-origin: center; }
.hotspot:hover .b-body {
  filter:
    drop-shadow(0 0 4px rgba(255, 224, 138, .9))
    drop-shadow(0 0 8px rgba(255, 215, 100, .55))
    drop-shadow(0 4px 4px rgba(0, 0, 0, .35));
  transform: translateY(-2px) scale(1.04);
}
.hotspot.locked .b-body {
  opacity: .45;
  filter: grayscale(.85) brightness(.8) drop-shadow(0 2px 3px rgba(0, 0, 0, .45));
}
.hotspot.locked:hover .b-body {
  opacity: .65;
  filter: grayscale(.5) brightness(.95) drop-shadow(0 0 6px rgba(255, 215, 100, .6));
}
.hotspot.building .b-body {
  filter: drop-shadow(0 0 10px rgba(255, 215, 100, .9)) drop-shadow(0 0 2px rgba(255, 255, 255, .8));
  animation: hot-build-pulse 1.6s ease-in-out infinite;
}
.hotspot.flashing .b-body { animation: hot-flash 1s ease 2; }
@keyframes hot-build-pulse {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(255, 215, 100, .55)); }
  50% { filter: drop-shadow(0 0 14px rgba(255, 224, 138, 1)) drop-shadow(0 0 4px rgba(255, 255, 255, .85)); }
}
@keyframes hot-flash {
  0%, 100% { filter: none; }
  50% { filter: drop-shadow(0 0 12px rgba(255,215,100,1)) brightness(1.4); }
}
.nameplate text { letter-spacing: 2px; }

/* hover 气泡 */
.hover-tip {
  position: absolute;
  pointer-events: none;
  z-index: 20;
  transform: translate(-50%, -100%);
  min-width: 150px;
  max-width: 240px;
  padding: 6px 10px;
  background: linear-gradient(180deg, rgba(40,22,10,.96), rgba(20,10,4,.96));
  border: 1px solid var(--c-gold);
  border-radius: var(--r-sm);
  box-shadow: 0 6px 14px rgba(0,0,0,.65), 0 0 12px rgba(232,196,104,.4);
  font-size: 13px;
  color: var(--c-paper);
}
.ht-title {
  font-family: var(--font-title);
  font-size: 13px;
  color: #fff5cf;
  letter-spacing: 2px;
  margin-bottom: 3px;
}
.ht-desc { color: var(--c-paper); opacity: .85; line-height: 1.45; }
.ht-locked { color: #f0a060; margin-top: 4px; font-size: 12px; letter-spacing: 1px; }
.ht-meta { color: var(--c-gold-light); margin-top: 4px; font-size: 12px; letter-spacing: 1px; }
.tip-fade-enter-active, .tip-fade-leave-active { transition: opacity .15s, transform .15s; }
.tip-fade-enter-from { opacity: 0; transform: translate(-50%, -94%); }
.tip-fade-leave-to { opacity: 0; transform: translate(-50%, -94%); }

.city-foot {
  text-align: center;
  font-family: var(--font-title);
  letter-spacing: 3px;
  color: var(--c-gold-light);
  font-size: 12px;
  margin: 4px 0 0;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,.85), 0 0 6px rgba(0,0,0,.5);
  opacity: .85;
}

.toast {
  position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
  z-index: 300; padding: 8px 18px;
  font-family: var(--font-title); font-size: 15px; letter-spacing: 3px;
  border: 1px solid var(--c-gold);
  border-radius: var(--r-sm);
  background:
    radial-gradient(ellipse at 50% 0%, rgba(255, 245, 210, .65) 0%, transparent 70%),
    linear-gradient(180deg, rgba(255, 245, 210, .98), rgba(232, 205, 150, .98));
  color: #2a1810;
  text-shadow: 0 1px 0 rgba(255, 245, 210, .65);
  box-shadow:
    inset 0 0 0 1px rgba(232, 196, 104, .55),
    inset 0 0 12px rgba(168, 122, 40, .15),
    0 0 12px rgba(232, 196, 104, .55),
    0 4px 10px rgba(0, 0, 0, .45);
}
.toast.err {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(255, 200, 180, .45) 0%, transparent 70%),
    linear-gradient(180deg, rgba(168, 35, 26, .98), rgba(110, 20, 16, .98));
  border-color: var(--c-red-dark);
  color: #fff1c2;
  text-shadow: 0 1px 1px rgba(0, 0, 0, .65);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .35),
    inset 0 0 12px rgba(60, 8, 6, .55),
    0 0 12px rgba(168, 35, 26, .65),
    0 4px 10px rgba(0, 0, 0, .45);
}
.flash-enter-active, .flash-leave-active { transition: opacity .25s, transform .25s; }
.flash-enter-from { opacity: 0; transform: translate(-50%, -8px); }
.flash-leave-to { opacity: 0; transform: translate(-50%, -8px); }

@media (max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .hotspot:hover .b-body { filter: none; transform: none; }
  .map-stage { min-height: 300px; }
}
</style>
