export function retainDialogFocus(
    dialog: HTMLDialogElement | undefined,
    event: KeyboardEvent,
): void {
    if (event.key !== 'Tab') return
    const controls = [
        ...(dialog?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ) ?? []),
    ].filter((control) => control.getClientRects().length > 0)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (!first) {
        event.preventDefault()
        dialog?.focus()
        return
    }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault()
        last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
    }
}
