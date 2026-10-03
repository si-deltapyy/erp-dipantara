declare module 'nice-select2' {
    export default class NiceSelect {
        constructor(element: HTMLSelectElement, options: { searchable: boolean })
        dropdown: HTMLDivElement
        update(): void
        destroy(): void
    }
    export function bind(element: HTMLSelectElement, options: { searchable: boolean }): NiceSelect
}
