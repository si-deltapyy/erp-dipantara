import type { App } from 'vue'
import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import { sessionMock } from '@/api/adapters/session-mock'
import { developmentRoutes } from '@/router/development-routes'
import { configureSession } from './configureSession'

export function configureMockSession(app: App, pinia: Pinia, router: Router): void {
    for (const route of developmentRoutes) router.addRoute(route)
    configureSession(app, pinia, router, sessionMock)
}
