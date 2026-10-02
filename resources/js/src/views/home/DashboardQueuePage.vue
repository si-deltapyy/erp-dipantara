<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('dashboard.queueTitle')">
            <template #actions>
                <RouterLink :to="{ name: 'home' }" class="text-sm text-primary underline">{{
                    t('dashboard.back')
                }}</RouterLink>
            </template>
        </AppPageHeader>
        <AppState class="panel" kind="empty" :message="t('dashboard.queueUnavailable')" />
    </section>
</template>
