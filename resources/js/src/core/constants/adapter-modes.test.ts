import { expect, it } from 'vitest'
import { resolveAdapterModes } from './adapter-modes'
it('defaults to live and preserves legacy explicit mock configuration', () => {
    expect(resolveAdapterModes(true, {}).auth).toBe('live')
    expect(
        Object.values(resolveAdapterModes(true, { VITE_API_MODE: 'mock' }).domains).every(
            (mode) => mode === 'mock',
        ),
    ).toBe(true)
})
it('accepts the documented legacy http mode as live', () => {
    const modes = resolveAdapterModes(true, { VITE_API_MODE: 'http' })
    expect(modes.auth).toBe('live')
    expect(Object.values(modes.domains).every((mode) => mode === 'live')).toBe(true)
})
it('allows live authentication with explicit mock domains', () => {
    const modes = resolveAdapterModes(true, {
        VITE_API_MODE: 'mock',
        VITE_AUTH_MODE: 'live',
        VITE_PAYMENTS_MODE: 'live',
    })
    expect(modes.auth).toBe('live')
    expect(modes.domains.orders).toBe('mock')
    expect(modes.domains.payments).toBe('live')
})
it('forces production live even with mock environment values', () => {
    expect(resolveAdapterModes(false, { VITE_API_MODE: 'mock', VITE_AUTH_MODE: 'mock' }).auth).toBe(
        'live',
    )
    expect(
        Object.values(resolveAdapterModes(false, { VITE_API_MODE: 'mock' }).domains).every(
            (mode) => mode === 'live',
        ),
    ).toBe(true)
})
it('rejects misspelled development modes instead of silently choosing an adapter', () => {
    expect(() => resolveAdapterModes(true, { VITE_GRADINGS_MODE: 'moc' })).toThrow()
})
