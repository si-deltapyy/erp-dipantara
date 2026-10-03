<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import GradingEditor from './components/GradingEditor.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
const { t } = useI18n()
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <AppPageHeader :title="t('gradings.add')"
            ><template #actions
                ><RouterLink
                    :to="{ name: 'gradings', query: $route.query }"
                    class="secondary-button"
                    >{{ t('gradings.back') }}</RouterLink
                ></template
            ></AppPageHeader
        >
        <GradingEditor />
    </section>
</template>
