<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import FormLab from './components/FormLab.vue'
import TableLab from './components/TableLab.vue'
import DialogLab from './components/DialogLab.vue'
import SessionLab from './components/SessionLab.vue'
const { t } = useI18n()
</script>
<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-2xl font-bold">{{ t('ui.title') }}</h1>
            <p class="mt-2 text-sm text-muted">{{ t('ui.description') }}</p>
        </div>
        <div class="grid items-start gap-6 xl:grid-cols-2"><FormLab /><DialogLab /></div>
        <TableLab />
        <SessionLab />
    </div>
</template>
