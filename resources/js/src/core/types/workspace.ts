export type WorkspaceIcon =
    'home' | 'layers' | 'document' | 'truck' | 'wallet' | 'chart' | 'users' | 'box' | 'check'

export interface WorkspaceLink {
    readonly key: string
    readonly label: string
    readonly icon: WorkspaceIcon
    readonly disabled?: boolean
}

export interface WorkspaceGroup {
    readonly label: string
    readonly links: readonly WorkspaceLink[]
}
