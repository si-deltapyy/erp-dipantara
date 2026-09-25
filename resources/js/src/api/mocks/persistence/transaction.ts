import type { DemoStore, DemoTables } from './schema'
import { openDemoDatabase } from './database'
import type { DatabaseOptions } from './database'
import { normalizeStorageError } from './storage-error'

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}
export class DemoTransaction {
    constructor(private readonly transaction: IDBTransaction) {}
    get<K extends DemoStore>(store: K, id: string): Promise<DemoTables[K] | undefined> {
        return requestResult(this.transaction.objectStore(store).get(id))
    }
    list<K extends DemoStore>(store: K): Promise<DemoTables[K][]> {
        return requestResult(this.transaction.objectStore(store).getAll())
    }
    async put<K extends DemoStore>(store: K, record: DemoTables[K]): Promise<void> {
        await requestResult(this.transaction.objectStore(store).put(record))
    }
    async clear(store: DemoStore): Promise<void> {
        await requestResult(this.transaction.objectStore(store).clear())
    }
    count(store: DemoStore): Promise<number> {
        return requestResult(this.transaction.objectStore(store).count())
    }
}
function trackCompletion(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onabort = () =>
            reject(transaction.error ?? new DOMException('Transaction aborted', 'AbortError'))
        transaction.onerror = () => undefined
    })
}
export async function runDemoTransaction<T>(
    options: DatabaseOptions,
    stores: readonly DemoStore[],
    mode: IDBTransactionMode,
    execute: (transaction: DemoTransaction) => Promise<T>,
    signal?: AbortSignal,
): Promise<T> {
    signal?.throwIfAborted()
    const database = await openDemoDatabase(options)
    try {
        return await executeTransaction(database, stores, mode, execute, signal)
    } finally {
        database.close()
    }
}
async function executeTransaction<T>(
    database: IDBDatabase,
    stores: readonly DemoStore[],
    mode: IDBTransactionMode,
    execute: (transaction: DemoTransaction) => Promise<T>,
    signal?: AbortSignal,
): Promise<T> {
    signal?.throwIfAborted()
    const transaction = database.transaction([...stores], mode)
    const completed = trackCompletion(transaction)
    void completed.catch(() => undefined)
    const abort = (): void => {
        try {
            transaction.abort()
        } catch {
            return
        }
    }
    signal?.addEventListener('abort', abort, { once: true })
    try {
        const result = await execute(new DemoTransaction(transaction))
        await completed
        return result
    } catch (cause) {
        abort()
        await completed.catch(() => undefined)
        throw normalizeStorageError(cause)
    } finally {
        signal?.removeEventListener('abort', abort)
    }
}
