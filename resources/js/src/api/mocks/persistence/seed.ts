import { timberProductFixtures } from '../timber-product-fixtures'
import type { DemoTransaction } from './transaction'
import { demoDatasetVersion, demoStores } from './schema'
import type { DatasetMetadata, DemoSample } from './schema'
import { mitraFixtures } from '../mitra-fixtures'
import { buyerFixtures } from '../buyer-fixtures'

export const demoSamples: readonly DemoSample[] = [
    {
        id: 'demo-sample-one',
        label: 'demo.sampleOne',
        createdByUserId: 'admin-demo',
        submittedByUserId: null,
        graderUserId: 'grader-one',
        version: 1,
        quantity: 0,
    },
    {
        id: 'demo-sample-two',
        label: 'demo.sampleTwo',
        createdByUserId: 'admin-demo',
        submittedByUserId: null,
        graderUserId: 'grader-two',
        version: 1,
        quantity: 0,
    },
]
export async function seedDataset(
    transaction: DemoTransaction,
    revision: number,
): Promise<DatasetMetadata> {
    for (const store of demoStores) await transaction.clear(store)
    const metadata: DatasetMetadata = {
        id: 'dataset',
        datasetVersion: demoDatasetVersion,
        generation: crypto.randomUUID(),
        revision,
    }
    await transaction.put('metadata', metadata)
    for (const sample of demoSamples) await transaction.put('samples', sample)
    for (const mitra of mitraFixtures) await transaction.put('mitras', mitra)
    for (const product of timberProductFixtures) await transaction.put('timber-products', product)
    for (const buyer of buyerFixtures) await transaction.put('buyers', buyer)
    await transaction.put('blobs', {
        id: 'demo-attachment-one',
        sampleId: 'demo-sample-one',
        fileName: 'simulation.txt',
        content: new Blob(['Synthetic persistence fixture'], { type: 'text/plain' }),
    })
    return metadata
}
