import { timberProductFixtures } from '../timber-product-fixtures'
import { demoSchemaVersion, demoStores } from './schema'
import { DemoStorageError, normalizeStorageError } from './storage-error'
import { mitraFixtures } from '../mitra-fixtures'
import { buyerFixtures } from '../buyer-fixtures'

export interface DatabaseOptions {
    readonly name?: string
    readonly factory?: IDBFactory
}
export function openDemoDatabase(options: DatabaseOptions = {}): Promise<IDBDatabase> {
    const factory = options.factory ?? globalThis.indexedDB
    if (!factory) return Promise.reject(new DemoStorageError('unavailable'))
    return new Promise((resolve, reject) => {
        let abandoned = false
        let request: IDBOpenDBRequest
        try {
            request = factory.open(options.name ?? 'woodflow-demo', demoSchemaVersion)
        } catch (cause) {
            reject(normalizeStorageError(cause))
            return
        }
        request.onblocked = () => {
            abandoned = true
            reject(new DemoStorageError('blocked'))
        }
        request.onerror = () => reject(normalizeStorageError(request.error))
        request.onupgradeneeded = (event) => {
            if (abandoned) {
                request.transaction?.abort()
                return
            }
            for (const store of demoStores)
                if (!request.result.objectStoreNames.contains(store))
                    request.result.createObjectStore(store, { keyPath: 'id' })
            if (event.oldVersion > 0 && event.oldVersion < 4)
                for (const product of timberProductFixtures)
                    request.transaction?.objectStore('timber-products').put(product)
            if (event.oldVersion === 1)
                for (const buyer of buyerFixtures)
                    request.transaction?.objectStore('buyers').put(buyer)
            if (event.oldVersion > 0 && event.oldVersion < 3)
                for (const mitra of mitraFixtures)
                    request.transaction?.objectStore('mitras').put(mitra)
        }
        request.onsuccess = () => {
            const database = request.result
            if (abandoned) {
                database.close()
                return
            }
            database.onversionchange = () => database.close()
            resolve(database)
        }
    })
}
