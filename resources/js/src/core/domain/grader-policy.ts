import type { GraderProvisioningStatus } from '@/core/types/grader'

export function canEditGraderEmail(status: GraderProvisioningStatus): boolean {
    return status === 'not_provisioned'
}
export function canProvisionGrader(status: GraderProvisioningStatus): boolean {
    return status === 'not_provisioned'
}
