<script setup lang="ts">
import { ref, onScopeDispose } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog } from '@/composables/useDialog'
import AppBrand from './AppBrand.vue'
import AppNavigation from './AppNavigation.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const dialog = ref<HTMLDialogElement>()
const { retainFocus } = useDialog(dialog, () => props.open)
function close(): void {
    emit('close')
}

function handleBreakpoint(event: MediaQueryListEvent): void {
    if (event.matches) close()
}

const desktop = window.matchMedia('(min-width: 1024px)')
desktop.addEventListener('change', handleBreakpoint)
onScopeDispose(() => {
    desktop.removeEventListener('change', handleBreakpoint)
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
