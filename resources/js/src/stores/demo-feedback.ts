import { defineStore } from 'pinia'
export const useDemoFeedbackStore = defineStore('demo-feedback', {
    state: () => ({ actorId: '', errorKey: '' }),
})
