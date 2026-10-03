<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import WorkspaceBrand from '@/components/layout/WorkspaceBrand.vue'
const { t } = useI18n()
</script>

<template>
    <main class="woodflow-theme wf-auth">
        <div class="wf-auth-container">
            <WorkspaceBrand />
            <div class="panel wf-auth-panel"><RouterView /></div>
            <p class="wf-auth-footer">{{ t('shell.footer') }}</p>
        </div>
    </main>
</template>
