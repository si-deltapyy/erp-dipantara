import { inject, watch } from 'vue'
import type { App } from 'vue'
import type { Pinia } from 'pinia'
import { documentsApiKey } from '@/api/documents-api'
import { createHttpDocuments } from '@/api/adapters/documents-http'
import { selectDomainAdapter } from '@/api/adapter-selection'
import { adapterModes } from '@/core/constants/environment'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useSessionStore } from '@/stores/session'
import { useDocumentRecoveryStore } from '@/stores/document-recovery'
import { demoRuntimeKey } from './useDemoRuntime'

export async function configureDocuments(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = await selectDomainAdapter('documents', adapterModes, {
        live: () => createHttpDocuments(),
        mock: import.meta.env.DEV
            ? async () => {
                  const { createMockDocuments } = await import('@/api/adapters/documents-mock')
                  const runtime = app.runWithContext(() => inject(demoRuntimeKey))
                  if (!runtime) throw new Error('Demo runtime is not configured')
                  return createMockDocuments(runtime, () => session.user)
              }
            : undefined,
    })
    app.provide(documentsApiKey, api)
    const recovery = useDocumentRecoveryStore(pinia)
    const stop = watch(
        () => [session.status, session.user],
        () => {
            const draft = recovery.draft
            if (
                session.status === 'guest' ||
                (session.user &&
                    draft &&
                    (draft.actorId !== session.user.id ||
                        evaluateRecordAccess(
                            session.user,
                            'documents.upload',
                            draft.target.scope,
                        ) !== 'allowed' ||
                        (draft.target.parentType === 'purchase-order' &&
                            evaluateRecordAccess(
                                session.user,
                                'purchase-orders.read',
                                draft.target.scope,
                            ) !== 'allowed')))
            )
                recovery.$reset()
        },
    )
    app.onUnmount(stop)
    if (import.meta.hot) import.meta.hot.dispose(stop)
}
