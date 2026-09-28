import closings from './closings'
import payments from './payments'
import invoices from './invoices'
import deliveries from './deliveries'
import gradings from './gradings'
import assignments from './assignments'
import orders from './orders'
import { createI18n } from 'vue-i18n'
import id from './id'
import documents from './documents'
import purchaseOrders from './purchase-orders'
import foundation from './foundation'
import demo from './demo'
import buyers from './buyers'
import graders from './graders'
import timberProducts from './timber-products'
import mitras from './mitras'
import bankAccounts from './bank-accounts'

export const i18n = createI18n({
    legacy: false,
    locale: 'id',
    fallbackLocale: 'id',
    messages: {
        id: {
            ...id,
            ...orders,
            ...invoices,
            ...payments,
            ...closings,
            ...deliveries,
            ...gradings,
            ...assignments,
            ...documents,
            ...purchaseOrders,
            ...foundation,
            ...demo,
            ...buyers,
            ...graders,
            ...mitras,
            ...timberProducts,
            ...bankAccounts,
        },
    },
})
