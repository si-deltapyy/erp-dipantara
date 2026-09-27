import { computed, onScopeDispose } from 'vue'
import type { ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { isRequestCancelled } from '@/services/api-error'
import { loginDestination } from '@/router/login-destination'
import { createLoginFields, validateLogin, reportLoginFailure } from './login-fields'
import type { LoginFields } from './login-fields'

interface LoginForm extends LoginFields {
    pending: ComputedRef<boolean>
    submit: () => Promise<void>
}
export function useLoginForm(): LoginForm {
    const session = useSession()
    const store = useSessionStore()
    const router = useRouter()
    const route = useRoute()
    const fields = createLoginFields()
    const pending = computed(() => store.pending)
    async function submit(): Promise<void> {
        if (pending.value || !validateLogin(fields)) return
        try {
            if (
                await session.login({ email: fields.email.value, password: fields.password.value })
            ) {
                await router.replace(loginDestination(router, route.query.returnTo, store.user))
            }
        } catch (cause: unknown) {
            if (!isRequestCancelled(cause)) reportLoginFailure(fields, cause)
        } finally {
            fields.password.value = ''
        }
    }
    onScopeDispose(() => {
        fields.password.value = ''
        session.cancel()
    })
    return { ...fields, pending, submit }
}
