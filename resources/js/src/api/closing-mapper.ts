import type { ClosingEligibility, ClosingQuantities, ClosingReasonCode } from '@/core/types/closing'
import { closingReasonCodes } from '@/core/types/closing'
import { parseInvoiceSummary } from './invoice-summary-mapper'
import {
    parseObject,
    requireKeys,
    parseId,
    parseInteger,
    parseString,
    parseStrings,
    invalidContract,
} from './contracts/value-parsers'
function parseQuantities(value: unknown): ClosingQuantities {
    const record = parseObject(value, 'quantities')
    requireKeys(record, ['ordered', 'assigned', 'approved', 'received'], 'quantities')
    return {
        ordered: parseInteger(record.ordered, 'ordered', 0),
        assigned: parseInteger(record.assigned, 'assigned', 0),
        approved: parseInteger(record.approved, 'approved', 0),
        received: parseInteger(record.received, 'received', 0),
    }
}
function parseDecision(
    record: Record<string, unknown>,
): Pick<ClosingEligibility, 'eligible' | 'reasons' | 'allowedActions'> {
    const reasons = parseStrings(record.reasons, 'reasons')
    if (
        reasons.some((code) => !closingReasonCodes.includes(code as ClosingReasonCode)) ||
        new Set(reasons).size !== reasons.length ||
        typeof record.eligible !== 'boolean' ||
        record.eligible !== (reasons.length === 0)
    )
        return invalidContract('reasons')
    const allowedActions = parseStrings(record.allowedActions, 'allowedActions')
    if (
        allowedActions.length > 1 ||
        allowedActions.some((action) => action !== 'request') ||
        (!record.eligible && allowedActions.length)
    )
        return invalidContract('allowedActions')
    return {
        eligible: record.eligible,
        reasons: reasons as ClosingReasonCode[],
        allowedActions: allowedActions as 'request'[],
    }
}
function assertEligibleTotals(eligibility: ClosingEligibility): ClosingEligibility {
    const { eligible, quantities, openWorkCount, summary, purchaseOrderId } = eligibility
    if (summary.purchaseOrderId !== purchaseOrderId) return invalidContract('summary')
    if (
        eligible &&
        (openWorkCount ||
            !quantities.ordered ||
            new Set(Object.values(quantities)).size !== 1 ||
            !summary.receivable.issuedInvoiceCount ||
            !summary.payable.issuedInvoiceCount ||
            summary.receivable.outstandingAmount !== '0.00' ||
            summary.payable.outstandingAmount !== '0.00')
    )
        return invalidContract('eligible')
    return eligibility
}
const eligibilityKeys = [
    'purchaseOrderId',
    'version',
    'snapshotToken',
    'evaluatedAt',
    'eligible',
    'reasons',
    'quantities',
    'openWorkCount',
    'summary',
    'allowedActions',
]
export function parseClosingEligibility(value: unknown): ClosingEligibility {
    const record = parseObject(value, 'eligibility')
    requireKeys(record, eligibilityKeys, 'eligibility')
    const evaluatedAt = parseString(record.evaluatedAt, 'evaluatedAt')
    const snapshotToken = parseString(record.snapshotToken, 'snapshotToken')
    if (
        !/^\d{4}-\d{2}-\d{2}T/.test(evaluatedAt) ||
        !Number.isFinite(Date.parse(evaluatedAt)) ||
        !snapshotToken ||
        snapshotToken.length > 255
    )
        return invalidContract('snapshotToken')
    return assertEligibleTotals({
        ...parseDecision(record),
        purchaseOrderId: parseId(record.purchaseOrderId),
        version: parseInteger(record.version, 'version'),
        snapshotToken,
        evaluatedAt,
        quantities: parseQuantities(record.quantities),
        openWorkCount: parseInteger(record.openWorkCount, 'openWorkCount', 0),
        summary: parseInvoiceSummary(record.summary),
    })
}
