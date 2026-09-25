import type { Buyer } from '@/core/types/buyer'
import { parseBuyer } from '@/api/buyer-mapper'

export const buyerFixtures: readonly Buyer[] = Array.from({ length: 24 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0')
    return parseBuyer({
        id: `demo-buyer-${number}`,
        companyName: `Perusahaan Simulasi ${number}`,
        contactName: `Kontak Demo ${number}`,
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
