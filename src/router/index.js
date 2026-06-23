import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'study',
    component: () => import('../views/StudyView.vue'),
    meta: { title: '书房', iconKind: 'tab', iconId: 'study' }
  },
  {
    path: '/city',
    name: 'city',
    component: () => import('../views/CityView.vue'),
    meta: { title: '城池', icon: '🏯', iconKind: 'tab', iconId: 'city' }
  },
  {
    path: '/heroes',
    name: 'heroes',
    component: () => import('../views/HeroesView.vue'),
    meta: { title: '武将', icon: '⚔️', iconKind: 'tab', iconId: 'heroes' }
  },
  {
    path: '/battle',
    name: 'battle',
    component: () => import('../views/BattleView.vue'),
    meta: { title: '出征', icon: '🐎', iconKind: 'tab', iconId: 'battle' }
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('../views/MapView.vue'),
    meta: { title: '天下', icon: '🗺️', iconKind: 'tab', iconId: 'map' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: '主公', icon: '👑', iconKind: 'tab', iconId: 'profile' }
  },
  {
    path: '/chronicle',
    name: 'chronicle',
    component: () => import('../views/ChronicleView.vue'),
    meta: { title: '史册', iconKind: 'misc', iconId: 'scroll' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
