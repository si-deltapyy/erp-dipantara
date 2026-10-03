import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ command, mode }) => {
    if (command !== 'serve') throw new Error('Use the existing Laravel configuration for builds.')
    const environment = { ...loadEnv(mode, root, 'DIPANTARA_'), ...process.env }
    if (!environment.DIPANTARA_API_ORIGIN)
        throw new Error(
            'Set DIPANTARA_API_ORIGIN in .env.staging.local before starting the preview.',
        )
    const upstream = new URL(environment.DIPANTARA_API_ORIGIN)
    if (
        upstream.protocol !== 'https:' ||
        upstream.username ||
        upstream.password ||
        upstream.pathname !== '/' ||
        upstream.search ||
        upstream.hash
    )
        throw new Error(
            'DIPANTARA_API_ORIGIN must be an HTTPS origin without credentials or a path.',
        )
    const certificate = environment.DIPANTARA_TLS_CERT
    const key = environment.DIPANTARA_TLS_KEY
    if (Boolean(certificate) !== Boolean(key))
        throw new Error('Set both DIPANTARA_TLS_CERT and DIPANTARA_TLS_KEY for local HTTPS.')
    const html = readFileSync(new URL('./staging-preview.html', import.meta.url), 'utf8')
    return {
        root,
        publicDir: false,
        appType: 'custom',
        resolve: { alias: { '@': fileURLToPath(new URL('./resources/js/src', import.meta.url)) } },
        plugins: [
            vue(),
            {
                name: 'staging-preview',
                configureServer(server) {
                    server.middlewares.use(async (request, response, next) => {
                        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
                        if (pathname !== '/dipantara' && !pathname.startsWith('/dipantara/'))
                            return next()
                        try {
                            const rendered = await server.transformIndexHtml(request.url, html)
                            response.setHeader('Content-Type', 'text/html; charset=utf-8')
                            response.setHeader('Cache-Control', 'no-store')
                            response.end(rendered)
                        } catch (error) {
                            next(error)
                        }
                    })
                },
            },
        ],
        server: {
            host: '127.0.0.1',
            port: 5192,
            strictPort: true,
            https:
                certificate && key
                    ? { cert: readFileSync(certificate), key: readFileSync(key) }
                    : undefined,
            proxy: Object.fromEntries(
                [
                    '^/api(?:/|$)',
                    '^/auth/session(?:\\?|$)',
                    '^/login(?:\\?|$)',
                    '^/logout(?:\\?|$)',
                    '^/sanctum/csrf-cookie(?:\\?|$)',
                ].map((path) => [
                    path,
                    {
                        target: upstream.origin,
                        changeOrigin: true,
                        secure: true,
                        cookieDomainRewrite: '',
                    },
                ]),
            ),
        },
    }
})
