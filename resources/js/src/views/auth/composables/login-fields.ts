import { ref } from 'vue'
import type { Ref } from 'vue'
import { normalizeApiError } from '@/services/api-error'
import type { ApiErrorKind } from '@/core/types/api-error'

const failureMessages: Partial<Record<ApiErrorKind, string>> = {
    csrf: 'auth.csrf',
    'rate-limited': 'auth.rateLimited',
    validation: 'auth.errors',
    unauthenticated: 'auth.invalid',
    network: 'auth.network',
}

export interface LoginFields {
    email: Ref<string>
    password: Ref<string>
    emailError: Ref<string>
    passwordError: Ref<string>
    error: Ref<string>
}
export function createLoginFields(): LoginFields {
    return {
        email: ref(''),
        password: ref(''),
        emailError: ref(''),
        passwordError: ref(''),
        error: ref(''),
    }
}
export function validateLogin(fields: LoginFields): boolean {
    fields.emailError.value = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim())
        ? ''
        : 'auth.invalidEmail'
    fields.passwordError.value = fields.password.value ? '' : 'auth.requiredPassword'
    fields.error.value = ''
    return !fields.emailError.value && !fields.passwordError.value
}
export function reportLoginFailure(fields: LoginFields, cause: unknown): void {
    const failure = normalizeApiError(cause)
    fields.emailError.value = failure.fieldErrors.email?.[0] ?? ''
    fields.passwordError.value = failure.fieldErrors.password?.[0] ?? ''
    fields.error.value = failureMessages[failure.kind] ?? 'auth.failure'
}
