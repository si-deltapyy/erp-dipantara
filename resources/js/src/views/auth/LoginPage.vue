<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import axios from 'axios' // 1. Import axios
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import { useLoginForm } from './composables/useLoginForm'

const { t, te } = useI18n()
const route = useRoute()
const summary = ref<HTMLElement>()
const { email, password, emailError, passwordError, error, pending, submit } = useLoginForm()

// 2. State loading khusus tombol Google
const googlePending = ref(false)

function errorText(value: string): string {
    return te(value) ? t(value) : value
}

async function submitForm(): Promise<void> {
    await submit()
    await nextTick()
    summary.value?.focus()
}

// 3. Method untuk mengarahkan user ke OAuth Google via Laravel API
async function loginWithGoogle(): Promise<void> {
    try {
        googlePending.value = true
        // Panggil endpoint Laravel yang mengembalikan OAuth Redirect URL
        const response = await axios.get('http://127.0.0.1:8000/api/v1/auth/google')
        
        // Redirect browser pengguna ke URL OAuth Google
        if (response.data?.url) {
            window.location.href = response.data.url
        }
    } catch (err) {
        console.error('Gagal memuat URL OAuth Google:', err)
    } finally {
        googlePending.value = false
    }
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
                :disabled="pending || googlePending"
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

            <AppButton type="submit" :pending="pending || googlePending" class="w-full">{{
                t('auth.submit')
            }}</AppButton>
        </form>
    </div>
</template>