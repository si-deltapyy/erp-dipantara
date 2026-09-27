import { onMounted, onScopeDispose, watch } from 'vue'
import type { Ref } from 'vue'
import { retainDialogFocus } from './dialog-focus'

export function useDialog(
    dialog: Ref<HTMLDialogElement | undefined>,
    isOpen: () => boolean,
    initialFocus?: () => string | undefined,
): { retainFocus: (event: KeyboardEvent) => void } {
    let restoreOverflow: string | undefined
    let previousFocus: HTMLElement | null = null
    function close(): void {
        dialog.value?.close()
        if (restoreOverflow === undefined) return
        document.body.style.overflow = restoreOverflow
        restoreOverflow = undefined
        if (previousFocus?.isConnected) previousFocus.focus()
    }
    function synchronize(): void {
        if (!isOpen()) {
            close()
            return
        }
        if (!dialog.value || dialog.value.open) return
        previousFocus =
            document.activeElement instanceof HTMLElement ? document.activeElement : null
        restoreOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        dialog.value.showModal()
        const target = initialFocus?.()
        if (target) dialog.value.querySelector<HTMLElement>(target)?.focus()
    }
    onMounted(synchronize)
    watch(isOpen, synchronize, { flush: 'post' })
    onScopeDispose(close)
    return { retainFocus: (event) => retainDialogFocus(dialog.value, event) }
}
