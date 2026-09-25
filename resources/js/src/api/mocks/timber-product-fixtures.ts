import type { TimberProduct } from '@/core/types/timber-product'
import { parseTimberProduct } from '@/api/timber-product-mapper'
import { simulateTimberVolume } from './timber-volume'

export const timberProductFixtures: readonly TimberProduct[] = Array.from(
    { length: 24 },
    (_, index) => {
        const number = String(index + 1).padStart(2, '0')
        const diameterCm = `${19 + index}.00`
        return parseTimberProduct({
            id: `demo-timber-${number}`,
            name: `Kayu Simulasi ${number}`,
            gradeCode: 'DEMO',
            diameterCm,
            lengthM: '2.00',
            volumeM3: simulateTimberVolume(diameterCm, '2.00'),
            purchasePrice: '100000.00',
            salePrice: '150000.00',
            createdAt: `2026-08-${number}T00:00:00Z`,
            updatedAt: `2026-08-${number}T00:00:00Z`,
            createdByUserId: 'admin-demo',
            submittedByUserId: null,
            version: 1,
            allowedActions: [],
        })
    },
)
