import { inject } from 'vue'
import { documentsApiKey } from '@/api/documents-api'
import type { DocumentsApi } from '@/core/types/document'

export function useDocumentsApi(): DocumentsApi {
    const api = inject(documentsApiKey)
    if (!api) throw new Error('Documents API is not configured')
    return api
}
