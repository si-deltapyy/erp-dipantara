import { expect, test } from 'vitest'
import { canAccess, internalDestination } from './access-policy'
import type { SessionUser } from '@/core/types/session'
const grader: SessionUser = {
    id: 'grader',
    displayName: 'Grader',
    roles: ['grader'],
    permissions: [],
    developmentCapabilities: [],
}
test('requires every permission regardless of role names', () => {
    expect(canAccess(grader, [])).toBe(true)
    expect(canAccess(grader, ['view reports'])).toBe(false)
    expect(canAccess(null, [])).toBe(false)
    expect(
        canAccess({ ...grader, roles: ['future'], permissions: ['view reports'] }, [
            'view reports',
        ]),
    ).toBe(true)
    expect(canAccess({ ...grader, roles: ['admin'] }, ['view reports'])).toBe(false)
    expect(
        canAccess({ ...grader, roles: [], permissions: ['view reports'] }, ['view reports']),
    ).toBe(true)
    expect(canAccess(grader, [], 'development.ui.view')).toBe(false)
})

test.each([
    'https://outside.test',
    '//outside.test',
    '/application/',
    '/app/../login',
    '/app/%2foutside',
    '/app/%2e%2e/login',
    '/app/\\outside',
    '/app/\nlogin',
    null,
    ['x'],
])('rejects unsafe return destination %s', (value) => {
    expect(internalDestination(value)).toBe('/')
})
test('preserves a local path with query and hash', () => {
    expect(internalDestination('/app/development/ui?page=2#form')).toBe(
        '/development/ui?page=2#form',
    )
})
