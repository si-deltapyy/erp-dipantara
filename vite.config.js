import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'
import { resolveAdapterModes } from './resources/js/src/core/constants/adapter-modes'

export default defineConfig(({ command, mode }) => {
    const environment = loadEnv(mode, process.cwd(), 'VITE_')
    const adapters = resolveAdapterModes(true, environment)
    const hasMock = adapters.auth === 'mock' || Object.values(adapters.domains).includes('mock')
    if (hasMock && (command === 'build' || process.env.NODE_ENV === 'production')) {
        throw new Error('Mock mode is restricted to development and tests')
    }
    return {
        resolve: { alias: { '@': fileURLToPath(new URL('./resources/js/src', import.meta.url)) } },
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.js', 'resources/js/src/main.ts'],
                refresh: true,
            }),
            vue(),
        ],
    }
})
