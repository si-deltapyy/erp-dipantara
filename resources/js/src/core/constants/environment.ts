import { resolveAdapterModes } from './adapter-modes'
export const adapterModes = resolveAdapterModes(import.meta.env.DEV, import.meta.env)
export const mockEnabled = import.meta.env.DEV && adapterModes.auth === 'mock'
export const businessMockEnabled =
    import.meta.env.DEV && Object.values(adapterModes.domains).includes('mock')
