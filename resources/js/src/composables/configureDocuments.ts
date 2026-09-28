import { watch } from 'vue'
import type { App } from 'vue'
import type { Pinia } from 'pinia'
import { documentsApiKey } from '@/api/documents-api'
import { createHttpDocuments } from '@/api/adapters/documents-http'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useSessionStore } from '@/stores/session'
import { useDocumentRecoveryStore } from '@/stores/document-recovery'

export async function configureDocuments(app: App, pinia: Pinia): Promise<void> {
    const session = useSessionStore(pinia)
    const api = createHttpDocuments()
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
