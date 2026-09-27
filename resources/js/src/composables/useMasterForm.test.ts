import { effectScope } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { expect, it, vi } from 'vitest'
import { useMasterForm } from './useMasterForm'
import { ApiError } from '@/core/types/api-error'
vi.mock('./useSession', () => ({ useSession: () => ({ handleRequestFailure: vi.fn() }) }))
it('locks an uncertain payload across subsequent failures and retries the same key', async () => {
    setActivePinia(createPinia())
    const scope = effectScope()
    const write = vi
        .fn()
        .mockRejectedValueOnce(new ApiError('unexpected'))
        .mockRejectedValueOnce(new ApiError('validation'))
        .mockResolvedValue(undefined)
    const saved = vi.fn()
    const form = scope.run(() =>
        useMasterForm({
            resource: 'orders',
            initial: { notes: 'original' },
            snapshot: null,
            validate: () => ({}),
            write,
            recover: vi.fn(),
            saved,
        }),
    )
    if (!form) throw new Error('Missing scope')
    await form.save()
    expect(form.uncertain.value).toBe(true)
    const key = write.mock.calls[0]?.[2]
    await form.save()
    expect(form.uncertain.value).toBe(true)
    form.draft.value = { notes: 'changed' }
    await form.save()
    expect(write).toHaveBeenCalledTimes(2)
    form.draft.value = { notes: 'original' }
    await form.save()
    expect(write.mock.calls[2]?.[2]).toBe(key)
    expect(saved).toHaveBeenCalledOnce()
    expect(form.uncertain.value).toBe(false)
    scope.stop()
})
