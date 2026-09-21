import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { it, expect, vi, afterEach } from 'vitest'
import MockLabPage from './MockLabPage.vue'
import id from '@/locales/id'

afterEach(() => vi.useRealTimers())

it('renders loading, field validation, retry, and clears timers on unmount', async () => {
    vi.useFakeTimers()
    const wrapper = mount(MockLabPage, {
        global: { plugins: [createI18n({ legacy: false, locale: 'id', messages: { id } })] },
    })
    expect(wrapper.text()).toContain('Memuat sampel')
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(wrapper.text()).toContain('Sampel sintetis 001')
    await wrapper.get('select').setValue('validation')
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(wrapper.get('select').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#scenario-error').text()).toBe(id.lab.validation)
    await wrapper.get('select').setValue('success')
    await vi.runAllTimersAsync()
    await flushPromises()
    expect(wrapper.find('#scenario-error').exists()).toBe(false)
    await wrapper.get('select').setValue('slow')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
})
