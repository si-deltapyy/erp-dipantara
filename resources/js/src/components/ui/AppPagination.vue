<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'
const props = defineProps<{ page: number; pageSize: number; total: number; disabled?: boolean }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()
const { t } = useI18n()
const pages = computed(() =>
    Math.max(1, Math.ceil(Math.max(0, props.total) / Math.max(1, props.pageSize))),
)
const current = computed(() => Math.min(pages.value, Math.max(1, props.page)))
function change(page: number): void {
    if (!props.disabled) emit('update:page', Math.min(pages.value, Math.max(1, page)))
}
</script>
<template>
    <nav :aria-label="t('ui.pagination')" class="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" class="text-sm text-muted">
            {{ t('ui.page', { page: current, pages }) }}
        </p>
        <div class="flex gap-2">
            <AppButton
                variant="secondary"
                :disabled="disabled || current <= 1"
                @click="change(current - 1)"
                >{{ t('ui.previous') }}</AppButton
            >
            <AppButton
                variant="secondary"
                :disabled="disabled || current >= pages"
                @click="change(current + 1)"
                >{{ t('ui.next') }}</AppButton
            >
        </div>
    </nav>
</template>
