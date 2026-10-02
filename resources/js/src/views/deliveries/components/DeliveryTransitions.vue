<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'

import { reactive, watch, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Delivery } from '@/core/types/delivery'
import { useSessionStore } from '@/stores/session'
import { useDeliveryTransition } from '../composables/useDeliveryTransition'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ delivery: Delivery }>()
const emit = defineEmits<{ changed: [delivery: Delivery]; locked: [locked: boolean] }>()
const { t } = useI18n()
const session = useSessionStore()
const current = shallowRef<Delivery>(props.delivery)
const dispatch = reactive(useDeliveryTransition(current, 'dispatch'))
const receive = reactive(useDeliveryTransition(current, 'receive'))
watch(
    () => props.delivery,
    (delivery) => {
        current.value = delivery
    },
)
watch(current, (delivery) => {
    if (delivery !== props.delivery) emit('changed', delivery)
})
watch(
    () => dispatch.pending || dispatch.uncertain || receive.pending || receive.uncertain,
    (locked) => emit('locked', locked),
)
useUnsavedChanges(
    () => false,
    () => session.status === 'authenticated' && (dispatch.pending || receive.pending),
)
</script>
<template>
    <AppPanel
        v-if="
            dispatch.canSubmit ||
            receive.canSubmit ||
            dispatch.error ||
            receive.error ||
            (delivery.status === 'draft' &&
                session.user?.permissions.includes('deliveries.dispatch.all'))
        "
        :title="t('deliveries.transitions')"
        class="space-y-4 break-words"
    >
        <p v-if="delivery.status === 'draft' && delivery.documents.length < 2">
            {{ t('deliveries.incompleteDocuments') }}
        </p>
        <template
            v-for="entry in [
                { action: 'dispatch', state: dispatch },
                { action: 'receive', state: receive },
            ]"
            :key="entry.action"
            ><div v-if="entry.state.error" role="alert">
                <p>{{ t(entry.state.error) }}</p>
                <p v-if="entry.state.uncertain">{{ t('deliveries.uncertain') }}</p>
            </div>
            <AppButton
                v-if="entry.state.canSubmit"
                :pending="entry.state.pending"
                @click="entry.state.confirming = true"
                >{{
                    t(
                        entry.state.uncertain
                            ? 'deliveries.retryWrite'
                            : 'deliveries.' + entry.action,
                    )
                }}</AppButton
            ><AppConfirmDialog
                :open="entry.state.confirming"
                :title="t('deliveries.' + entry.action)"
                :description="t('deliveries.' + entry.action + 'Description')"
                @confirm="entry.state.submit"
                @cancel="entry.state.confirming = false"
        /></template>
    </AppPanel>
</template>
