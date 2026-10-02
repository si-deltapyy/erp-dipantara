import type { InjectionKey } from 'vue'
import type { DocumentsApi } from '@/core/types/document'

export const documentsApiKey: InjectionKey<DocumentsApi> = Symbol('documents-api')
