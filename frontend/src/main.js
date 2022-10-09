import { createApp } from 'vue'
import * as VueRouter from 'vue-router';
import { createPinia } from 'pinia'

import App from './App.vue'
import MainGame from './views/MainGame.vue'
import ProverPage from './views/ProverPage.vue'
import ChooseWallet from './views/ChooseWallet.vue'
import GameLobby from './views/GameLobby.vue'
import NotFound from './views/NotFound.vue'

import './assets/styles/index.scss'

const routes = [
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  { path: '/', component: ChooseWallet },
  { path: '/game/:id', name: 'game', component: MainGame },
  { path: '/prover', component: ProverPage },
  { path: '/lobby', component: GameLobby },
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes,
})

const pinia = createPinia()

createApp(App)
  .use(pinia)
  .use(router)
  .mount('#app')
