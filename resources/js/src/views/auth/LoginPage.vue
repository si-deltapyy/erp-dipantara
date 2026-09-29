<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import axios from 'axios' // 1. Import axios
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import { defineAsyncComponent } from 'vue'
import { mockEnabled } from '@/core/constants/environment'

const SessionControls = mockEnabled
    ? defineAsyncComponent(() => import('./components/SessionControls.vue'))
    : undefined

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
            <span
                v-if="mockEnabled"
                class="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-strong"
                >{{ t('shell.mock') }}</span
            >
            <h1 class="mt-4 text-2xl font-bold">{{ t('auth.title') }}</h1>
            <p class="mt-2 text-sm leading-6 text-muted">
                {{ t(mockEnabled ? 'auth.introduction' : 'auth.liveIntroduction') }}
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
                :label="t(mockEnabled ? 'auth.password' : 'auth.livePassword')"
                type="password"
                :autocomplete="mockEnabled ? 'off' : 'current-password'"
                :hint="mockEnabled ? t('auth.passwordHint') : undefined"
                :disabled="pending || googlePending"
                :error="passwordError ? errorText(passwordError) : undefined"
            />

            <AppButton type="submit" :pending="pending || googlePending" class="w-full">{{
                t('auth.submit')
            }}</AppButton>
        </form>

        <!-- Divider / Pemisah -->
        <div class="relative my-4 flex items-center justify-center">
            <div class="w-full border-t border-gray-300"></div>
            <span class="absolute bg-white px-3 text-xs text-muted">atau</span>
        </div>

        <!-- Tombol Login Google -->
        <button
            type="button"
            :disabled="pending || googlePending"
            class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-strong focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            @click="loginWithGoogle"
        >
            <!-- Icon Google SVG -->
            <svg class="h-5 w-5" viewBox="0 0 24 24">
                <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
            </svg>
            <span>Masuk dengan Google</span>
        </button>

        <p v-if="mockEnabled" class="text-xs leading-5 text-muted">{{ t('auth.mockNotice') }}</p>

        <component
            :is="SessionControls"
            v-if="SessionControls"
            accounts
            @account="email = $event"
        />
    </div>
</template>