import { defineConfig } from '@playwright/test'
import { randomBytes } from 'node:crypto'

const production = process.env.E2E_PRODUCTION === 'true'

export default defineConfig({
    testDir: './tests/frontend/e2e',
    globalTeardown: './tests/frontend/global-teardown.ts',
    fullyParallel: true,
    workers: 2,
    timeout: 60000,
    expect: { timeout: 15000 },
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:8011',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'desktop',
            use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
        },
        { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    ],
    webServer: [
        {
            command: 'php artisan serve --host=127.0.0.1 --port=8011',
            url: 'http://127.0.0.1:8011/app',
            reuseExistingServer: false,
            env: {
                APP_ENV: 'testing',
                APP_DEBUG: 'false',
                APP_URL: 'http://127.0.0.1:8011',
                APP_KEY: 'base64:' + randomBytes(32).toString('base64'),
                SESSION_DRIVER: 'array',
                CACHE_STORE: 'array',
                DB_CONNECTION: 'sqlite',
                DB_DATABASE: ':memory:',
                DB_URL: '',
            },
        },
        ...(!production
            ? [
                  {
                      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
                      url: 'http://127.0.0.1:5174/@vite/client',
                      reuseExistingServer: false,
                      env: { VITE_API_MODE: 'mock', APP_URL: 'http://127.0.0.1:8011' },
                  },
              ]
            : []),
    ],
})
