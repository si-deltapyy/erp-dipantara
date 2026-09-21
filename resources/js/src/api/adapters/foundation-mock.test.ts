import { it, expect, vi, afterEach } from 'vitest'
import { createFoundationMock } from './foundation-mock'
import { mockScenarios } from '@/api/mocks/foundation-fixtures'

afterEach(() => vi.useRealTimers())

it.each(mockScenarios)('supports deterministic scenario %s', async (scenario) => {
    vi.useFakeTimers()
    const response = createFoundationMock().list({ scenario, signal: new AbortController().signal })
    const assertion = ['success', 'slow'].includes(scenario)
        ? expect(response).resolves.toHaveLength(3)
        : scenario === 'empty'
          ? expect(response).resolves.toEqual([])
          : expect(response).rejects.toMatchObject({ kind: scenario })
    await vi.runAllTimersAsync()
    await assertion
    expect(vi.getTimerCount()).toBe(0)
})

it('clears the timer on abort without a network error', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const response = createFoundationMock().list({ scenario: 'slow', signal: controller.signal })
    const assertion = expect(response).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await assertion
    expect(vi.getTimerCount()).toBe(0)
})
