import type { DashboardSnapshot } from '@/core/types/dashboard'
import {
    invalidContract,
    parseInteger,
    parseNumericMoney,
    parseObject,
} from './contracts/value-parsers'

export function parseDashboardSnapshot(value: unknown): DashboardSnapshot {
    const snapshot = parseObject(value, 'dashboard')
    const summary = parseObject(snapshot.summary, 'summary')
    const cashflow = parseObject(snapshot.cashflow, 'cashflow')
    const balance = (field: string): string => {
        const amount = parseNumericMoney(summary[field], `summary.${field}`)
        if (amount.startsWith('-')) return invalidContract(`summary.${field}`)
        return amount
    }
    return {
        metrics: [
            {
                key: 'active-purchase-orders',
                value: parseInteger(summary.total_po_aktif, 'summary.total_po_aktif', 0),
                unit: 'count',
            },
            {
                key: 'awaiting-deposit',
                value: parseInteger(summary.po_menunggu_dp, 'summary.po_menunggu_dp', 0),
                unit: 'count',
            },
            {
                key: 'in-progress',
                value: parseInteger(summary.po_dalam_proses, 'summary.po_dalam_proses', 0),
                unit: 'count',
            },
            {
                key: 'awaiting-payment',
                value: parseInteger(
                    summary.po_menunggu_pelunasan,
                    'summary.po_menunggu_pelunasan',
                    0,
                ),
                unit: 'count',
            },
            { key: 'receivables', value: balance('total_piutang'), unit: 'IDR' },
            { key: 'payables', value: balance('total_hutang'), unit: 'IDR' },
        ],
        cashflow: [
            {
                key: 'income',
                value: parseNumericMoney(cashflow.pemasukan, 'cashflow.pemasukan'),
                unit: 'IDR',
            },
            {
                key: 'expenses',
                value: parseNumericMoney(cashflow.pengeluaran, 'cashflow.pengeluaran'),
                unit: 'IDR',
            },
            { key: 'net', value: parseNumericMoney(cashflow.net, 'cashflow.net'), unit: 'IDR' },
        ],
    }
}
