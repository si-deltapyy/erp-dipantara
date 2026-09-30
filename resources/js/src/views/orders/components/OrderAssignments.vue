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
    <section class="panel space-y-4">
        <header class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">{{ t('assignments.title') }}</h2>
            <AppButton v-if="canCreate && !editing" @click="edit()">{{
                t('assignments.add')
            }}</AppButton>
        </header>
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
        <div v-else class="grid gap-4 lg:grid-cols-2">
            <article
                v-for="assignment in visible"
                :key="assignment.id"
                class="space-y-3 rounded-lg border border-line p-4"
            >
                <h3 class="font-semibold">{{ assignment.mitraName }}</h3>
                <p>{{ assignment.graderName }}</p>
                <p>{{ assignment.timberProductName }}</p>
                <p>{{ t('orders.quantityValue', { count: assignment.quantity }) }}</p>
                <AppButton
                    v-if="assignment.allowedActions.includes('update') && !editing"
                    variant="secondary"
                    @click="edit(assignment)"
                    >{{ t('assignments.edit') }}</AppButton
                ><MitraTerms
                    v-if="hasBusinessPermission(session.user, 'invoices.read')"
                    :purchase-order-id="order.purchaseOrderId"
                    :mitra-id="assignment.mitraId"
                />
            </article>
        </div>
        <AppPagination
            v-if="response"
            :page="page"
            :page-size="response.meta.perPage"
            :total="response.meta.total"
            @update:page="page = $event"
        />
    </section>
</template>
