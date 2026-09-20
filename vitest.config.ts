import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./resources/js/src', import.meta.url)) } },
    test: {
        environment: 'jsdom',
        include: ['resources/js/src/**/*.test.ts'],
        restoreMocks: true,
        clearMocks: true,
    },
})
