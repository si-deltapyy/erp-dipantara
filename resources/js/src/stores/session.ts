import { defineStore } from 'pinia'
import type { SessionStatus, SessionUser } from '@/core/types/session'

export const useSessionStore = defineStore('session', {
    state: (): { status: SessionStatus; user: SessionUser | null; pending: boolean } => ({
        status: 'unknown',
        user: null,
        pending: false,
    }),
})
