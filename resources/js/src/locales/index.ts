import { createI18n } from 'vue-i18n'
import id from './id'
import foundation from './foundation'
import demo from './demo'
import buyers from './buyers'
import timberProducts from './timber-products'
import mitras from './mitras'

export const i18n = createI18n({
    legacy: false,
    locale: 'id',
    fallbackLocale: 'id',
    messages: { id: { ...id, ...foundation, ...demo, ...buyers, ...mitras, ...timberProducts } },
})
