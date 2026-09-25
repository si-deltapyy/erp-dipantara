import axios from 'axios'
import { expect, test, vi } from 'vitest'
import { createHttpSession } from './session-http'
const user = { id: '1', displayName: 'Example', roles: [], permissions: [] }
test('uses the Breeze endpoints, abort signal, and response mapper', async () => {
    const client = axios.create()
    const get = vi.spyOn(client, 'get').mockResolvedValue({ data: { user } })
    const post = vi.spyOn(client, 'post').mockResolvedValue({ data: { user } })
    const session = createHttpSession(client)
    const signal = new AbortController().signal
    expect(await session.getSession(signal)).toMatchObject(user)
    expect(get).toHaveBeenCalledWith('/auth/session', { signal })
    const input = { email: 'example@woodflow.test', password: 'simulation' }
    await session.login(input, signal)
    expect(post).toHaveBeenCalledWith('/login', input, { signal })
    await session.logout(signal)
    expect(post).toHaveBeenLastCalledWith('/logout', {}, { signal })
    session.clear()
    expect(post).toHaveBeenCalledTimes(2)
})
test('never substitutes a mock user for a failed live login', async () => {
    const client = axios.create()
    vi.spyOn(client, 'post').mockResolvedValue({ data: { user: null } })
    await expect(
        createHttpSession(client).login({ email: '', password: '' }, new AbortController().signal),
    ).rejects.toMatchObject({ kind: 'unexpected' })
})
