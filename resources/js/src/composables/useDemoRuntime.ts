import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { DemoRuntime } from '@/api/mocks/demo-runtime'
export const demoRuntimeKey: InjectionKey<DemoRuntime> = Symbol('demo-runtime')
export function useDemoRuntime(): DemoRuntime {
    const runtime = inject(demoRuntimeKey)
    if (!runtime) throw new Error('Demo runtime is not configured')
    return runtime
}
