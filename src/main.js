import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useGameStore } from './stores/game'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const game = useGameStore()
game.loadFromLocal()
game.startTick()

window.addEventListener('beforeunload', () => {
  game.saveToLocal()
  game.stopTick()
})

// Vite HMR：模块热替换前先停掉旧的 setInterval，避免热更后多个 tick 叠加
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.stopTick()
  })
}

app.mount('#app')

/**
 * 路由背景图预热：mount 后空闲时段提前 fetch 6 张大背景图，
 * 让用户切换路由时图片已在内存缓存中，避免肉眼可见的白闪/loading。
 * 用 requestIdleCallback 兜底 setTimeout，确保不抢首屏关键资源。
 */
function _preloadRouteBackgrounds() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/')
  const files = ['city', 'heroes', 'battle', 'map', 'profile', 'chronicle']
  for (const name of files) {
    const img = new Image()
    img.decoding = 'async'
    img.src = `${base}img/bg/${name}.png`
  }
}
const _schedulePreload =
  typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
    ? (cb) => window.requestIdleCallback(cb, { timeout: 3000 })
    : (cb) => setTimeout(cb, 1500)
_schedulePreload(_preloadRouteBackgrounds)
