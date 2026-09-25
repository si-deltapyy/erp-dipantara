import { onScopeDispose, ref } from 'vue'
import type { Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

interface UnsavedChanges {
    readonly confirming: Ref<boolean>
    requestDiscard(action: () => void): void
    confirm(): void
    cancel(): void
}
export function useUnsavedChanges(dirty: () => boolean, pending: () => boolean): UnsavedChanges {
    const confirming = ref(false)
    let decision: ((accepted: boolean) => void) | undefined
    function finish(accepted: boolean): void {
        confirming.value = false
        decision?.(accepted)
        decision = undefined
    }
    function requestDiscard(action: () => void): void {
        if (pending()) return
        if (!dirty()) return action()
        confirming.value = true
        decision = (accepted) => {
            if (accepted) action()
        }
    }
    onBeforeRouteLeave(() => {
        if (pending()) return false
        if (!dirty()) return true
        confirming.value = true
        return new Promise<boolean>((resolve) => {
            decision = resolve
        })
    })
    const beforeUnload = (event: BeforeUnloadEvent): void => {
        if (!dirty() && !pending()) return
        event.preventDefault()
        event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    onScopeDispose(() => {
        window.removeEventListener('beforeunload', beforeUnload)
        finish(false)
    })
    return { confirming, requestDiscard, confirm: () => finish(true), cancel: () => finish(false) }
}
