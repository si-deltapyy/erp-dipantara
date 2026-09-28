import { configureReports } from '@/composables/configureReports'
import { configureDashboard } from '@/composables/configureDashboard'
import { configureClosings } from '@/composables/configureClosings'
import { configurePayments } from '@/composables/configurePayments'
import { configureDeliveries } from '@/composables/configureDeliveries'
import { configureGradings } from '@/composables/configureGradings'
import { configureInvoices } from '@/composables/configureInvoices'
import { configureAssignments } from '@/composables/configureAssignments'
import { configureOrders } from '@/composables/configureOrders'
import { configurePurchaseOrders } from '@/composables/configurePurchaseOrders'
import { configureDocuments } from '@/composables/configureDocuments'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from '@/router'
import { i18n } from '@/locales'
import '@/assets/css/app.css'
import { configureSession } from '@/composables/configureSession'
import { createHttpSession } from '@/api/adapters/session-http'
import { configureTimberProducts } from '@/composables/configureTimberProducts'
import { configureBankAccounts } from '@/composables/configureBankAccounts'
import { configureGraders } from '@/composables/configureGraders'
import { configureMitras } from '@/composables/configureMitras'
import { configureBuyers } from '@/composables/configureBuyers'

async function start(): Promise<void> {
    const pinia = createPinia()
    const app = createApp(App).use(pinia).use(i18n)
    configureSession(app, pinia, router, createHttpSession())
    await configureDeliveries(app, pinia)
    await configureGradings(app, pinia)
    await configureOrders(app, pinia)
    await configureAssignments(app, pinia)
    await configureInvoices(app, pinia)
    await configureClosings(app, pinia)
    await configureDashboard(app)
    await configureReports(app)
    await configurePayments(app, pinia)
    await configurePurchaseOrders(app, pinia)
    await configureDocuments(app, pinia)
    await configureBuyers(app, pinia)
    await configureMitras(app, pinia)
    await configureGraders(app, pinia)
    await configureBankAccounts(app, pinia)
    await configureTimberProducts(app, pinia)
    app.use(router).mount('#app')
}
void start()
