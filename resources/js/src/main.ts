import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from '@/router'
import { i18n } from '@/locales'
import '@/assets/css/app.css'

const app = createApp(App).use(createPinia()).use(i18n).use(router)

void router.isReady().then(() => app.mount('#app'))
