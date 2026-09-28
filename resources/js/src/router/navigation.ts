import { accessRules } from './access-rules'
import type { AccessRule } from './access-rules'
export interface NavigationEntry extends AccessRule {
    readonly name: string
    readonly label: string
    readonly icon: 'home' | 'flask' | 'layers'
}
export const navigation: readonly NavigationEntry[] = [
    { name: 'home', label: 'navigation.home', icon: 'home', ...accessRules.home },
    {
        name: 'purchase-orders',
        label: 'purchase-orders.title',
        icon: 'layers',
        ...accessRules['purchase-orders'],
    },
    { name: 'deliveries', label: 'deliveries.title', icon: 'layers', ...accessRules.deliveries },
    { name: 'gradings', label: 'gradings.title', icon: 'layers', ...accessRules.gradings },
    { name: 'orders', label: 'orders.title', icon: 'layers', ...accessRules.orders },
    {
        name: 'assignments',
        label: 'assignments.assignedTitle',
        icon: 'layers',
        ...accessRules.assignments,
    },
    { name: 'graders', label: 'graders.title', icon: 'layers', ...accessRules.graders },
    { name: 'mitras', label: 'mitras.title', icon: 'layers', ...accessRules.mitras },
    {
        name: 'bank-accounts',
        label: 'bank-accounts.title',
        icon: 'layers',
        ...accessRules['bank-accounts'],
    },
    {
        name: 'timber-products',
        label: 'timber-products.title',
        icon: 'layers',
        ...accessRules['timber-products'],
    },
    { name: 'buyers', label: 'buyers.title', icon: 'layers', ...accessRules.buyers },
    {
        name: 'mock-lab',
        label: 'navigation.lab',
        icon: 'flask',
        ...accessRules['mock-lab'],
    },
    {
        name: 'ui-lab',
        label: 'ui.title',
        icon: 'flask',
        ...accessRules['ui-lab'],
    },
]
