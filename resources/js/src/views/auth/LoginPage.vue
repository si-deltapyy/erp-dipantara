<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import { useLoginForm } from './composables/useLoginForm'
const { t, te } = useI18n()
const route = useRoute()
const summary = ref<HTMLElement>()
const { email, password, emailError, passwordError, error, pending, submit } = useLoginForm()
function errorText(value: string): string {
    return te(value) ? t(value) : value
}
async function submitForm(): Promise<void> {
    await submit()
    await nextTick()
    summary.value?.focus()
}
</script>
<template>
    <div class="space-y-6">
        <div>
            <h1 class="mt-4 text-2xl font-bold">{{ t('auth.title') }}</h1>
            <p class="mt-2 text-sm leading-6 text-muted">
                {{ t('auth.liveIntroduction') }}
            </p>
        </div>
        <p v-if="route.query.expired" role="status" class="text-sm text-muted">
            {{ t('auth.expired') }}
        </p>
        <form class="space-y-5" novalidate @submit.prevent="submitForm">
            <div
                v-if="emailError || passwordError || error"
                ref="summary"
                tabindex="-1"
                role="alert"
                class="space-y-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
                <p>{{ error ? t(error) : t('auth.errors') }}</p>
                <a v-if="emailError" href="#login-email" class="block underline">{{
                    errorText(emailError)
                }}</a>
                <a v-if="passwordError" href="#login-password" class="block underline">{{
                    errorText(passwordError)
                }}</a>
            </div>
            <AppTextInput
                id="login-email"
                v-model="email"
                :label="t('auth.email')"
                type="email"
                autocomplete="username"
                :disabled="pending"
                :error="emailError ? errorText(emailError) : undefined"
            />
            <AppTextInput
                id="login-password"
                v-model="password"
                :label="t('auth.livePassword')"
                type="password"
                autocomplete="current-password"
                :disabled="pending"
                :error="passwordError ? errorText(passwordError) : undefined"
            />
            <AppButton type="submit" :pending="pending" class="w-full">{{
                t('auth.submit')
            }}</AppButton>
        </form>
    </div>
</template>
