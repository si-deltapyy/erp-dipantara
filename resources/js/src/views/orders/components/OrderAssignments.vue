<script setup lang="ts">
import MitraTerms from './MitraTerms.vue'
import { useSessionStore } from '@/stores/session'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { computed, ref, shallowRef, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order } from '@/core/types/order'
import type { Assignment } from '@/core/types/assignment'
import { useOrderAssignments } from '../composables/useOrderAssignments'
import { useAssignmentRecoveryStore } from '@/stores/assignment-recovery'
import AssignmentEditor from './AssignmentEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const props = defineProps<{ order: Order }>()
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const recovery = useAssignmentRecoveryStore()
const selected = shallowRef<Assignment | undefined>(
    recovery.snapshot?.draft.orderId === props.order.id ? recovery.snapshot.assignment : undefined,
)
const editing = ref(recovery.snapshot?.draft.orderId === props.order.id)
const { response, page, loading, error, canCreate, refresh } = useOrderAssignments(
    toRef(props, 'order'),
)
const visible = computed(() => response.value?.data ?? [])
function edit(assignment?: Assignment): void {
    selected.value = assignment
    editing.value = true
}
function saved(): void {
    editing.value = false
    selected.value = undefined
    emit('changed')
}
</script>
<template>
    <AppPanel :title="t('assignments.title')" class="space-y-4">
        <template #actions>
            <AppButton v-if="canCreate && !editing" @click="edit()">{{
                t('assignments.add')
            }}</AppButton>
        </template>
        <AssignmentEditor
            v-if="editing"
            :key="selected?.id ?? 'new'"
            :order="order"
            :assignment="selected"
            @saved="saved"
            @cancel="editing = false"
        />
        <p v-if="loading" role="status">{{ t('assignments.loading') }}</p>
        <div v-else-if="error" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('orders.refresh') }}</AppButton>
        </div>
        <p v-else-if="!visible.length">{{ t('assignments.empty') }}</p>
        <div v-else class="divide-y divide-line">
            <article v-for="assignment in visible" :key="assignment.id" class="space-y-4 py-5">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <h3 class="break-words font-semibold">{{ assignment.mitraName }}</h3>
                    <AppButton
                        v-if="assignment.allowedActions.includes('update') && !editing"
                        variant="secondary"
                        @click="edit(assignment)"
                        >{{ t('assignments.edit') }}</AppButton
                    >
                </div>
                <dl
                    class="grid gap-4 sm:grid-cols-3 [&_dd]:mt-1 [&_dd]:break-words [&_dt]:text-xs [&_dt]:text-muted"
                >
                    <div>
                        <dt>{{ t('assignments.grader') }}</dt>
                        <dd>{{ assignment.graderName }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('assignments.timber') }}</dt>
                        <dd>{{ assignment.timberProductName }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('assignments.quantity') }}</dt>
                        <dd class="font-semibold">
                            {{ t('orders.quantityValue', { count: assignment.quantity }) }}
                        </dd>
                    </div>
                </dl>
                <MitraTerms
                    v-if="hasBusinessPermission(session.user, 'invoices.read')"
                    :purchase-order-id="order.purchaseOrderId"
                    :mitra-id="assignment.mitraId"
                />
            </article>
        </div>
        <template #footer
            ><AppPagination
                v-if="response"
                numbered
                :disabled="loading"
                :page="page"
                :page-size="response.meta.perPage"
                :total="response.meta.total"
                @update:page="page = $event"
        /></template>
    </AppPanel>
</template>
