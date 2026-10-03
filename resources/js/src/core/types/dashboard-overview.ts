export type DashboardWorkStatus = 'review' | 'preparing' | 'shipping' | 'payment'

export interface DashboardWorkRow {
    readonly id: string
    readonly buyer: string
    readonly initials: string
    readonly timber: string
    readonly volume: string
    readonly amount: string
    readonly status: DashboardWorkStatus
    readonly dueDate: string
    readonly overdue: boolean
}

export interface DashboardOverviewMetric {
    readonly key: 'active' | 'prepared' | 'dispatched'
    readonly value: number
    readonly note: string
}

export interface DashboardWorkQueue {
    readonly status: DashboardWorkStatus
    readonly count: number
}

export interface DashboardTimelineEntry {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly time: string
    readonly kind: 'order' | 'delivery' | 'payment'
}

export interface DashboardBalance {
    readonly direction: 'receivable' | 'payable'
    readonly amount: string
    readonly invoiceCount: number
    readonly overdueAmount: string
}
