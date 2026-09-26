import type { DevelopmentCapability } from '@/core/types/session'
export interface AccessRule {
    readonly requiredPermissions: readonly string[]
    readonly anyPermissions?: readonly string[]
    readonly developmentCapability?: DevelopmentCapability
}
export const accessRules = {
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
