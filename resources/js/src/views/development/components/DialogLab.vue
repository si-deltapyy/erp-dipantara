<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const { t } = useI18n()
const open = ref(false)
const confirmed = ref(false)
function confirm(): void {
    open.value = false
    confirmed.value = true
}
</script>
<template>
    <section class="panel space-y-4">
        <h2 class="text-lg font-bold">{{ t('ui.confirmTitle') }}</h2>
        <AppButton @click="open = true">{{ t('ui.open') }}</AppButton>
        <p v-if="confirmed" role="status" class="text-sm text-muted">{{ t('ui.confirmed') }}</p>
        <AppConfirmDialog
            :open="open"
            :title="t('ui.confirmTitle')"
            :description="t('ui.confirmDescription')"
            @cancel="open = false"
            @confirm="confirm"
        />
    </section>
</template>
