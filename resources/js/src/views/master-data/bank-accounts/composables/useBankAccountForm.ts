import { inject, watch } from 'vue'
import { bankAccountsApiKey } from '@/api/bank-accounts-api'
import type { BankAccount, BankAccountInput } from '@/core/types/bank-account'
import {
    bankAccountDraft,
    emptyBankAccount,
    validateBankAccount,
} from '@/core/domain/bank-account-validation'
import { useSessionStore } from '@/stores/session'
import { useBankAccountRecoveryStore } from '@/stores/bank-account-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useBankAccountForm(
    bankAccount: BankAccount | undefined,
    saved: () => void,
): ReturnType<typeof useMasterForm<BankAccountInput>> {
    const api = inject(bankAccountsApiKey)
    if (!api) throw new Error('BankAccounts API is not configured')
    const store = useSessionStore()
    const recovery = useBankAccountRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.$reset()
    const form = useMasterForm<BankAccountInput>({
        resource: 'bank-accounts',
        initial: bankAccount ? bankAccountDraft(bankAccount) : emptyBankAccount(),
        snapshot,
        validate: validateBankAccount,
        write: (draft, signal, idempotencyKey) => {
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: bankAccount?.snapshotGeneration,
            }
            return bankAccount
                ? api.update(bankAccount.id, { ...draft, version: bankAccount.version }, options)
                : api.create(draft, options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, bankAccount, draft, idempotencyKey }
        },
        saved,
    })
    watch(form.draft, (current, previous) => {
        form.errors.value = Object.fromEntries(
            Object.entries(form.errors.value).filter(
                ([field]) =>
                    current[field as keyof BankAccountInput] ===
                    previous[field as keyof BankAccountInput],
            ),
        )
    })
    return form
}
