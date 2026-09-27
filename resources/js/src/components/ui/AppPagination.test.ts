import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPagination from './AppPagination.vue'
import { i18n } from '@/locales'

test('clamps invalid page bounds and disables empty pagination', async () => {
    const wrapper = mount(AppPagination, {
        props: { page: 9, pageSize: 3, total: 0 },
        global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('Halaman 1 dari 1')
    expect(
        wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined),
    ).toBe(true)
    await wrapper.setProps({ total: 7, page: 1 })
    await wrapper.findAll('button')[1]?.trigger('click')
    expect(wrapper.emitted('update:page')?.[0]).toEqual([2])
    expect(wrapper.props('page')).toBe(1)
    await wrapper.setProps({ disabled: true })
    await wrapper.findAll('button')[1]?.trigger('click')
    expect(wrapper.emitted('update:page')).toHaveLength(1)
})
