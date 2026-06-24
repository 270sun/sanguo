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
