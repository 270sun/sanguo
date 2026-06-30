<template>
  <section class="view profile-view">
    <h2 class="view-title">主 公 府</h2>
    <p class="view-tip">▎运筹帷幄·决胜千里▎</p>

    <div class="tab-switcher">
      <button
        v-for="t in TABS"
        :key="t.key"
        class="tab-btn"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >
        <span class="tab-icon"><AppIcon :kind="t.iconKind" :id="t.iconId" :size="14" /></span>
        <span class="tab-name">{{ t.name }}</span>
      </button>
    </div>

    <div class="tab-body">

    <div v-show="activeTab === 'profile'" class="card lord-card">
      <div class="lord-portrait">
        <div class="frame">
          <AppIcon kind="tab" id="profile" :size="40" tone="gold" />
        </div>
        <div class="lord-info">
          <div class="lord-name-row">
            <input v-model="game.meta.lordName" class="lord-input" maxlength="10" @change="game.saveToLocal()" />
          </div>
          <div class="title-row"><span class="seal">汉</span> 一方诸侯</div>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat">
          <div class="k">建国之日</div>
          <div class="v num">{{ formatDate(game.meta.createdAt) }}</div>
        </div>
        <div class="stat">
          <div class="k">总战力</div>
          <div class="v num">{{ game.totalPower }}</div>
        </div>
        <div class="stat">
          <div class="k">民心</div>
          <div class="v num">{{ Math.round(game.policy.morale) }}/100</div>
        </div>
        <div class="stat">
          <div class="k">人口</div>
          <div class="v num">{{ game.policy.population }}</div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'gov'" class="card gov-card">
      <h3 class="card-title"><AppIcon kind="gov" id="tech" :size="14" /> 治 理 仪 表</h3>
      <div class="gov-grid">
        <div v-for="g in game.governanceList" :key="g.key" class="gov-item">
          <div class="gov-head">
            <span class="gov-icon" :style="{ color: g.color }"><AppIcon :kind="g.iconKind" :id="g.iconId" :size="14" /></span>
            <span class="gov-label">{{ g.label }}</span>
            <span class="gov-val num">{{ g.value }}</span>
          </div>
          <div class="gov-track">
            <div class="gov-fill" :style="{ width: g.value + '%', background: g.color }"></div>
            <div class="gov-mark" style="left: 50%"></div>
          </div>
          <div class="gov-desc">{{ govDescOf(g) }}</div>
        </div>
      </div>
      <div class="gov-foot">
        <div class="gov-mul">
          <span>资源倍率：</span>
          <span class="mul-pill"><AppIcon kind="res" id="grain" :size="12" />×{{ game.governanceMul.grain.toFixed(2) }}</span>
          <span class="mul-pill"><AppIcon kind="res" id="coin" :size="12" />×{{ game.governanceMul.coin.toFixed(2) }}</span>
          <span class="mul-pill"><AppIcon kind="res" id="wood" :size="12" />×{{ game.governanceMul.wood.toFixed(2) }}</span>
          <span class="mul-pill"><AppIcon kind="res" id="soldier" :size="12" />×{{ game.governanceMul.soldier.toFixed(2) }}</span>
        </div>
        <p class="gov-tip">▸ 科技+0.1%/点·文化+0.05%/点·商业+0.15%/点（仅作用于铜钱）·治安低于70易发盗匪/失火</p>
      </div>
    </div>

    <div v-show="activeTab === 'spec'" class="card policy-card">
      <h3 class="card-title"><AppIcon kind="misc" id="scroll" :size="14" /> 国 策 流 派</h3>
      <!-- 未选流派：三选一 -->
      <div v-if="!game.specialization.key" class="spec-pick">
        <p class="spec-tip">立国之策仅可择其一·后续以「声望」逐阶精进</p>
        <div class="spec-grid">
          <button
            v-for="s in SPECS"
            :key="s.key"
            class="spec-card"
            :style="{ borderColor: s.color, boxShadow: `0 0 12px ${s.glow}` }"
            @click="onPickSpec(s.key)"
          >
            <div class="spec-icon" :style="{ color: s.color }"><AppIcon kind="spec" :id="s.key" :size="32" /></div>
            <div class="spec-name" :style="{ color: s.color }">{{ s.name }}</div>
            <div class="spec-title">{{ s.title }}</div>
            <div class="spec-desc">{{ s.desc }}</div>
            <div class="spec-flavor">{{ s.flavor }}</div>
            <div class="spec-preview">
              <span v-for="(p, i) in previewLines(s)" :key="i" class="ppl">·{{ p }}</span>
            </div>
          </button>
        </div>
      </div>
      <!-- 已选流派 -->
      <div v-else class="spec-detail" :style="{ borderColor: specCfg.color }">
        <div class="spec-head">
          <span class="head-icon" :style="{ color: specCfg.color }"><AppIcon kind="spec" :id="specCfg.key" :size="28" /></span>
          <div class="head-meta">
            <div class="head-name" :style="{ color: specCfg.color }">{{ specCfg.name }} · {{ specCfg.title }}</div>
            <div class="head-sub">{{ specCfg.flavor }}</div>
          </div>
          <button class="dismiss-spec" @click="onResetSpec" title="解除流派">×</button>
        </div>
        <div class="stage-track">
          <div
            v-for="(st, i) in specCfg.stages"
            :key="i"
            class="stage-cell"
            :class="{ done: i < game.specialization.stage }"
            :style="{
              borderColor: i < game.specialization.stage ? specCfg.color : 'var(--c-line)',
              background: i < game.specialization.stage ? specCfg.color : 'transparent',
              color: i < game.specialization.stage ? '#fff' : 'var(--c-muted)'
            }"
          >
            <div class="cell-no">{{ i + 1 }}</div>
            <div class="cell-name">{{ st.name }}</div>
          </div>
        </div>
        <div class="spec-effect-box">
          <div class="ef-line" v-for="(line, i) in currentEffectLines" :key="i">▸ {{ line }}</div>
          <div v-if="currentEffectLines.length === 0" class="ef-line muted">▸ 尚未精进任何阶段</div>
        </div>
        <div v-if="game.specInfo.next" class="next-stage">
          <div class="next-info">
            下一阶：<b>{{ game.specInfo.next.name }}</b>
            <span class="cost">需声望 {{ game.specInfo.next.reputation }}（当前 {{ game.resources.reputation }}）</span>
          </div>
          <button
            class="btn primary advance-btn"
            :disabled="(game.resources.reputation || 0) < game.specInfo.next.reputation"
            @click="onAdvance"
          >
            <AppIcon kind="res" id="ap" :size="12" /> 精 进
          </button>
        </div>
        <div v-else class="next-stage done-stage">
          ✦ 已修至极致·当世国士 ✦
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'tax'" class="card policy-card">
      <h3 class="card-title"><AppIcon kind="res" id="coin" :size="14" /> 税 政 民 心</h3>
      <div class="tax-row">
        <button
          v-for="t in taxOptions"
          :key="t.key"
          class="tax-btn"
          :class="{ active: game.policy.tax === t.key }"
          @click="game.setTax(t.key)"
        >
          <div class="t-name">{{ t.label }}</div>
          <div class="t-meta">铜钱×{{ t.coinMul }}</div>
          <div class="t-meta" :class="{ pos: t.moralePerMin > 0, neg: t.moralePerMin < 0 }">
            民心{{ t.moralePerMin >= 0 ? '+' : '' }}{{ t.moralePerMin }}/分
          </div>
        </button>
      </div>
      <p class="tax-tip">{{ game.taxConf.tip }}</p>
      <div class="morale-line">
        <span class="m-label">当前民心</span>
        <div class="m-track">
          <div class="m-fill" :style="{ width: game.policy.morale + '%' }"></div>
        </div>
        <span class="m-num num">{{ Math.round(game.policy.morale) }}/100</span>
      </div>
      <p class="morale-note">民心倍率：<b class="num">×{{ game.moraleFactor.toFixed(2) }}</b>（影响粮草/木材/兵力产出）</p>
    </div>

    <div v-show="activeTab === 'archive'" class="card">
      <h3 class="card-title"><AppIcon kind="misc" id="seal" :size="14" /> 卷 宗 管 理</h3>
      <div class="btn-row">
        <button class="btn" @click="exportSave">导出存档码</button>
        <button class="btn" @click="showImport = !showImport">导入存档</button>
        <button class="btn danger" @click="confirmReset">重开新局</button>
      </div>
      <textarea v-if="exportText" readonly class="codebox" :value="exportText" @focus="$event.target.select()"></textarea>
      <div v-if="showImport" class="import-block">
        <textarea v-model="importText" class="codebox" placeholder="粘贴存档码…"></textarea>
        <button class="btn primary" @click="doImport">确认导入</button>
      </div>
    </div>

    </div>

    <p class="footer-tip">— 卧龙吟·诸侯纪 v0.1.0 —</p>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore, TAX_TABLE } from '../stores/game'
