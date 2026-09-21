<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

const { t } = useI18n()
</script>

<template>
    <RouterLink :to="{ name: 'home' }" class="flex min-h-11 items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <AppIcon name="layers" :size="24" />
        </span>
        <span>
            <span class="block text-xl font-bold tracking-tight">{{ t('brand.name') }}</span>
            <span class="block text-[10px] font-semibold tracking-[0.16em] text-muted">{{
                t('brand.company')
            }}</span>
        </span>
    </RouterLink>
</template>
