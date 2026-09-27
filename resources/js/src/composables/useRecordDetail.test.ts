import { effectScope, nextTick, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { expect, test, vi } from 'vitest'
import { useRecordDetail } from './useRecordDetail'
import { useSessionStore } from '@/stores/session'
import { sessionFixtures } from '@/api/mocks/session-fixtures'

const { route } = vi.hoisted(() => ({ route: { params: { id: 'first' } } }))
vi.mock('vue-router', () => ({ useRoute: () => reactive(route) }))
vi.mock('./useSession', () => ({ useSession: () => ({ handleRequestFailure: vi.fn() }) }))

test('discards stale reads after assignment invalidation and actor changes and unsubscribes', async () => {
    setActivePinia(createPinia())
    const session = useSessionStore()
    session.user = sessionFixtures.find((actor) => actor.id === 'grader-one') ?? null
    const requests: { signal: AbortSignal; resolve: (value: string) => void }[] = []
    let invalidate = (): void => undefined
    const unsubscribe = vi.fn()
    const api = {
        get: (_id: string, signal: AbortSignal): Promise<string> =>
            new Promise((resolve) => requests.push({ signal, resolve })),
        subscribe: (listener: () => void): (() => void) => {
            invalidate = listener
            return unsubscribe
        },
    }
    const scope = effectScope()
    const state = scope.run(() => useRecordDetail(api, 'assignments'))!
    invalidate()
    expect(requests[0]?.signal.aborted).toBe(true)
    requests[0]?.resolve('stale assignment')
    await nextTick()
    expect(state.record.value).toBeUndefined()
    requests[1]?.resolve('current assignment')
    await nextTick()
    expect(state.record.value).toBe('current assignment')
    session.user = sessionFixtures.find((actor) => actor.id === 'grader-two') ?? null
    await nextTick()
    expect(state.record.value).toBeUndefined()
    scope.stop()
    expect(requests[2]?.signal.aborted).toBe(true)
    expect(unsubscribe).toHaveBeenCalledOnce()
    requests[2]?.resolve('after disposal')
    await nextTick()
    expect(state.record.value).toBeUndefined()
})
