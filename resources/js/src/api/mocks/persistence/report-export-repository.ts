import type { SessionUser } from '@/core/types/session'
import type { DocumentReference } from '@/core/types/document'
import type { ReportExportInput } from '@/core/types/report-export'
import type { DatabaseOptions } from './database'
import { ApiError } from '@/core/types/api-error'
import { parseReportExport } from '@/api/report-export-mapper'
import { hashMutationPayload } from './idempotency'
import { runDemoTransaction } from './transaction'
import { reportStores } from './report-projection'
import { requireExportActor } from './report-export-policy'
import { writeReportExport } from './report-export-write'
export class ReportExportRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async create(
        user: SessionUser | null,
        input: ReportExportInput,
        key: string,
        generation: string,
        signal: AbortSignal,
    ): Promise<DocumentReference> {
        const actor = requireExportActor(user, input.kind)
        const canonical = parseReportExport(input)
        if (!key.trim() || key.length > 100) throw new ApiError('validation')
        const hash = await hashMutationPayload({ input: canonical, generation })
        return runDemoTransaction(
            this.options,
            [...reportStores, 'documents', 'documentMutations', 'reportExports'],
            'readwrite',
            (transaction) =>
                writeReportExport(transaction, actor, { input: canonical, key, hash, generation }),
            signal,
        )
    }
}
