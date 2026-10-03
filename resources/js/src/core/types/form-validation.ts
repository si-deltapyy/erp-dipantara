import type { InjectionKey } from 'vue'

export const formValidationKey: InjectionKey<(field: string) => void> = Symbol('formValidation')
