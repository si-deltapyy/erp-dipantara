import type { AdapterModes, BusinessDomain } from '@/core/constants/adapter-modes'

export interface DomainAdapterFactories<T> {
    live(): T | Promise<T>
    mock?(): T | Promise<T>
}
export async function selectDomainAdapter<T>(
    domain: BusinessDomain,
    modes: AdapterModes,
    factories: DomainAdapterFactories<T>,
): Promise<T> {
    if (modes.domains[domain] === 'live') return factories.live()
    if (!factories.mock) throw new Error('Mock adapter is not configured for this domain')
    return factories.mock()
}
