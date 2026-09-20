export function waitForMock(delay: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException('Request aborted', 'AbortError'))
            return
        }
        const cancel = (): void => {
            clearTimeout(timer)
            reject(new DOMException('Request aborted', 'AbortError'))
        }
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', cancel)
            resolve()
        }, delay)
        signal.addEventListener('abort', cancel, { once: true })
    })
}
