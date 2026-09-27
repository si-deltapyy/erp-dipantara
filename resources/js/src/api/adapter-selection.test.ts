import { expect, it, vi } from 'vitest'
import { resolveAdapterModes } from '@/core/constants/adapter-modes'
import { selectDomainAdapter } from './adapter-selection'

it('loads only the explicitly selected adapter and never falls back after live failure', async () => {
    const mock = vi.fn(() => ({ mode: 'mock' }))
    const live = vi.fn(() => {
        throw new Error('Backend unavailable')
    })
    await expect(
        selectDomainAdapter('orders', resolveAdapterModes(true, {}), { live, mock }),
    ).rejects.toThrow('Backend unavailable')
    expect(mock).not.toHaveBeenCalled()
    await expect(
        selectDomainAdapter('orders', resolveAdapterModes(true, { VITE_ORDERS_MODE: 'mock' }), {
            live,
            mock,
        }),
    ).resolves.toEqual({ mode: 'mock' })
    expect(live).toHaveBeenCalledTimes(1)
})
it('fails explicitly when the selected mock adapter is absent', async () => {
    await expect(
        selectDomainAdapter('orders', resolveAdapterModes(true, { VITE_API_MODE: 'mock' }), {
            live: () => ({}),
        }),
    ).rejects.toThrow('Mock adapter is not configured')
})