import { SPECIALIZATIONS, SPECIALIZATION_MAP } from '../data/specializations'
import AppIcon from '../components/AppIcon.vue'

const game = useGameStore()
const exportText = ref('')
const importText = ref('')
const showImport = ref(false)

const TABS = [
  { key: 'profile', name: '档案', iconKind: 'tab',  iconId: 'profile' },
  { key: 'gov',     name: '治理', iconKind: 'gov',  iconId: 'tech'    },
  { key: 'spec',    name: '流派', iconKind: 'misc', iconId: 'scroll'  },
  { key: 'tax',     name: '税政', iconKind: 'res',  iconId: 'coin'    },
  { key: 'archive', name: '卷宗', iconKind: 'misc', iconId: 'seal'    }
]
const activeTab = ref('profile')

const SPECS = SPECIALIZATIONS

const taxOptions = computed(() =>
  Object.entries(TAX_TABLE).map(([key, v]) => ({ key, ...v }))
)

const specCfg = computed(() => {
  const k = game.specialization.key
  return k ? SPECIALIZATION_MAP[k] : null
})

/** 各流派在卡面上的预览（仅显示第一阶段的关键效果，让选择有判断依据） */
function previewLines(s) {
  const s1 = s.stages[0] || {}
  const lines = []
  if (s1.rateMul) {
    for (const [k, v] of Object.entries(s1.rateMul)) {
      if (v > 1) lines.push(`${nameOf(k)}×${v}`)
    }
  }
  if (s1.powerMul) lines.push(`战力×${s1.powerMul}`)
  if (s1.tavernCostMul && s1.tavernCostMul < 1) lines.push(`刷新${Math.round(s1.tavernCostMul * 100)}%`)
  if (s1.heroExpMul) lines.push(`经验×${s1.heroExpMul}`)
  if (s1.heroCapBonus) lines.push(`名额+${s1.heroCapBonus}`)
  if (s1.apRegenMul) lines.push(`精力×${s1.apRegenMul}`)
  if (s1.cooldownMul && s1.cooldownMul < 1) lines.push(`冷却${Math.round(s1.cooldownMul * 100)}%`)
  return lines
}

