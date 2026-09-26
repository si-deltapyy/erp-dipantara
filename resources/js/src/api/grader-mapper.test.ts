import { expect, test } from 'vitest'
import { parseGrader, parseGraderInput, parseGraderProvision } from './grader-mapper'
import { graderFixtures } from './mocks/grader-fixtures'
import { canEditGraderEmail, canProvisionGrader } from '@/core/domain/grader-policy'
import { presentGrader, requireGraderPermission } from './mocks/grader-policy'
import { sessionFixtures } from './mocks/session-fixtures'

const input = {
    name: ' Synthetic Grader ',
    email: ' CONTACT@WOODFLOW.TEST ',
    phone: '',
    address: '',
}
test('normalizes identity without accepting credentials or extra request fields', () => {
    expect(parseGraderInput(input)).toEqual({
        ...input,
        name: 'Synthetic Grader',
        email: 'contact@woodflow.test',
    })
    for (const email of ['', 'invalid', 'a b@woodflow.test'])
        expect(() => parseGraderInput({ ...input, email })).toThrow()
    expect(() => parseGraderInput({ ...input, password: 'forbidden-field' })).toThrow()
    expect(() => parseGraderInput({ ...input, version: 0 }, true)).toThrow()
    expect(parseGraderProvision({ version: 2 })).toEqual({ version: 2 })
    expect(() => parseGraderProvision({ version: 2, status: 'active' })).toThrow()
})
test('validates status and separates grader identity from account identity', () => {
    const grader = graderFixtures[0]
    if (!grader) throw new Error('Missing fixture')
    expect(parseGrader(grader).userId).not.toBe(grader.id)
    expect(() => parseGrader({ ...grader, userId: grader.id })).toThrow()
    expect(() => parseGrader({ ...grader, userId: null })).toThrow()
    expect(() => parseGrader({ ...grader, provisioningStatus: 'not_provisioned' })).toThrow()
    expect(() => parseGrader({ ...grader, provisioningStatus: 'unknown' })).toThrow()
    expect(
        parseGrader({ ...grader, provisioningStatus: 'pending_activation', userId: null }).userId,
    ).toBeNull()
})
test.each(['not_provisioned', 'pending_activation', 'active'] as const)(
    'owns email and provisioning policy for %s',
    (status) => {
        expect(canEditGraderEmail(status)).toBe(status === 'not_provisioned')
        expect(canProvisionGrader(status)).toBe(status === 'not_provisioned')
    },
)
test('requires explicit permissions and offers provisioning only for eligible records', () => {
    const actor = sessionFixtures[0]
    const grader = graderFixtures[3]
    if (!actor || !grader) throw new Error('Missing fixture')
    const reader = { ...actor, permissions: ['graders.read.all'] }
    expect(presentGrader(grader, reader).allowedActions).toEqual([])
    expect(() => requireGraderPermission(reader, 'provision')).toThrow()
    expect(() =>
        requireGraderPermission({ ...reader, permissions: ['graders.lookup.own'] }, 'lookup'),
    ).toThrow()
    const provisioner = { ...actor, permissions: ['graders.provision.all'] }
    expect(presentGrader(grader, provisioner).allowedActions).toEqual(['provision'])
    expect(
        presentGrader({ ...grader, provisioningStatus: 'pending_activation' }, provisioner)
            .allowedActions,
    ).toEqual([])
})
