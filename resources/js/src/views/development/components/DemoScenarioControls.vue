<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppSelect from '@/components/ui/AppSelect.vue'
import { operationScenarios } from '@/api/mocks/operation-controls'
import type {
    DemoOperation,
    OperationControl,
    OperationScenario,
} from '@/api/mocks/operation-controls'
defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ configure: [operation: DemoOperation, control: OperationControl] }>()
const { t } = useI18n()
const operation = ref<DemoOperation>('update')
const scenario = ref<OperationScenario>('success')
const latency = ref('0')
const options = computed(() =>
    operationScenarios
        .filter((entry) =>
            operation.value === 'read' ? entry !== 'committed-timeout' : entry !== 'empty',
        )
        .map((value) => ({ value, label: t(`demo.scenarios.${value}`) })),
)
watch(operation, () => {
    scenario.value = 'success'
    latency.value = '0'
})
watch([operation, scenario, latency], () =>
    emit('configure', operation.value, {
        scenario: scenario.value,
        latency: Number(latency.value),
    }),
)
</script>
<template>
    <div class="grid gap-3 sm:grid-cols-3">
        <AppSelect
            id="demo-operation"
            v-model="operation"
            :label="t('demo.operation')"
            :disabled="disabled"
            :options="[
                { value: 'read', label: t('demo.read') },
                { value: 'update', label: t('demo.update') },
            ]"
        />
        <AppSelect
            id="demo-scenario"
            v-model="scenario"
            :label="t('demo.scenario')"
            :disabled="disabled"
            :options="options"
        />
        <AppSelect
            id="demo-latency"
            v-model="latency"
            :label="t('demo.latency')"
            :disabled="disabled"
            :options="[
                { value: '0', label: t('demo.instant') },
                { value: '1500', label: t('demo.slow') },
            ]"
        />
    </div>
</template>
