import type { Grader } from '@/core/types/grader'
import { parseGrader } from '@/api/grader-mapper'

export const graderFixtures: readonly Grader[] = Array.from({ length: 24 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0')
    const provisioningStatus =
        index < 2 ? 'active' : index === 2 ? 'pending_activation' : 'not_provisioned'
    return parseGrader({
        id: 'demo-grader-' + number,
        name: 'Grader Simulasi ' + number,
        email:
            index < 2
                ? 'grader' + (index + 1) + '@woodflow.test'
                : 'grader-demo-' + number + '@woodflow.test',
        phone: '',
        address: 'Alamat sintetis ' + number,
        provisioningStatus,
        userId: index === 0 ? 'grader-one' : index === 1 ? 'grader-two' : null,
        version: 1,
        createdAt: '2026-08-' + number + 'T00:00:00Z',
        updatedAt: '2026-08-' + number + 'T00:00:00Z',
        createdByUserId: 'admin-demo',
        submittedByUserId: null,
        allowedActions: [],
    })
})