/** 当前已修阶段汇总成的可读文本 */
const currentEffectLines = computed(() => {
  if (!game.specialization.key) return []
  const ef = game.specEffects
  const out = []
  const rm = ef.rateMul
  const rateParts = []
  for (const k of ['grain', 'coin', 'wood', 'soldier']) {
    if (rm[k] && rm[k] !== 1) rateParts.push(`${nameOf(k)}×${rm[k].toFixed(2)}`)
  }
  if (rateParts.length) out.push('资源产出：' + rateParts.join('·'))
  if (ef.powerMul > 1) out.push(`出征全队战力 ×${ef.powerMul.toFixed(2)}`)
  if (ef.cooldownMul < 1) out.push(`战败冷却缩短至 ${Math.round(ef.cooldownMul * 100)}%`)
  if (ef.tavernCostMul < 1) out.push(`客栈刷新仅 ${Math.round(ef.tavernCostMul * 100)}% 铜钱`)
  if (ef.heroExpMul > 1) out.push(`武将经验 ×${ef.heroExpMul.toFixed(2)}`)
  if (ef.apRegenMul > 1) out.push(`精力恢复 ×${ef.apRegenMul.toFixed(2)}`)
  if (ef.heroCapBonus) out.push(`招募名额额外 +${ef.heroCapBonus}`)
  if (ef.moraleBonus) out.push(`民心保底 ${80 + ef.moraleBonus}`)
  return out
})

function nameOf(k) {
  return ({ grain: '粮草', coin: '铜钱', wood: '木材', soldier: '兵力' })[k] || k
}

