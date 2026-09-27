<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import SessionControls from '@/views/auth/components/SessionControls.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const session = useSession()
const store = useSessionStore()
async function refresh(): Promise<void> {
    await session.refresh()
}
function expire(): void {
    session.expire()
}
</script>
<template>
    <section class="panel space-y-4">
        <SessionControls />
        <div class="flex flex-wrap gap-3">
            <AppButton variant="secondary" :pending="store.status === 'loading'" @click="refresh">{{
                t('auth.refresh')
            }}</AppButton>
            <AppButton variant="secondary" @click="expire">{{ t('auth.expire') }}</AppButton>
        </div>
    </section>
</template>
