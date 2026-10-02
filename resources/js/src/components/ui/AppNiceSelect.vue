<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { bind } from 'nice-select2'
import 'nice-select2/src/scss/nice-select2.scss'
import type NiceSelect from 'nice-select2'

const props = defineProps<{
    id: string
    label: string
    modelValue: string
    options: readonly { value: string; label: string }[]
    error?: string
    disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const select = ref<HTMLSelectElement>()
let instance: NiceSelect | undefined
let observer: MutationObserver | undefined

function update(event: Event): void {
    if (event.target instanceof HTMLSelectElement) emit('update:modelValue', event.target.value)
}
function synchronizeAccessibility(): void {
    if (!instance) return
    const dropdown = instance.dropdown
    dropdown.id = `${props.id}-control`
    dropdown.setAttribute('role', 'combobox')
    dropdown.setAttribute('aria-label', props.label)
    dropdown.setAttribute('aria-expanded', String(dropdown.classList.contains('open')))
    dropdown.setAttribute('aria-controls', `${props.id}-options`)
    dropdown.setAttribute('aria-haspopup', 'listbox')
    dropdown.setAttribute('aria-disabled', String(!!props.disabled))
    dropdown.setAttribute('aria-invalid', String(!!props.error))
    if (props.error) dropdown.setAttribute('aria-describedby', `${props.id}-error`)
    else dropdown.removeAttribute('aria-describedby')
    dropdown.tabIndex = props.disabled ? -1 : 0
    const list = dropdown.querySelector('ul')
    list?.setAttribute('id', `${props.id}-options`)
    list?.setAttribute('role', 'listbox')
    dropdown.querySelectorAll<HTMLElement>('.option').forEach((option, index) => {
        option.id = `${props.id}-option-${index}`
        option.setAttribute('role', 'option')
        option.setAttribute('aria-selected', String(option.classList.contains('selected')))
    })
    const focused = dropdown.querySelector('.option.focus')
    if (focused) dropdown.setAttribute('aria-activedescendant', focused.id)
    else dropdown.removeAttribute('aria-activedescendant')
}
function synchronize(): void {
    if (!select.value || !instance) return
    const focused = instance.dropdown.contains(document.activeElement)
    select.value.value = props.modelValue
    instance.update()
    synchronizeAccessibility()
    if (focused) instance.dropdown.focus()
}
onMounted(() => {
    if (!select.value) return
    instance = bind(select.value, { searchable: false })
    synchronize()
    observer = new MutationObserver(synchronizeAccessibility)
    observer.observe(select.value.parentElement ?? select.value, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
    })
})
watch(
    () => [props.modelValue, props.options, props.disabled, props.error, props.label],
    synchronize,
    {
        flush: 'post',
    },
)
onBeforeUnmount(() => {
    observer?.disconnect()
    instance?.destroy()
})
</script>

<template>
    <select
        :id="id"
        ref="select"
        class="selectize"
        :value="modelValue"
        :disabled="disabled"
        tabindex="-1"
        aria-hidden="true"
        @change="update"
    >
        <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
        </option>
    </select>
</template>
