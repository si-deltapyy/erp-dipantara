import type { DevelopmentCapability } from '@/core/types/session'
export interface AccessRule {
    readonly requiredPermissions: readonly string[]
    readonly anyPermissions?: readonly string[]
    readonly developmentCapability?: DevelopmentCapability
}
export const accessRules = {
    deliveries: {
        requiredPermissions: [],
        anyPermissions: ['deliveries.read.all', 'deliveries.read.own', 'deliveries.read.assigned'],
    },
    gradings: {
        requiredPermissions: [],
        anyPermissions: ['gradings.read.all', 'gradings.read.assigned'],
    },
    assignments: {
        requiredPermissions: [],
        anyPermissions: ['assignments.read.assigned', 'assignments.read.all'],
    },
    orders: { requiredPermissions: [], anyPermissions: ['orders.read.own', 'orders.read.all'] },
    'purchase-orders': {
        requiredPermissions: [],
        anyPermissions: ['purchase-orders.read.own', 'purchase-orders.read.all'],
    },
    graders: { requiredPermissions: ['graders.read.all'] },
    'bank-accounts': { requiredPermissions: ['bank-accounts.read.all'] },
    'timber-products': { requiredPermissions: ['timber-products.read.all'] },
    mitras: { requiredPermissions: ['mitras.read.all'] },
    buyers: { requiredPermissions: ['buyers.read.all'] },
    home: { requiredPermissions: [] },
    'mock-lab': { requiredPermissions: [], developmentCapability: 'development.mock.view' },
    'ui-lab': { requiredPermissions: [], developmentCapability: 'development.ui.view' },
} satisfies Record<string, AccessRule>
