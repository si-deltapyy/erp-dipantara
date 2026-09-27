export const businessDomains = [
    'master-data',
    'purchase-orders',
    'orders',
    'gradings',
    'deliveries',
    'invoices',
    'payments',
    'closings',
    'reports',
    'documents',
] as const
export type BusinessDomain = (typeof businessDomains)[number]
export type AdapterMode = 'live' | 'mock'
export interface AdapterModes {
    readonly auth: AdapterMode
    readonly domains: Readonly<Record<BusinessDomain, AdapterMode>>
}
function mode(value: unknown, fallback: AdapterMode): AdapterMode {
    if (value === undefined || value === '') return fallback
    if (value === 'http') return 'live'
    if (value === 'live' || value === 'mock') return value
    throw new Error('Invalid adapter mode')
}
export function resolveAdapterModes(
    development: boolean,
    environment: Readonly<Record<string, unknown>>,
): AdapterModes {
    const fallback = development ? mode(environment.VITE_API_MODE, 'live') : 'live'
    const auth = development ? mode(environment.VITE_AUTH_MODE, fallback) : 'live'
    const domains = Object.fromEntries(
        businessDomains.map((domain) => [
            domain,
            development
                ? mode(
                      environment[`VITE_${domain.replaceAll('-', '_').toUpperCase()}_MODE`],
                      fallback,
                  )
                : 'live',
        ]),
    ) as Record<BusinessDomain, AdapterMode>
    return { auth, domains }
}
