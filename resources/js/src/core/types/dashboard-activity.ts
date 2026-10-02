export const activityStatuses = {
    'purchase-orders': ['draft', 'submitted', 'approved', 'rejected', 'closed'],
    invoices: ['draft', 'issued', 'superseded'],
    payments: ['draft', 'submitted', 'approved', 'rejected'],
} as const
export type ActivityResource = keyof typeof activityStatuses
export interface DashboardActivity {
    readonly resource: ActivityResource
    readonly id: string
    readonly purchaseOrderNumber: string
    readonly label: string
    readonly status: string
    readonly updatedAt: string
    readonly targetPath: string
}
