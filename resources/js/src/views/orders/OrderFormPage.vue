<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import OrderEditor from './components/OrderEditor.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
const { t } = useI18n()
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <AppPageHeader :title="t('orders.add')"
            ><template #actions
                ><RouterLink
                    :to="{ name: 'orders', query: $route.query }"
                    class="secondary-button"
                    >{{ t('orders.back') }}</RouterLink
                ></template
            ></AppPageHeader
        >
        <OrderEditor />
    </section>
</template>
