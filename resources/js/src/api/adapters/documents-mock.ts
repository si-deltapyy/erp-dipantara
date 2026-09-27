import type { DocumentsApi } from '@/core/types/document'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import type { DemoRuntime } from '../mocks/demo-runtime'
import { DocumentRepository } from '../mocks/persistence/document-repository'
import { requireDocumentPermission } from '../mocks/persistence/document-policy'

export function createMockDocuments(
    runtime: DemoRuntime,
    getUser: () => SessionUser | null,
    repository = new DocumentRepository(),
): DocumentsApi {
    const generations = new Map<string, string>()
    return {
        list: (parent, signal) => {
            const actor = requireDocumentPermission(getUser(), 'read')
            return runtime.executeBusiness(
                'read',
                signal,
                async (active, _generation, scenario) => {
                    if (getUser()?.id !== actor.id) throw new ApiError('unauthenticated')
                    const documents = await repository.list(actor, parent, active)
                    return scenario === 'empty' ? [] : documents
                },
            )
        },
        download: (id, signal) => {
            const actor = requireDocumentPermission(getUser(), 'download')
            return runtime.executeBusiness('read', signal, (active) => {
                if (getUser()?.id !== actor.id) throw new ApiError('unauthenticated')
                return repository.download(actor, id, active)
            })
        },
        upload: (input, options) => {
            const actor = requireDocumentPermission(getUser(), 'upload')
            options.onProgress?.(0)
            return runtime.executeBusiness('update', options.signal, async (active, generation) => {
                if (getUser()?.id !== actor.id) throw new ApiError('unauthenticated')
                const identity = JSON.stringify([actor.id, options.idempotencyKey])
                const snapshot = generations.get(identity) ?? generation
                generations.set(identity, snapshot)
                const result = await repository.upload(
                    actor,
                    input,
                    options.idempotencyKey,
                    snapshot,
                    active,
                )
                options.onProgress?.(100)
                return result
            })
        },
        subscribe: (listener) => runtime.subscribe(listener),
    }
}