function govDescOf(g) {
  const v = g.value
  if (g.key === 'tech') {
    if (v >= 80) return '诸子百家·百工兴盛'
    if (v >= 50) return '太学初立·读书识字'
    if (v >= 20) return '匠人寥落·器具粗陋'
    return '蒙昧未启·亟需兴学'
  }
  if (g.key === 'culture') {
    if (v >= 80) return '礼乐昭昭·士民归心'
    if (v >= 50) return '诗书入闾巷'
    if (v >= 20) return '风化尚浅'
    return '人心散乱·礼崩乐坏'
  }
  if (g.key === 'security') {
    if (v >= 80) return '路不拾遗·夜不闭户'
    if (v >= 50) return '城防稳固'
    if (v >= 30) return '盗匪初现·宜增戍卒'
    return '盗匪横行·险事将至！'
  }
  if (g.key === 'commerce') {
    if (v >= 80) return '商贾云集·钱粮丰盈'
    if (v >= 50) return '市集兴隆'
    if (v >= 20) return '小本经营'
    return '市井萧条'
  }
  return ''
}

function onPickSpec(key) {
  const res = game.chooseSpecialization(key)
  if (!res.ok) alert(res.reason)
}
function onAdvance() {
  const res = game.advanceSpecialization()
  if (!res.ok) alert(res.reason)
}
function onResetSpec() {
  if (!confirm('确认解除当前流派？已修阶段将折算返还少量声望')) return
  const res = game.resetSpecialization()
  if (res.ok && res.refund) alert(`已解除·返还声望 ${res.refund}`)
}

function exportSave() {
  game.saveToLocal()
  exportText.value = game.exportSaveCode()
}

function doImport() {
  if (!importText.value.trim()) return
  const ok = game.importSaveCode(importText.value.trim())
  alert(ok ? '导入成功！' : '导入失败：存档码无效')
  if (ok) {
    importText.value = ''
    showImport.value = false
  }
}

function confirmReset() {
  if (confirm('确认重开新局？当前进度将清空。')) {
    game.resetGame()
  }
}

function formatDate(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
/* ============================================================
 *  ProfileView · 5-Tab 单屏 不滚动
 *  顶部 5 Tab 切换器（深木纹 + 鎏金边 / 激活态烫金）
 *  整页高度严格 = calc(100vh - 130px - 16px)
 * ============================================================ */

.profile-view {
  /* 贴合 .app-main 的可视高度（外层已是滚动容器，padding 已减去 HUD/底部空间） */
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.profile-view .view-title { flex-shrink: 0; }
.profile-view .view-tip   { flex-shrink: 0; }

/* ------- 顶部 Tab 切换器 ------- */
.tab-switcher {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin: 6px 0 8px;
  padding: 4px;
  background:
    repeating-linear-gradient(90deg,
      rgba(40, 22, 10, .92) 0px, rgba(40, 22, 10, .92) 6px,
      rgba(28, 14, 6, .92) 6px, rgba(28, 14, 6, .92) 12px),
    linear-gradient(180deg, rgba(40, 22, 10, .92), rgba(20, 10, 4, .96));
  border: 1px solid rgba(232, 196, 104, .55);
  border-radius: var(--r-sm);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 14px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703;
}
.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 5px 2px;
  background: rgba(20, 10, 4, .55);
  border: 1px solid rgba(232, 196, 104, .35);
  color: var(--c-gold-light);
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 2px;
  cursor: pointer;
  border-radius: var(--r-sm);
  transition: all .2s;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.tab-btn:hover {
  border-color: var(--c-gold);
  box-shadow: 0 0 8px rgba(232, 196, 104, .35);
}
.tab-btn .tab-icon { display: inline-flex; align-items: center; line-height: 1; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .55)); }
.tab-btn .tab-name { font-size: 13px; }
.tab-btn.active {
  background: linear-gradient(180deg, #f5d678, #b8862e);
  color: #2a1810;
  border-color: var(--c-gold);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, .35),
    0 0 12px rgba(232, 196, 104, .75);
  text-shadow: 0 1px 0 rgba(255, 240, 200, .55);
}

/* ------- Tab 内容容器：自身滚动条 ------- */
.tab-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.tab-body > .card {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 0;
}

