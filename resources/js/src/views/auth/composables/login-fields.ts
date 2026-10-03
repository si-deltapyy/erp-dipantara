import { formValidationKey } from '@/core/types/form-validation'
import { ref, watch, provide } from 'vue'
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
    const fields: LoginFields = {
        email: ref(''),
        password: ref(''),
        emailError: ref(''),
        passwordError: ref(''),
        error: ref(''),
    }
    const touched = new Set<string>()
    function validateField(field: string, edited = false): void {
        if (field !== 'email' && field !== 'password') return
        touched.add(field)
        const error = field === 'email' ? fields.emailError.value : fields.passwordError.value
        if (!edited && error && !['auth.invalidEmail', 'auth.requiredPassword'].includes(error))
            return
        if (field === 'email') fields.emailError.value = loginEmailError(fields.email.value)
        else fields.passwordError.value = fields.password.value ? '' : 'auth.requiredPassword'
    }
    provide(formValidationKey, validateField)
    watch(fields.email, () => {
        if (touched.has('email') || fields.emailError.value) validateField('email', true)
    })
    watch(fields.password, () => {
        if (touched.has('password') || fields.passwordError.value) validateField('password', true)
    })
    return fields
}
export function validateLogin(fields: LoginFields): boolean {
    fields.emailError.value = loginEmailError(fields.email.value)
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

function loginEmailError(email: string): string {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 255
        ? ''
        : 'auth.invalidEmail'
}
