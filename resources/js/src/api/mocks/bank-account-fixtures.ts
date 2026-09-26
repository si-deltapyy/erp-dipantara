import type { BankAccount } from '@/core/types/bank-account'
import { parseBankAccount } from '@/api/bank-account-mapper'

export const bankAccountFixtures: readonly BankAccount[] = Array.from(
    { length: 24 },
    (_, index) => {
        const number = String(index + 1).padStart(2, '0')
        const ownerType = index % 3 === 0 ? 'company' : index % 3 === 1 ? 'buyer' : 'mitra'
        const ownerNumber = String(Math.floor(index / 3) + 1).padStart(2, '0')
        return parseBankAccount({
            id: `demo-bank-account-${number}`,
            bankName: `Bank Simulasi ${number}`,
            accountNumber: `000-DEMO-${number}`,
            accountHolder: `Pemilik Simulasi ${number}`,
            ownerType,
            ownerId: ownerType === 'company' ? null : `demo-${ownerType}-${ownerNumber}`,
            version: 1,
            createdAt: `2026-01-${number}T00:00:00.000Z`,
            updatedAt: `2026-01-${number}T00:00:00.000Z`,
            createdByUserId: 'admin-demo',
            submittedByUserId: null,
            allowedActions: [],
        })
    },
)
