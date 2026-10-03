<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
    const token = route.query.token as string

    if (!token) {
        errorMessage.value = 'Token tidak ditemukan dari autentikasi Google.'
        loading.value = false
        return
    }

    try {
        localStorage.setItem('auth_token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const userResponse = await axios.get('http://127.0.0.1:8000/api/v1/profile')
        localStorage.setItem('user', JSON.stringify(userResponse.data.data))
        router.push({ name: 'dashboard' })
    } catch (error) {
        console.error('Gagal memproses autentikasi:', error)
        errorMessage.value = 'Gagal memverifikasi akun ke server.'
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md text-center">
            <div v-if="loading" class="space-y-4">
                <div
                    class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-strong border-t-transparent"
                ></div>
                <p class="text-sm font-medium text-gray-600">Memproses Login Google...</p>
            </div>

            <div v-else-if="errorMessage" class="space-y-4">
                <div class="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                    {{ errorMessage }}
                </div>
                <button
                    class="w-full rounded-md bg-primary-strong px-4 py-2 text-sm font-medium text-white shadow hover:bg-opacity-90"
                    @click="router.push('/login')"
                >
                    Kembali ke Login
                </button>
            </div>
        </div>
    </div>
</template>
