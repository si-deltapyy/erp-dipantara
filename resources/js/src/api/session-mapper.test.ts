import { expect, test } from 'vitest'
import { parseSession } from './session-mapper'
const user = { id: '1', displayName: 'Example', roles: ['future'], permissions: ['view reports'] }
test('accepts guests and copies only public session fields', () => {
    expect(parseSession({ user: null })).toBeNull()
    expect(
        parseSession({ user: { ...user, developmentCapabilities: ['development.ui.view'] } }),
    ).toEqual({ ...user, developmentCapabilities: [] })
})
test.each([
    undefined,
    {},
    { user: {} },
    { user: { ...user, id: 1 } },
    { user: { ...user, permissions: [false] } },
    { user: { ...user, roles: null } },
])('rejects malformed session responses', (response) => {
    expect(() => parseSession(response)).toThrow('unexpected')
})
