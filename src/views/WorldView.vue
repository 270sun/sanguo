<template>
  <section class="view world-view">
    <div class="seg-bar">
      <button
        class="seg-btn"
        :class="{ active: mode === 'patrol' }"
        @click="setMode('patrol')"
      >
        <span class="seg-glyph">巡</span>
        <span class="seg-text">巡 视 疆 域</span>
      </button>
      <button
        class="seg-btn"
        :class="{ active: mode === 'battle' }"
        @click="setMode('battle')"
      >
        <span class="seg-glyph">征</span>
        <span class="seg-text">出 征 演 武</span>
      </button>
    </div>

    <PatrolPanel
      v-if="mode === 'patrol'"
      ref="patrolRef"
      @unowned-pick="onUnownedPick"
    >
      <template #map>
        <ChinaMap
          :owned-ids="game.territories"
          :cooldown="game.territoryCooldown"
          @pick="onPatrolPick"
        />
      </template>
    </PatrolPanel>

    <template v-else>
      <div v-if="availableCount > 0" class="map-stage-battle">
        <ChinaMap
          :owned-ids="game.territories"
          :cooldown="game.territoryCooldown"
          :selected-id="targetId"
          @pick="onBattleMapPick"
        />
      </div>
      <BattlePanel v-model:target-id="targetId" />
    </template>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { TERRITORIES } from '../data/territories'
import ChinaMap from '../components/ChinaMap.vue'
import PatrolPanel from './world/PatrolPanel.vue'
import BattlePanel from './world/BattlePanel.vue'

const route = useRoute()
const router = useRouter()
const game = useGameStore()

const mode = ref('patrol')
const targetId = ref('')
const patrolRef = ref(null)

const availableCount = computed(
  () => TERRITORIES.filter((t) => !game.territories.includes(t.id)).length
)

function syncFromQuery() {
  const q = route.query.mode
  mode.value = q === 'battle' ? 'battle' : 'patrol'
  const t = route.query.target
  if (t && typeof t === 'string') {
    targetId.value = t
  }
}

onMounted(syncFromQuery)
watch(() => route.query, syncFromQuery)

function setMode(m) {
  if (mode.value === m) return
  mode.value = m
  const query = { ...route.query, mode: m }
  if (m === 'patrol') delete query.target
  router.replace({ path: '/world', query })
}

function onPatrolPick(t) {
  if (patrolRef.value) patrolRef.value.handlePick(t)
}

function onUnownedPick(id) {
  targetId.value = id
  mode.value = 'battle'
  router.replace({ path: '/world', query: { mode: 'battle', target: id } })
}

function onBattleMapPick(t) {
  if (!t) return
  if (game.territories.includes(t.id)) return
  targetId.value = t.id
}
</script>

<style scoped>
.world-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seg-bar {
  display: flex;
  align-items: stretch;
  gap: 6px;
  padding: 4px;
  background: var(--panel-bg-deep);
  border: 1px solid rgba(232, 196, 104, .55);
  border-radius: var(--r-sm);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 200, .12),
    inset 0 0 14px rgba(0, 0, 0, .55),
    0 2px 0 #0e0703,
    0 3px 6px rgba(0, 0, 0, .5);
}
.seg-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(20, 10, 4, .55);
  border: 1px solid rgba(232, 196, 104, .35);
  color: var(--c-gold-light);
  cursor: pointer;
  border-radius: var(--r-sm);
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
  transition: all .15s;
}
.seg-btn:hover {
  border-color: var(--c-gold);
  color: #fff1c2;
}
.seg-btn.active {
  background: linear-gradient(180deg, rgba(80, 48, 18, .92), rgba(35, 18, 8, .95));
  border-color: var(--c-gold);
  color: #fff1c2;
  box-shadow:
    0 0 12px rgba(232, 196, 104, .55),
    inset 0 0 0 1px rgba(255, 240, 200, .25);
}
.seg-glyph {
  font-family: var(--font-title);
  font-size: 16px;
  letter-spacing: 0;
  color: var(--c-gold);
  text-shadow: 0 0 6px rgba(232, 196, 104, .55), 0 1px 2px rgba(0, 0, 0, .85);
}
.seg-btn.active .seg-glyph { color: #ffd86b; }
.seg-text { color: inherit; }

.map-stage-battle { width: 100%; margin-bottom: 4px; }
.map-stage-battle :deep(.china-map) { width: 100%; }
</style>