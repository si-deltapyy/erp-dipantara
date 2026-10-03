<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
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
    const field = emailError.value ? 'login-email' : passwordError.value ? 'login-password' : ''
    if (field) document.getElementById(field)?.focus()
    else summary.value?.focus()
}
</script>
<template>
    <div class="space-y-6">
        <AppPageHeader :title="t('auth.title')" :description="t('workspace.accessDescription')" />
        <p v-if="route.query.expired" role="status" class="text-sm text-muted">
            {{ t('auth.expired') }}
        </p>
        <form class="space-y-5" novalidate @submit.prevent="submitForm">
            <div
                v-if="emailError || passwordError || error"
                ref="summary"
                tabindex="-1"
                role="alert"
                class="space-y-2 rounded-md border border-danger/20 bg-danger-light p-4 text-sm text-danger"
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
                name="email"
                maxlength="255"
                required
                :label="t('auth.email')"
                type="email"
                autocomplete="username"
                :disabled="pending"
                :error="emailError ? errorText(emailError) : undefined"
            />
            <AppTextInput
                id="login-password"
                v-model="password"
                name="password"
                required
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
