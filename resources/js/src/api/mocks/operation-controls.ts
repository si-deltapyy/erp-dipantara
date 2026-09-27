import { ApiError } from '@/core/types/api-error'
import { waitForMock } from './delay'
import { DemoStorageError } from './persistence/storage-error'

export const operationScenarios = [
    'success',
    'empty',
    'validation',
    'forbidden',
    'not-found',
    'conflict',
    'unauthenticated',
    'csrf',
    'network',
    'quota',
    'committed-timeout',
] as const
export type OperationScenario = (typeof operationScenarios)[number]
export type DemoOperation = 'read' | 'update'
export interface OperationControl {
    readonly scenario: OperationScenario
    readonly latency: number
}
export class OperationControls {
    private readonly controls = new Map<DemoOperation, OperationControl>()
    set(operation: DemoOperation, control: OperationControl): void {
        if (
            !operationScenarios.includes(control.scenario) ||
            !Number.isFinite(control.latency) ||
            control.latency < 0 ||
            control.latency > 5000
        )
            throw new Error('Invalid operation control')
        this.controls.set(operation, control)
    }
    async before(operation: DemoOperation, signal: AbortSignal): Promise<OperationScenario> {
        const control = this.controls.get(operation) ?? { scenario: 'success', latency: 0 }
        await waitForMock(control.latency, signal)
        if (control.scenario === 'unauthenticated' || control.scenario === 'csrf')
            this.controls.delete(operation)
        if (control.scenario === 'quota') throw new DemoStorageError('quota')
        if (control.scenario === 'validation')
            throw new ApiError('validation', { quantity: ['demo.invalidQuantity'] })
        if (!['success', 'empty', 'committed-timeout'].includes(control.scenario))
            throw new ApiError(
                control.scenario as Exclude<
                    OperationScenario,
                    'success' | 'empty' | 'committed-timeout' | 'quota'
                >,
            )
        return control.scenario
    }
    after(scenario: OperationScenario): void {
        if (scenario === 'committed-timeout') throw new ApiError('network')
    }
    clear(): void {
        this.controls.clear()
    }
}
