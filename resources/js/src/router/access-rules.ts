import type { DevelopmentCapability } from '@/core/types/session'
export interface AccessRule {
    readonly requiredPermissions: readonly string[]
    readonly developmentCapability?: DevelopmentCapability
}
export const accessRules = {
    'timber-products': { requiredPermissions: ['timber-products.read.all'] },
    mitras: { requiredPermissions: ['mitras.read.all'] },
    buyers: { requiredPermissions: ['buyers.read.all'] },
    home: { requiredPermissions: [] },
    'mock-lab': { requiredPermissions: [], developmentCapability: 'development.mock.view' },
    'ui-lab': { requiredPermissions: [], developmentCapability: 'development.ui.view' },
} satisfies Record<string, AccessRule>
