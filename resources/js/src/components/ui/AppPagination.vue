<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'
const props = defineProps<{
    page: number
    pageSize: number
    total: number
    disabled?: boolean
    numbered?: boolean
}>()
const emit = defineEmits<{ 'update:page': [page: number] }>()
const { t } = useI18n()
const pages = computed(() =>
    Math.max(1, Math.ceil(Math.max(0, props.total) / Math.max(1, props.pageSize))),
)
const current = computed(() => Math.min(pages.value, Math.max(1, props.page)))
const visiblePages = computed(() => {
    const start = Math.max(1, Math.min(current.value - 2, pages.value - 4))
    const mobileStart = Math.max(1, Math.min(current.value - 1, pages.value - 2))
    return Array.from({ length: Math.min(5, pages.value) }, (_, offset) => ({
        number: start + offset,
        mobile: start + offset >= mobileStart && start + offset < mobileStart + 3,
    }))
})
function change(page: number): void {
    if (!props.disabled) emit('update:page', Math.min(pages.value, Math.max(1, page)))
}
</script>
<template>
    <nav
        :aria-label="t('ui.pagination')"
        class="flex flex-wrap items-center justify-between gap-3"
        :class="{ 'wf-pagination': numbered }"
    >
        <p aria-live="polite" :class="numbered ? 'sr-only' : 'text-sm text-muted'">
            {{ t('ui.page', { page: current, pages }) }}
        </p>
        <div class="flex gap-2" :class="{ 'wf-pagination-controls': numbered }">
            <AppButton
                variant="secondary"
                :disabled="disabled || current <= 1"
                @click="change(current - 1)"
                ><AppIcon
                    v-if="numbered"
                    name="chevron"
                    :size="16"
                    class="wf-pagination-previous"
                /><span :class="{ 'wf-pagination-label': numbered }">{{
                    t('ui.previous')
                }}</span></AppButton
            >
            <template v-if="numbered">
                <AppButton
                    v-for="entry in visiblePages"
                    :key="entry.number"
                    variant="secondary"
                    class="wf-pagination-number"
                    :class="{ 'wf-pagination-desktop': !entry.mobile }"
                    :aria-current="entry.number === current ? 'page' : undefined"
                    :aria-label="t('ui.page', { page: entry.number, pages })"
                    :disabled="disabled"
                    @click="change(entry.number)"
                    >{{ entry.number }}</AppButton
                >
            </template>
            <AppButton
                variant="secondary"
                :disabled="disabled || current >= pages"
                @click="change(current + 1)"
                ><span :class="{ 'wf-pagination-label': numbered }">{{ t('ui.next') }}</span
                ><AppIcon v-if="numbered" name="chevron" :size="16"
            /></AppButton>
        </div>
    </nav>
</template>
