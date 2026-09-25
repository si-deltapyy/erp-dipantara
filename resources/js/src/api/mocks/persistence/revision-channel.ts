export interface RevisionNotice {
    readonly generation: string
    readonly revision: number
}
export class RevisionChannel {
    private readonly channel: BroadcastChannel | undefined
    private readonly listeners = new Set<() => void>()
    constructor(name = 'woodflow-demo-revisions') {
        try {
            this.channel =
                typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(name)
            if (this.channel)
                this.channel.onmessage = (event: MessageEvent<unknown>) => {
                    const notice = event.data
                    if (
                        !notice ||
                        typeof notice !== 'object' ||
                        !('generation' in notice) ||
                        typeof notice.generation !== 'string' ||
                        !('revision' in notice) ||
                        !Number.isSafeInteger(notice.revision)
                    )
                        return
                    this.notify()
                }
        } catch {
            this.channel = undefined
        }
    }
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener)
        return () => {
            this.listeners.delete(listener)
        }
    }
    publish(notice: RevisionNotice): void {
        try {
            this.channel?.postMessage({ generation: notice.generation, revision: notice.revision })
        } catch {
            this.notify()
            return
        }
        this.notify()
    }
    private notify(): void {
        for (const listener of this.listeners) listener()
    }
    dispose(): void {
        this.channel?.close()
        this.listeners.clear()
    }
}
