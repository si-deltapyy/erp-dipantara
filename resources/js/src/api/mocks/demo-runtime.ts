import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { DemoRepository } from './persistence/demo-repository'
import type { DemoSnapshot, SampleMutation } from './persistence/demo-repository'
import type { DemoSample } from './persistence/schema'
import { RevisionChannel } from './persistence/revision-channel'
import { OperationControls } from './operation-controls'
import type { DemoOperation, OperationControl } from './operation-controls'
import type { OperationScenario } from './operation-controls'

export class DemoRuntime {
    private readonly controls = new OperationControls()
    private readonly revisions = new RevisionChannel()
    private readonly pending = new Set<AbortController>()
    private resetting = false
    private disposed = false
    constructor(private readonly repository = new DemoRepository()) {}
    executeBusiness<T>(
        operation: DemoOperation,
        signal: AbortSignal,
        execute: (
            active: AbortSignal,
            generation: string,
            scenario: OperationScenario,
        ) => Promise<T>,
    ): Promise<T> {
        return this.run(signal, async (active) => {
            const metadata = await this.repository.initialize(active)
            const scenario = await this.controls.before(operation, active)
            const result = await execute(active, metadata.generation, scenario)
            if (operation === 'update') {
                const next = await this.repository.initialize(active)
                this.revisions.publish(next)
                this.controls.after(scenario)
            }
            return result
        })
    }
    subscribe(listener: () => void): () => void {
        return this.revisions.subscribe(listener)
    }
    configure(user: SessionUser | null, operation: DemoOperation, control: OperationControl): void {
        this.assertControls(user)
        this.controls.set(operation, control)
    }
    read(user: SessionUser | null, signal: AbortSignal): Promise<DemoSnapshot> {
        return this.run(signal, async (active) => {
            const scenario = await this.controls.before('read', active)
            await this.repository.initialize(active)
            const snapshot = await this.repository.read(user, active)
            return scenario === 'empty' ? { ...snapshot, samples: [] } : snapshot
        })
    }
    update(
        user: SessionUser | null,
        input: SampleMutation,
        signal: AbortSignal,
    ): Promise<DemoSample> {
        return this.run(signal, async (active) => {
            const scenario = await this.controls.before('update', active)
            const result = await this.repository.update(user, input, active)
            const snapshot = await this.repository.read(user, active)
            this.revisions.publish(snapshot.metadata)
            this.controls.after(scenario)
            return result
        })
    }
    async reset(user: SessionUser | null): Promise<void> {
        this.assertControls(user)
        if (this.resetting || this.disposed) throw new ApiError('conflict')
        this.resetting = true
        for (const request of this.pending) request.abort()
        const request = new AbortController()
        this.pending.add(request)
        try {
            const metadata = await this.repository.reset(request.signal)
            this.controls.clear()
            this.resetting = false
            this.revisions.publish(metadata)
        } finally {
            this.pending.delete(request)
            this.resetting = false
        }
    }
    private assertControls(user: SessionUser | null): void {
        if (!user?.developmentCapabilities.includes('development.mock.view'))
            throw new ApiError('forbidden')
    }
    private async run<T>(
        signal: AbortSignal,
        execute: (active: AbortSignal) => Promise<T>,
    ): Promise<T> {
        signal.throwIfAborted()
        if (this.resetting || this.disposed) throw new ApiError('conflict')
        const request = new AbortController()
        const abort = (): void => request.abort()
        signal.addEventListener('abort', abort, { once: true })
        this.pending.add(request)
        try {
            return await execute(request.signal)
        } finally {
            signal.removeEventListener('abort', abort)
            this.pending.delete(request)
        }
    }
    dispose(): void {
        this.disposed = true
        for (const request of this.pending) request.abort()
        this.pending.clear()
        this.revisions.dispose()
    }
}
