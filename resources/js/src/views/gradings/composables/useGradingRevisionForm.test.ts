import { effectScope } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useGradingRevisionForm } from './useGradingRevisionForm'
import { useSessionStore } from '@/stores/session'
import { sessionFixtures } from '@/api/mocks/session-fixtures'
import type { GradingsApi } from '@/core/types/grading'
import { gradingFixture } from '../../../../../../tests/frontend/grading-fixture'
import { ApiError } from '@/core/types/api-error'
const { revise } = vi.hoisted(() => ({ revise: vi.fn<GradingsApi['revise']>() }))
vi.mock('./useGradingApi', () => ({ useGradingApi: () => ({ revise }) }))
vi.mock('@/composables/useSession', () => ({
    useSession: () => ({ handleRequestFailure: vi.fn() }),
}))
const scopes: ReturnType<typeof effectScope>[] = []
beforeEach(() => {
    setActivePinia(createPinia())
    useSessionStore().user = sessionFixtures.find((actor) => actor.id === 'grader-one') ?? null
    revise.mockReset()
})
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))
function setup() {
    const scope = effectScope()
    scopes.push(scope)
    const saved = vi.fn()
    const state = scope.run(() =>
        useGradingRevisionForm(
            { ...gradingFixture, status: 'approved', allowedActions: ['revise'] },
            saved,
        ),
    )!
    return { state, saved, scope }
}
test('restores revision reason and measured rows after CSRF without replaying automatically', async () => {
    revise.mockRejectedValueOnce(new ApiError('csrf'))
    const first = setup()
    first.state.draft.value = {
        ...first.state.draft.value,
        reason: 'Correct diameter',
        rows: gradingFixture.rows.map((row) => ({ ...row, diameterCm: '20.00' })),
    }
    await first.state.save()
    const key = revise.mock.calls[0]?.[2].idempotencyKey
    first.scope.stop()
    const restored = setup()
    expect(restored.state.draft.value.reason).toBe('Correct diameter')
    expect(restored.state.draft.value.rows[0]).toMatchObject({
        rowId: 'row-one',
        diameterCm: '20.00',
    })
    expect(revise).toHaveBeenCalledOnce()
    revise.mockResolvedValueOnce({
        ...gradingFixture,
        id: 'revision-one',
        revisionOfId: gradingFixture.id,
    })
    await restored.state.save()
    expect(revise.mock.calls[1]?.[2].idempotencyKey).toBe(key)
    expect(restored.saved).toHaveBeenCalledOnce()
})
test('retains uncertain revision payload and key and refuses writes from a replacement actor', async () => {
    revise.mockRejectedValueOnce(new ApiError('network'))
    const { state, saved } = setup()
    state.draft.value = { ...state.draft.value, reason: 'Correct diameter' }
    await state.save()
    expect(state.uncertain.value).toBe(true)
    const key = revise.mock.calls[0]?.[2].idempotencyKey
    state.draft.value = { ...state.draft.value, reason: 'Changed payload' }
    await state.save()
    expect(revise).toHaveBeenCalledOnce()
    state.draft.value = { ...state.draft.value, reason: 'Correct diameter' }
    revise.mockResolvedValueOnce({ ...gradingFixture, id: 'revision-one' })
    await state.save()
    expect(revise.mock.calls[1]?.[2].idempotencyKey).toBe(key)
    expect(saved).toHaveBeenCalledOnce()
    useSessionStore().user = sessionFixtures.find((actor) => actor.id === 'grader-two') ?? null
    expect(state.permitted.value).toBe(false)
    await state.save()
    expect(revise).toHaveBeenCalledTimes(2)
})
