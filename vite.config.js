import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command, mode }) => {
    const environment = loadEnv(mode, process.cwd(), 'VITE_')
    const adapter = environment.VITE_API_MODE ?? 'http'
    if (!['http', 'mock'].includes(adapter)) {
        throw new Error('VITE_API_MODE must be http or mock')
    }
    if (adapter === 'mock' && (command === 'build' || process.env.NODE_ENV === 'production')) {
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
