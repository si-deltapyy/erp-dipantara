<script setup lang="ts">
import { ref, watch, onScopeDispose } from 'vue'
import { useI18n } from 'vue-i18n'
import AppBrand from './AppBrand.vue'
import AppNavigation from './AppNavigation.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const dialog = ref<HTMLDialogElement>()
let previousOverflow = ''

function close(): void {
    dialog.value?.close()
    emit('close')
}

function synchronize(): void {
    if (props.open) {
        previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        dialog.value?.showModal()
        return
    }
    dialog.value?.close()
    document.body.style.overflow = previousOverflow
}

function handleBreakpoint(event: MediaQueryListEvent): void {
    if (event.matches) close()
}

function retainFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return
    const controls = dialog.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    const first = controls?.[0]
    const last = controls?.[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
    }
}

const desktop = window.matchMedia('(min-width: 1024px)')
desktop.addEventListener('change', handleBreakpoint)
watch(() => props.open, synchronize, { flush: 'post' })
onScopeDispose(() => {
    desktop.removeEventListener('change', handleBreakpoint)
    document.body.style.overflow = previousOverflow
})
</script>

<template>
    <dialog
        id="mobile-navigation"
        ref="dialog"
        :aria-label="t('navigation.label')"
        class="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[90vw] border-0 bg-white p-0 text-ink backdrop:bg-ink/40"
        @cancel.prevent="close"
        @keydown="retainFocus"
        @click="$event.target === dialog && close()"
    >
        <div class="min-h-full p-1">
            <div class="flex items-center justify-between gap-2 px-4 py-6">
                <AppBrand />
                <button
                    type="button"
                    class="icon-button"
                    :aria-label="t('navigation.close')"
                    @click="close"
                >
                    <AppIcon name="close" />
                </button>
            </div>
            <AppNavigation @navigate="close" />
        </div>
    </dialog>
</template>
