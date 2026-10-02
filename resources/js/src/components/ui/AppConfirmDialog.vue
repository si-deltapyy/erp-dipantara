<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'
defineProps<{ open: boolean; title: string; description: string; pending?: boolean }>()
defineEmits<{ cancel: []; confirm: [] }>()
const { t } = useI18n()
</script>
<template>
    <AppModal
        :open="open"
        :title="title"
        :busy="pending"
        initial-focus="[data-cancel]"
        @close="$emit('cancel')"
    >
        <p class="text-sm leading-6 text-muted">{{ description }}</p>
        <template #footer>
            <AppButton
                data-cancel
                variant="secondary"
                :disabled="pending"
                @click="$emit('cancel')"
                >{{ t('ui.cancel') }}</AppButton
            >
            <AppButton :pending="pending" @click="$emit('confirm')">{{
                t('ui.confirm')
            }}</AppButton>
        </template>
    </AppModal>
</template>
