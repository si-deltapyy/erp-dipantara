import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'

export default defineConfig(() => {
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
