import { accessRules } from './access-rules'
import type { AccessRule } from './access-rules'
export interface NavigationEntry extends AccessRule {
    readonly name: string
    readonly label: string
    readonly icon: 'home' | 'flask' | 'layers'
}
export const navigation: readonly NavigationEntry[] = [
    { name: 'home', label: 'navigation.home', icon: 'home', ...accessRules.home },
    { name: 'mitras', label: 'mitras.title', icon: 'layers', ...accessRules.mitras },
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
