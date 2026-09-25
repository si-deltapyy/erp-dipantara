<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog } from '@/composables/useDialog'
import AppButton from './AppButton.vue'
const props = defineProps<{ open: boolean; title: string; initialFocus?: string; busy?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const titleId = useId()
const dialog = ref<HTMLDialogElement>()
const { retainFocus } = useDialog(
    dialog,
    () => props.open,
    () => props.initialFocus,
)
function close(): void {
    if (!props.busy) emit('close')
}
</script>
<template>
    <dialog
        ref="dialog"
        tabindex="-1"
        :aria-labelledby="titleId"
        class="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-lg border-0 bg-white p-6 text-ink shadow-xl backdrop:bg-ink/40"
        @cancel.prevent="close"
        @keydown="retainFocus"
    >
        <div class="mb-6 flex items-center justify-between gap-4">
            <h2 :id="titleId" class="text-lg font-bold">{{ title }}</h2>
            <AppButton variant="secondary" :disabled="busy" @click="close">{{
                t('ui.close')
            }}</AppButton>
        </div>
        <slot />
        <div v-if="$slots.footer" class="mt-6 flex flex-wrap justify-end gap-3">
            <slot name="footer" />
        </div>
    </dialog>
</template>
