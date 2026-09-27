import type { Mitra } from '@/core/types/mitra'
import { parseMitra } from '@/api/mitra-mapper'

export const mitraFixtures: readonly Mitra[] = Array.from({ length: 24 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0')
    return parseMitra({
        id: `demo-mitra-${number}`,
        name: `Mitra Simulasi ${number}`,
        phone: '',
        address: `Alamat sintetis ${number}`,
        createdAt: `2026-08-${number}T00:00:00Z`,
        updatedAt: `2026-08-${number}T00:00:00Z`,
        createdByUserId: 'admin-demo',
        submittedByUserId: null,
        version: 1,
        allowedActions: [],
    })
})
