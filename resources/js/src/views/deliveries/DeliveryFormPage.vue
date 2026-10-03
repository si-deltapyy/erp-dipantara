<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import DeliveryEditor from './components/DeliveryEditor.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
const { t } = useI18n()
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <AppPageHeader :title="t('deliveries.add')"
            ><template #actions
                ><RouterLink
                    :to="{ name: 'deliveries', query: $route.query }"
                    class="secondary-button"
                    >{{ t('deliveries.back') }}</RouterLink
                ></template
            ></AppPageHeader
        >
        <DeliveryEditor />
    </section>
</template>