.profile-view .footer-tip { flex-shrink: 0; margin-top: 6px; }

/* ============================================================
 *  以下为原有样式（保持不变）
 * ============================================================ */

.profile-view :deep(.card) {
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .55);
  color: var(--c-gold-light);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 18px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703,
    0 4px 10px rgba(0, 0, 0, .55);
  border-radius: var(--r-sm);
}

/* 主公肖像 */
.lord-portrait {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.frame {
  width: 60px; height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle, rgba(232, 196, 104, .55), rgba(232, 196, 104, 0) 70%),
    #1a0e07;
  border: 2px solid var(--c-gold);
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 2px rgba(255, 240, 200, .25),
    0 0 12px rgba(232, 196, 104, .5);
}
.frame :deep(svg) {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .75)) drop-shadow(0 0 4px rgba(232, 196, 104, .55));
}
.lord-info { flex: 1; }
.lord-input {
  width: 100%;
  font-family: var(--font-title);
  font-size: 18px;
  letter-spacing: 4px;
  background: transparent;
  border: none;
  border-bottom: 1px dashed rgba(232, 196, 104, .55);
  padding: 2px 0;
  color: var(--c-gold-light);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.lord-input:focus {
  border-bottom-color: var(--c-gold);
  box-shadow: none;
  outline: none;
}
.title-row {
  font-size: 13px;
  color: var(--c-gold-light);
  opacity: .75;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  border-top: 1px dashed rgba(232, 196, 104, .45);
  padding-top: 10px;
}
.stat {
  background: rgba(0, 0, 0, .35);
  border: 1px solid rgba(232, 196, 104, .4);
  padding: 6px 8px;
  border-radius: var(--r-sm);
}
.stat .k {
  font-size: 13px;
  color: var(--c-gold);
  letter-spacing: 1px;
  opacity: .85;
}
.stat .v {
  font-size: 15px;
  color: var(--c-gold-light);
  margin-top: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}

.card-title {
  margin: 0 0 10px;
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 4px;
  color: var(--c-gold-light);
  text-align: center;
  border-bottom: 1px dashed rgba(232, 196, 104, .55);
  padding-bottom: 6px;
  text-shadow: 0 0 8px rgba(212, 175, 55, .55), 0 1px 2px rgba(0, 0, 0, .85);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.card-title :deep(svg) {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .65));
  flex-shrink: 0;
}
.btn-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.codebox {
  width: 100%;
  height: 70px;
  margin-top: 8px;
  padding: 6px;
  font-size: 13px;
  font-family: monospace;
  resize: vertical;
  box-sizing: border-box;
  background: rgba(0, 0, 0, .55);
  border: 1px solid rgba(232, 196, 104, .45);
  color: var(--c-gold-light);
  border-radius: var(--r-sm);
}
.codebox:focus {
  outline: none;
  border-color: var(--c-gold);
  box-shadow: 0 0 8px rgba(212, 175, 55, .35);
}
.import-block { margin-top: 8px; text-align: center; }
.import-block .btn { margin-top: 6px; }
.footer-tip {
  text-align: center;
  font-size: 13px;
  color: var(--c-gold-light);
  opacity: .6;
  margin-top: 20px;
  letter-spacing: 3px;
  font-family: var(--font-title);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}

