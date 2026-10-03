<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
const { t } = useI18n()
</script>

<template>
    <div class="wf-brand">
        <span class="wf-brand-symbol"><AppIcon name="layers" :size="27" /></span>
        <div>
            <strong>{{ t('brand.name') }}</strong
            ><span>{{ t('brand.company') }}</span>
        </div>
    </div>
</template>
