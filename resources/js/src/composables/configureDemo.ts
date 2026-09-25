import type { App } from 'vue'
import { DemoRuntime } from '@/api/mocks/demo-runtime'
import { demoRuntimeKey } from './useDemoRuntime'
export function configureDemo(app: App): void {
    const runtime = new DemoRuntime()
    app.provide(demoRuntimeKey, runtime)
    app.onUnmount(() => runtime.dispose())
    if (import.meta.hot) import.meta.hot.dispose(() => runtime.dispose())
}
