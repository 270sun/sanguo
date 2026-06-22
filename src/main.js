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
})

app.mount('#app')
