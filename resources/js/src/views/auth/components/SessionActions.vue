<script setup lang="ts">
import { ref } from 'vue'
import { normalizeApiError } from '@/services/api-error'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
const { t } = useI18n()
const router = useRouter()
const session = useSession()
const store = useSessionStore()
const failure = ref('')
async function logout(): Promise<void> {
    failure.value = ''
    try {
        if (await session.logout()) await router.replace({ name: 'login' })
    } catch (cause: unknown) {
        failure.value = normalizeApiError(cause).kind === 'csrf' ? 'auth.csrf' : 'auth.network'
    }
}
</script>
<template>
    <div class="flex flex-wrap items-center justify-end gap-2">
        <span v-if="store.user" class="max-w-32 truncate text-xs text-muted">{{
            store.user.displayName
        }}</span>
        <AppButton v-if="store.user" variant="secondary" :pending="store.pending" @click="logout">{{
            t('auth.logout')
        }}</AppButton>
        <p v-if="failure" role="alert" class="w-full text-xs text-red-700">
            {{ t(failure) }}
        </p>
    </div>
</template>
