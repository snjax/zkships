import { createApp } from 'vue'
import * as VueRouter from 'vue-router';

import App from './App.vue'
import Home from './components/Home.vue'
import ProverPage from './components/ProverPage.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/prover', component: ProverPage },
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes,
})

createApp(App)
  .use(router)
  .mount('#app')
