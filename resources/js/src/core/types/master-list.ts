export interface MasterListQuery {
    readonly page: number
    readonly perPage: number
    readonly search: string
    readonly sort: 'createdAt' | '-createdAt'
}
