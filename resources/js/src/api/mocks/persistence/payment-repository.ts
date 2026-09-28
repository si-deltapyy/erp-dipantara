import type { Payment, PaymentQuery } from '@/core/types/payment'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import type { DatabaseOptions } from './database'
import type { DemoStore } from './schema'
import type { PaymentMutation } from './payment-mutation'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { parsePaymentQuery } from '@/api/payment-mapper'
import { parsePaymentInput } from '@/api/contracts/payment-input'
import { parseWorkflowVersion, parseWorkflowRejection } from '@/api/contracts/workflow-parsers'
import { assertRecordAccess, evaluateRecordAccess } from '@/core/domain/record-policy'
import { requirePaymentPermission, presentPayment } from './payment-policy'
import { runDemoTransaction } from './transaction'
import { requireDataset } from './demo-repository'
import { hashMutationPayload } from './idempotency'
import { writePayment } from './payment-mutation'
const stores: readonly DemoStore[] = [
    'metadata',
    'payments',
    'invoices',
    'invoiceVersions',
    'purchase-orders',
    'bank-accounts',
    'documents',
]
export class PaymentRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async list(
        user: SessionUser | null,
        query: PaymentQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<Payment>> {
        const actor = requirePaymentPermission(user, 'read')
        const filter = parsePaymentQuery(query)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const search = filter.search.trim().toLocaleLowerCase('id')
                const matches = (await transaction.list('payments'))
                    .filter(
                        (payment) =>
                            evaluateRecordAccess(actor, 'payments.read', payment) === 'allowed' &&
                            (!filter.invoiceId || filter.invoiceId === payment.invoiceId) &&
                            (!filter.purchaseOrderId ||
                                filter.purchaseOrderId === payment.purchaseOrderId) &&
                            (!filter.direction || filter.direction === payment.direction) &&
                            (!filter.status || filter.status === payment.status) &&
                            [
                                payment.invoiceNumber,
                                payment.purchaseOrderNumber,
                                payment.counterpartyName,
                            ].some((label) => label.toLocaleLowerCase('id').includes(search)),
                    )
                    .sort(
                        (a, b) =>
                            (filter.sort === 'createdAt' ? 1 : -1) *
                            (a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
                    )
                return {
                    data: matches
                        .slice((filter.page - 1) * filter.perPage, filter.page * filter.perPage)
                        .map((payment) => presentPayment(payment, actor, metadata.generation)),
                    meta: { page: filter.page, perPage: filter.perPage, total: matches.length },
                }
            },
            signal,
        )
    }
    async get(user: SessionUser | null, id: string, signal: AbortSignal): Promise<Payment> {
        const actor = requirePaymentPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                const payment = await transaction.get('payments', id)
                if (!payment) throw new ApiError('not-found')
                assertRecordAccess(actor, 'payments.read', payment)
                return presentPayment(payment, actor, metadata.generation)
            },
            signal,
        )
    }
    async mutate(
        user: SessionUser | null,
        mutation: Omit<PaymentMutation, 'hash'>,
        generation: string,
        signal: AbortSignal,
    ): Promise<Payment> {
        const actor = requirePaymentPermission(user, mutation.action)
        if (mutation.action !== 'create') parseId(mutation.id)
        if (!mutation.key.trim() || mutation.key.length > 100) throw new ApiError('validation')
        const input =
            mutation.action === 'reject'
                ? parseWorkflowRejection(mutation.input)
                : mutation.action === 'approve' || mutation.action === 'submit'
                  ? parseWorkflowVersion(mutation.input)
                  : parsePaymentInput(mutation.input, mutation.action === 'update')
        const hash = await hashMutationPayload({ ...input, generation })
        return runDemoTransaction(
            this.options,
            [...stores, 'paymentMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                const metadata = await requireDataset(transaction)
                if (metadata.generation !== generation) throw new ApiError('conflict')
                return presentPayment(
                    await writePayment(transaction, metadata, actor, { ...mutation, input, hash }),
                    actor,
                    generation,
                )
            },
            signal,
        )
    }
}
