<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog } from '@/composables/useDialog'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
    defineProps<{ open: boolean; title: string; side?: 'left' | 'right' }>(),
    { side: 'right' },
)
defineEmits<{ close: [] }>()
const { t } = useI18n()
const titleId = useId()
const dialog = ref<HTMLDialogElement>()
const { retainFocus } = useDialog(
    dialog,
    () => props.open,
    () => '[data-drawer-close]',
)
</script>

<template>
    <dialog
        ref="dialog"
        :aria-labelledby="titleId"
        class="wf-drawer"
        :class="`wf-drawer--${side}`"
        @cancel.prevent="$emit('close')"
        @keydown="retainFocus"
    >
        <header class="wf-drawer-heading">
            <h2 :id="titleId">{{ title }}</h2>
            <button
                type="button"
                class="wf-icon-button"
                data-drawer-close
                :aria-label="t('ui.close')"
                @click="$emit('close')"
            >
                <AppIcon name="close" />
            </button>
        </header>
        <slot />
    </dialog>
</template>
