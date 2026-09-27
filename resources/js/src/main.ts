import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from '@/router'
import { i18n } from '@/locales'
import { mockEnabled, businessMockEnabled } from '@/core/constants/environment'
import '@/assets/css/app.css'
import { configureSession } from '@/composables/configureSession'
import { createHttpSession } from '@/api/adapters/session-http'
import { configureTimberProducts } from '@/composables/configureTimberProducts'
import { configureMitras } from '@/composables/configureMitras'
import { configureBuyers } from '@/composables/configureBuyers'

async function start(): Promise<void> {
    const pinia = createPinia()
    const app = createApp(App).use(pinia).use(i18n)
    if (mockEnabled) {
        const { configureMockSession } = await import('@/composables/configureMockSession')
        configureMockSession(app, pinia, router)
    } else {
        configureSession(app, pinia, router, createHttpSession())
    }
    if (import.meta.env.DEV && businessMockEnabled) {
        const { configureDemo } = await import('@/composables/configureDemo')
        configureDemo(app)
    }
    await configureBuyers(app, pinia)
    await configureMitras(app, pinia)
    await configureTimberProducts(app, pinia)
    app.use(router).mount('#app')
}
void start()
