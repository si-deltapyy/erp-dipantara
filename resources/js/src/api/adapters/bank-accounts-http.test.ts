import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpBankAccounts } from './bank-accounts-http'
import { bankAccountFixtures } from '../mocks/bank-account-fixtures'
import { bankAccountDraft } from '@/core/domain/bank-account-validation'

test('maps all five contract operations with cancellation and explicit write identity', async () => {
    const client = axios.create()
    const bankAccount = bankAccountFixtures[0]
    if (!bankAccount) throw new Error('Missing fixture')
    const page = { data: [bankAccount], meta: { page: 1, perPage: 20, total: 1 } }
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: page })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { data: bankAccount } })
    const put = vi.spyOn(client, 'put').mockResolvedValue({ data: { data: bankAccount } })
    const api = createHttpBankAccounts(client)
    const signal = new AbortController().signal
    const query = { page: 1, perPage: 20, search: 'Demo', sort: '-createdAt' as const }
    expect(await api.list(query, signal)).toEqual(page)
    expect(get).toHaveBeenLastCalledWith('/api/v1/bank-accounts', { params: query, signal })
    get.mockResolvedValueOnce({
        data: { ...page, data: [{ id: bankAccount.id, label: bankAccount.bankName }] },
    })
    expect((await api.lookup(query, signal)).data[0]).toEqual({
        id: bankAccount.id,
        label: bankAccount.bankName,
    })
    expect(get).toHaveBeenLastCalledWith('/api/v1/bank-accounts/lookup', { params: query, signal })
    get.mockResolvedValueOnce({ data: { data: bankAccount } })
    expect(await api.get('bankAccount/a', signal)).toEqual(bankAccount)
    expect(get).toHaveBeenLastCalledWith('/api/v1/bank-accounts/bankAccount%2Fa', { signal })
    const options = { signal, idempotencyKey: 'attempt', snapshotGeneration: 'local-only' }
    const input = bankAccountDraft(bankAccount)
    await api.create(input, options)
    expect(post).toHaveBeenCalledWith('/api/v1/bank-accounts', input, {
        signal,
        headers: { 'Idempotency-Key': 'attempt' },
    })
    await api.update(bankAccount.id, { ...input, version: 1 }, options)
    expect(put).toHaveBeenCalledWith(
        `/api/v1/bank-accounts/${bankAccount.id}`,
        { ...input, version: 1 },
        { signal, headers: { 'Idempotency-Key': 'attempt' } },
    )
})
test('rejects malformed live responses and never replays a failed write', async () => {
    const client = axios.create()
    const post = vi.spyOn(client, 'post').mockRejectedValue(new Error('network'))
    vi.spyOn(client, 'get').mockResolvedValue({ data: { data: [{ id: 99 }] } })
    const api = createHttpBankAccounts(client)
    const signal = new AbortController().signal
    await expect(api.get('demo', signal)).rejects.toThrow()
    await expect(
        api.create(
            {
                bankName: 'Demo',
                accountNumber: '0001',
                accountHolder: 'Synthetic',
                ownerType: 'company',
                ownerId: null,
            },
            { signal, idempotencyKey: 'one' },
        ),
    ).rejects.toThrow('network')
    expect(post).toHaveBeenCalledTimes(1)
})