/* 税政 */
.tax-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}
.tax-btn {
  background: rgba(20, 10, 4, .75);
  border: 1px solid rgba(232, 196, 104, .45);
  padding: 6px 4px;
  cursor: pointer;
  font-family: var(--font-title);
  color: var(--c-gold-light);
  letter-spacing: 1px;
  transition: all .2s;
  box-shadow: inset 0 0 0 1px rgba(255, 240, 200, .08);
  border-radius: var(--r-sm);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.tax-btn:hover {
  transform: translateY(-1px);
  border-color: var(--c-gold);
  box-shadow: 0 0 8px rgba(232, 196, 104, .35);
}
.tax-btn.active {
  background: linear-gradient(180deg, #f5d678, #b8862e);
  color: #2a1810;
  border-color: var(--c-gold);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, .35),
    0 0 12px rgba(232, 196, 104, .75);
  text-shadow: none;
}
.tax-btn .t-name { font-size: 15px; font-weight: 700; letter-spacing: 3px; }
.tax-btn .t-meta {
  font-size: 12px;
  color: var(--c-gold);
  opacity: .85;
  margin-top: 2px;
}
.tax-btn.active .t-meta { color: #4a2a08; opacity: 1; }
.tax-btn .t-meta.pos { color: #b3e5a3; }
.tax-btn .t-meta.neg { color: #ff8a78; }
.tax-btn.active .t-meta.pos,
.tax-btn.active .t-meta.neg { color: #4a2a08; }

.tax-tip {
  margin: 4px 0 10px;
  font-size: 13px;
  color: var(--c-gold-light);
  opacity: .7;
  text-align: center;
  letter-spacing: 1px;
  border-top: 1px dashed rgba(232, 196, 104, .45);
  padding-top: 6px;
}

.morale-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 4px;
}
.m-label {
  color: var(--c-gold);
  flex-shrink: 0;
  opacity: .85;
}
.m-track {
  flex: 1;
  height: 10px;
  background: rgba(0, 0, 0, .55);
  border: 1px solid rgba(232, 196, 104, .4);
  border-radius: var(--r-sm);
  overflow: hidden;
}
.m-fill {
  height: 100%;
  background: linear-gradient(90deg, #a8231a 0%, #d4af37 100%);
  transition: width .35s;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .3);
}
.m-num {
  flex-shrink: 0;
  color: var(--c-gold-light);
  font-size: 13px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.morale-note {
  font-size: 12px;
  color: var(--c-gold-light);
  opacity: .7;
  text-align: center;
  margin: 4px 0 0;
  letter-spacing: 1px;
}
.morale-note b { color: #ff8a78; font-size: 13px; opacity: 1; }

/* 国策流派 */
.spec-tip {
  font-size: 12px;
  color: var(--c-gold-light);
  opacity: .7;
  text-align: center;
  letter-spacing: 1px;
  margin: 0 0 6px;
}
.spec-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.spec-card {
  position: relative;
  padding: 8px 4px;
  background: var(--panel-bg-deep);
  border: 1.5px solid rgba(232, 196, 104, .55);
  text-align: center;
  cursor: pointer;
  font-family: inherit;
  color: var(--c-gold-light);
  transition: transform .15s;
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .1),
    inset 0 0 14px rgba(0, 0, 0, .55);
  border-radius: var(--r-sm);
}
.spec-card:hover { transform: translateY(-2px); }
.spec-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-bottom: 2px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .55));
}
.spec-name {
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 2px 0;
  text-shadow: 0 0 6px rgba(0, 0, 0, .75), 0 1px 2px rgba(0, 0, 0, .85);
}
.spec-title {
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 3px;
  color: var(--c-gold-light);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.spec-desc {
  font-size: 12px;
  color: var(--c-gold-light);
  opacity: .75;
  margin: 3px 0 2px;
  letter-spacing: 1px;
}
.spec-flavor {
  font-size: 12px;
  color: var(--c-gold);
  letter-spacing: 1px;
  font-style: italic;
  margin-bottom: 3px;
  opacity: .85;
}
.spec-preview {
  font-size: 12px;
  color: #b3e5a3;
  font-family: var(--font-num);
  line-height: 1.4;
  min-height: 24px;
}
.spec-preview .ppl { margin-right: 2px; }

.spec-detail {
  border: 1.5px solid var(--c-gold);
  padding: 8px;
  background: var(--panel-bg-deep);
  border-radius: var(--r-sm);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 18px rgba(0, 0, 0, .55);
  color: var(--c-gold-light);
}
.spec-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.head-icon {
  display: inline-flex;
  align-items: center;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .55));
}
.head-meta { flex: 1; }
.head-name {
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 3px;
  font-weight: 700;
  text-shadow: 0 0 6px rgba(0, 0, 0, .75), 0 1px 2px rgba(0, 0, 0, .85);
}
.head-sub {
  font-size: 12px;
  color: var(--c-gold-light);
  opacity: .7;
  letter-spacing: 1px;
}
.dismiss-spec {
  background: rgba(0, 0, 0, .35);
  border: 1px solid rgba(232, 196, 104, .5);
  color: var(--c-gold-light);
  width: 22px;
  height: 22px;
  font-size: 15px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  border-radius: var(--r-sm);
}
.dismiss-spec:hover {
  color: #ff8a78;
  border-color: var(--c-red);
  background: rgba(168, 35, 26, .25);
}

.stage-track {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
  margin-bottom: 6px;
}
.stage-cell {
  border: 1px solid rgba(232, 196, 104, .4);
  padding: 4px 2px;
  text-align: center;
  font-size: 12px;
  letter-spacing: 1px;
  transition: all .25s;
  background: rgba(0, 0, 0, .35);
  color: var(--c-gold-light);
  opacity: .65;
  border-radius: var(--r-sm);
}
.stage-cell .cell-no { font-family: var(--font-title); font-size: 13px; }
.stage-cell .cell-name { font-size: 12px; margin-top: 1px; }
.stage-cell.done {
  box-shadow: 0 0 8px rgba(212, 175, 55, .65);
  font-weight: 700;
  opacity: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}

.spec-effect-box {
  background: rgba(0, 0, 0, .45);
  border: 1px dashed rgba(232, 196, 104, .55);
  padding: 5px 8px;
  margin-bottom: 6px;
  min-height: 30px;
  border-radius: var(--r-sm);
}
.ef-line {
  font-size: 13px;
  color: var(--c-gold-light);
  letter-spacing: 1px;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.ef-line.muted { color: var(--c-gold-light); opacity: .55; font-style: italic; }

.next-stage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 0 0;
  border-top: 1px dashed rgba(232, 196, 104, .45);
}
.next-info {
  font-size: 13px;
  color: var(--c-gold-light);
  flex: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.next-info b {
  color: #ff8a78;
  font-family: var(--font-title);
  letter-spacing: 1px;
}
.next-info .cost {
  display: block;
  font-size: 12px;
  color: var(--c-gold);
  opacity: .85;
  font-family: var(--font-num);
  margin-top: 1px;
}
.advance-btn {
  font-size: 13px;
  padding: 4px 10px;
  letter-spacing: 2px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.done-stage {
  text-align: center;
  font-family: var(--font-title);
  letter-spacing: 4px;
  color: var(--c-gold-light);
  font-size: 14px;
  padding: 6px 0;
  text-shadow: 0 0 8px rgba(212, 175, 55, .65), 0 1px 2px rgba(0, 0, 0, .85);
}

/* 治理仪表 */
.gov-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}
.gov-item {
  background: rgba(0, 0, 0, .35);
  border: 1px solid rgba(232, 196, 104, .4);
  padding: 5px 7px;
  border-radius: var(--r-sm);
}
.gov-head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}
.gov-icon { display: inline-flex; align-items: center; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, .55)); }
.gov-label {
  font-family: var(--font-title);
  letter-spacing: 2px;
  color: var(--c-gold-light);
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.gov-val {
  margin-left: auto;
  font-size: 14px;
  color: var(--c-gold-light);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.gov-track {
  position: relative;
  height: 7px;
  background: rgba(0, 0, 0, .55);
  border: 1px solid rgba(232, 196, 104, .4);
  margin: 4px 0 3px;
  border-radius: var(--r-sm);
  overflow: hidden;
}
.gov-fill {
  height: 100%;
  transition: width .35s, background .25s;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .25);
}
.gov-mark {
  position: absolute;
  top: -1px; bottom: -1px;
  width: 1px;
  background: rgba(255, 240, 200, .45);
  pointer-events: none;
}
.gov-desc {
  font-size: 12px;
  color: var(--c-gold);
  letter-spacing: 1px;
  font-style: italic;
  opacity: .85;
}
.gov-foot {
  border-top: 1px dashed rgba(232, 196, 104, .45);
  padding-top: 5px;
}
.gov-mul {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: var(--c-gold-light);
  opacity: .85;
  margin-bottom: 3px;
}
.mul-pill {
  background: rgba(0, 0, 0, .45);
  border: 1px solid rgba(232, 196, 104, .4);
  padding: 1px 6px;
  font-family: var(--font-num);
  color: var(--c-gold-light);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border-radius: var(--r-sm);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
}
.gov-tip {
  margin: 0;
  font-size: 12px;
  color: var(--c-gold-light);
  opacity: .7;
  letter-spacing: 1px;
  line-height: 1.5;
}
</style>
