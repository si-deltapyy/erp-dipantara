import { ref } from 'vue'

export const sessionScenarios = [
    'success',
    'invalid',
    'validation',
    'network',
    'slow',
    'expired',
    'logout-failure',
    'revoked',
] as const
export type SessionScenario = (typeof sessionScenarios)[number]
export const sessionScenario = ref<SessionScenario>('success')
export const sessionStorageAvailable = ref(true)
