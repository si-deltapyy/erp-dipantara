import type { SessionUser } from '@/core/types/session'
import { businessRolePermissions } from './business-role-permissions'
const adminPermissions = [
    'approve orders',
    'reject orders',
    'view users',
    'manage products',
    'manage mitras',
    'manage graders',
    'manage rekenings',
    'manage pre-orders',
    'manage orders',
    'manage gradings',
    'manage logs payments',
    'manage logs orders',
    'approve payments',
    'reject payments',
    'approve gradings',
    'reject gradings',
    'make payments',
    'view reports',
    'make invoices',
    'make transactions',
    'make grading reports',
    'make orders',
    'make gradings',
]
const graderPermissions = ['make gradings', 'view reports', 'make grading reports']
const baseSessionFixtures: readonly (SessionUser & { readonly email: string })[] = [
    {
        id: 'admin-demo',
        displayName: 'Admin Simulasi',
        email: 'admin@woodflow.test',
        roles: ['admin'],
        permissions: adminPermissions,
        developmentCapabilities: ['development.mock.view', 'development.ui.view'],
    },
    {
        id: 'grader-one',
        displayName: 'Grader Simulasi 01',
        email: 'grader1@woodflow.test',
        roles: ['grader'],
        permissions: graderPermissions,
        developmentCapabilities: [],
    },
    {
        id: 'grader-two',
        displayName: 'Grader Simulasi 02',
        email: 'grader2@woodflow.test',
        roles: ['grader'],
        permissions: graderPermissions,
        developmentCapabilities: [],
    },
    {
        id: 'user-demo',
        displayName: 'Pengguna Simulasi',
        email: 'user@woodflow.test',
        roles: ['user'],
        permissions: ['make payments', 'make orders'],
        developmentCapabilities: [],
    },
    {
        id: 'maker-demo',
        displayName: 'Maker Simulasi',
        email: 'maker@woodflow.test',
        roles: ['maker'],
        permissions: ['make orders', 'make invoices', 'make transactions'],
        developmentCapabilities: [],
    },
    {
        id: 'supervisor-demo',
        displayName: 'Supervisor Simulasi',
        email: 'supervisor@woodflow.test',
        roles: ['supervisor'],
        permissions: [
            'approve orders',
            'reject orders',
            'approve payments',
            'reject payments',
            'approve gradings',
            'reject gradings',
        ],
        developmentCapabilities: [],
    },
    {
        id: 'multiple-demo',
        displayName: 'Multi-role Simulasi',
        email: 'multiple@woodflow.test',
        roles: ['grader', 'user'],
        permissions: [...graderPermissions, 'make payments', 'make orders'],
        developmentCapabilities: [],
    },
    {
        id: 'direct-demo',
        displayName: 'Izin Langsung Simulasi',
        email: 'direct@woodflow.test',
        roles: [],
        permissions: ['view reports'],
        developmentCapabilities: [],
    },
    {
        id: 'future-demo',
        displayName: 'Role Baru Simulasi',
        email: 'future@woodflow.test',
        roles: ['auditor'],
        permissions: ['view reports'],
        developmentCapabilities: [],
    },
    {
        id: 'unknown-demo',
        displayName: 'Akun Tanpa Izin',
        email: 'unknown@woodflow.test',
        roles: ['unknown'],
        permissions: [],
        developmentCapabilities: [],
    },
]

export const sessionFixtures: readonly (SessionUser & { readonly email: string })[] =
    baseSessionFixtures.map((fixture) => ({
        ...fixture,
        permissions: [
            ...new Set([
                ...fixture.permissions,
                ...Object.entries(businessRolePermissions)
                    .filter(([role]) => fixture.roles.includes(role))
                    .flatMap(([, permissions]) => [...permissions]),
            ]),
        ],
    }))
