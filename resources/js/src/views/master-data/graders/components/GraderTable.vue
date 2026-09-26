<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { canProvisionGrader } from '@/core/domain/grader-policy'
import type { Grader } from '@/core/types/grader'
import type { TableColumn } from '@/core/types/table'
import GraderStatus from './GraderStatus.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
defineProps<{
    graders: readonly Grader[]
    state: 'ready' | 'loading' | 'error'
    canUpdate: boolean
    canProvision: boolean
}>()
defineEmits<{ edit: [grader: Grader]; provision: [grader: Grader]; retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Grader>[]>(() => [
    { key: 'name', label: t('graders.name') },
    { key: 'email', label: t('graders.email') },
    { key: 'provisioningStatus', label: t('graders.status') },
    { key: 'phone', label: t('graders.phone') },
    { key: 'address', label: t('graders.address') },
    { key: 'allowedActions', label: t('graders.actions') },
])
</script>
<template>
    <AppTable
        :rows="graders"
        :columns="columns"
        :row-key="(grader) => grader.id"
        :caption="t('graders.list')"
        :state="state"
        @retry="$emit('retry')"
    >
        <template #cell-name="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words font-semibold">{{
                row.name
            }}</span></template
        >
        <template #cell-email="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words">{{
                row.email
            }}</span></template
        >
        <template #cell-provisioningStatus="{ row }"
            ><GraderStatus :status="row.provisioningStatus"
        /></template>
        <template #cell-phone="{ row }">{{ row.phone || '—' }}</template>
        <template #cell-address="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words text-muted">{{
                row.address || '—'
            }}</span></template
        >

        <template #cell-allowedActions="{ row }">
            <div class="flex flex-wrap gap-2">
                <AppButton
                    v-if="canUpdate && row.allowedActions.includes('update')"
                    variant="secondary"
                    :aria-label="t('graders.edit') + ': ' + row.name"
                    @click="$emit('edit', row)"
                    >{{ t('graders.edit') }}</AppButton
                >
                <AppButton
                    v-if="
                        canProvision &&
                        canProvisionGrader(row.provisioningStatus) &&
                        row.allowedActions.includes('provision')
                    "
                    variant="secondary"
                    :aria-label="t('graders.provision') + ': ' + row.name"
                    @click="$emit('provision', row)"
                    >{{ t('graders.provision') }}</AppButton
                >
            </div>
        </template>
    </AppTable>
</template>
