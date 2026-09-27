import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTextInput from './AppTextInput.vue'
import AppNumberInput from './AppNumberInput.vue'
import AppSelect from './AppSelect.vue'
import AppButton from './AppButton.vue'

test('connects labels and errors without mutating the parent value', async () => {
    const wrapper = mount(AppTextInput, {
        props: { id: 'email', label: 'Email', modelValue: '', error: 'Invalid', hint: 'Example' },
    })
    expect(wrapper.get('label').attributes('for')).toBe('email')
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('email-hint email-error')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    await wrapper.get('input').setValue('synthetic@woodflow.test')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['synthetic@woodflow.test'])
    expect(wrapper.props('modelValue')).toBe('')
    await wrapper.setProps({ error: undefined, hint: undefined })
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('false')
})

test('emits null for an empty number and emits a number for numeric input', async () => {
    const wrapper = mount(AppNumberInput, {
        props: { id: 'quantity', label: 'Quantity', modelValue: 1 },
    })
    await wrapper.get('input').setValue('')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
    await wrapper.get('input').setValue('12')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([12])
})

test('select emits a controlled value and connects validation', async () => {
    const wrapper = mount(AppSelect, {
        props: {
            id: 'category',
            label: 'Category',
            modelValue: 'one',
            options: [
                { value: 'one', label: 'One' },
                { value: 'two', label: 'Two' },
            ],
            error: 'Invalid',
        },
    })
    await wrapper.get('select').setValue('two')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['two'])
    expect(wrapper.props('modelValue')).toBe('one')
    expect(wrapper.get('select').attributes('aria-describedby')).toBe('category-error')
})

test('pending buttons cannot emit duplicate clicks and default to non-submit', async () => {
    const wrapper = mount(AppButton, { props: { pending: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.attributes('aria-busy')).toBe('true')
})
