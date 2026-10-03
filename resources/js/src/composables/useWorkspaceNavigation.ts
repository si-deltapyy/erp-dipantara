import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canAccess } from '@/core/domain/access-policy'
import { navigation } from '@/router/navigation'
import type { WorkspaceGroup, WorkspaceIcon, WorkspaceLink } from '@/core/types/workspace'
import type { SessionUser } from '@/core/types/session'

const sections = [
    {
        key: 'workspace',
        names: ['home', 'purchase-orders', 'orders', 'assignments', 'gradings', 'deliveries'],
        icon: 'layers',
    },
    { key: 'finance', names: ['invoices', 'payments', 'closings'], icon: 'wallet' },
    {
        key: 'master',
        names: ['buyers', 'mitras', 'timber-products', 'bank-accounts', 'graders'],
        icon: 'users',
    },
    {
        key: 'reports',
        names: ['buyer-history', 'production-report', 'purchase-price-report'],
        icon: 'chart',
    },
] as const

interface WorkspaceNavigationState {
    groups: ComputedRef<WorkspaceGroup[]>
    activeKey: ComputedRef<string>
    navigate: (name: string) => void
}

const routeIcons: Readonly<Record<string, WorkspaceIcon>> = {
    home: 'home',
    'purchase-orders': 'document',
    orders: 'box',
    assignments: 'users',
    gradings: 'check',
    deliveries: 'truck',
    invoices: 'document',
    payments: 'wallet',
    closings: 'check',
    'timber-products': 'layers',
    'bank-accounts': 'wallet',
}

function workspaceLinks(
    names: readonly string[],
    fallback: WorkspaceIcon,
    user: SessionUser | null,
    translate: (key: string) => string,
): WorkspaceLink[] {
    return names.flatMap((name) => {
        const entry = navigation.find((candidate) => candidate.name === name)
        if (
            !entry ||
            !canAccess(
                user,
                entry.requiredPermissions,
                entry.developmentCapability,
                entry.anyPermissions,
            )
        )
            return []
        return [{ key: name, label: translate(entry.label), icon: routeIcons[name] ?? fallback }]
    })
}

export function useWorkspaceNavigation(): WorkspaceNavigationState {
    const session = useSessionStore()
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    const groups = computed<WorkspaceGroup[]>(() =>
        sections
            .map((section) => ({
                label: t(`workspace.${section.key}`),
                links: workspaceLinks(section.names, section.icon, session.user, t),
            }))
            .filter((group) => group.links.length),
    )
    const activeKey = computed(() => {
        const current = String(route.name ?? '')
        const links = groups.value.flatMap((group) => group.links)
        if (links.some((link) => link.key === current)) return current
        const parent = links.find((link) => {
            const path = router.resolve({ name: link.key }).path
            return path !== '/' && route.path.startsWith(`${path}/`)
        })
        return parent?.key ?? (current === 'dashboard-queue' ? 'home' : '')
    })
    function navigate(name: string): void {
        if (groups.value.some((group) => group.links.some((link) => link.key === name)))
            void router.push({ name })
    }
    return { groups, activeKey, navigate }
}
