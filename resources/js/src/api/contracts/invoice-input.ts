import type {
    InvoiceInput,
    InvoiceTerm,
    InvoiceVersion,
    InvoiceRevision,
} from '@/core/types/invoice'
import { parseDeliveryDate } from './delivery-input'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseMoney,
    parseObject,
    parseString,
    requireKeys,
} from './value-parsers'
import { moneyUnits } from '@/core/domain/money-arithmetic'
export function parseInvoiceTerms(value: unknown): readonly InvoiceTerm[] {
    if (!Array.isArray(value) || !value.length || value.length > 50) return invalidContract('terms')
    return value.map((entry, index) => {
        const path = `terms.${index}`
        const term = parseObject(entry, path)
        requireKeys(term, ['label', 'amount', 'dueDate'], path)
        const label = parseString(term.label, `${path}.label`).trim()
        if (!label || label.length > 255) return invalidContract(`${path}.label`)
        const amount = parseMoney(term.amount, `${path}.amount`)
        if (amount.length > 20 || moneyUnits(amount) <= 0n) return invalidContract(`${path}.amount`)
        return {
            label,
            amount,
            dueDate:
                term.dueDate === null ? null : parseDeliveryDate(term.dueDate, `${path}.dueDate`),
        }
    })
}
export function parseInvoiceInput(
    value: unknown,
    updating = false,
): InvoiceInput & { version?: number; revisionNumber?: number } {
    const record = parseObject(value, 'invoice')
    requireKeys(
        record,
        [
            'purchaseOrderId',
            'mitraId',
            'direction',
            'kind',
            'invoiceDate',
            'terms',
            'notes',
            ...(updating ? ['version', 'revisionNumber'] : []),
        ],
        'invoice',
    )
    const direction = record.direction
    const kind = record.kind
    if (direction !== 'receivable' && direction !== 'payable') return invalidContract('direction')
    if (kind !== 'down_payment' && kind !== 'settlement') return invalidContract('kind')
    const mitraId = record.mitraId === null ? null : parseId(record.mitraId, 'mitraId')
    if ((direction === 'payable') !== (mitraId !== null)) return invalidContract('mitraId')
    const notes =
        record.notes === null || record.notes === undefined
            ? null
            : parseString(record.notes, 'notes').trim()
    if (notes && notes.length > 2000) return invalidContract('notes')
    return {
        purchaseOrderId: parseId(record.purchaseOrderId, 'purchaseOrderId'),
        mitraId,
        direction,
        kind,
        invoiceDate: parseDeliveryDate(record.invoiceDate, 'invoiceDate'),
        terms: parseInvoiceTerms(record.terms),
        notes,
        ...(updating
            ? {
                  version: parseInteger(record.version, 'version'),
                  revisionNumber: parseInteger(record.revisionNumber, 'revisionNumber'),
              }
            : {}),
    }
}

export function parseInvoiceVersion(value: unknown): InvoiceVersion {
    const record = parseObject(value, 'invoiceVersion')
    requireKeys(record, ['version', 'revisionNumber'], 'invoiceVersion')
    return {
        version: parseInteger(record.version, 'version'),
        revisionNumber: parseInteger(record.revisionNumber, 'revisionNumber'),
    }
}

export function parseInvoiceRevision(value: unknown): InvoiceRevision {
    const record = parseObject(value, 'invoiceRevision')
    requireKeys(record, ['version', 'reason', 'terms'], 'invoiceRevision')
    const reason = parseString(record.reason, 'reason').trim()
    if (!reason || reason.length > 255) return invalidContract('reason')
    return {
        version: parseInteger(record.version, 'version'),
        reason,
        terms: parseInvoiceTerms(record.terms),
    }
}
