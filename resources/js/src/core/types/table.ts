export interface TableColumn<Row> {
    readonly key: Extract<keyof Row, string>
    readonly label: string
    readonly sortable?: boolean
}
export interface TableSort {
    readonly key: string
    readonly direction: 'asc' | 'desc'
}
