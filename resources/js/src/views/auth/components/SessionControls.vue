<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { sessionFixtures } from '@/api/mocks/session-fixtures'
import {
    sessionScenario,
    sessionScenarios,
    sessionStorageAvailable,
} from '@/api/mocks/session-controls'
import AppSelect from '@/components/ui/AppSelect.vue'
defineProps<{ accounts?: boolean }>()
const emit = defineEmits<{ account: [email: string] }>()
const { t } = useI18n()
const options = computed(() =>
    sessionScenarios.map((value) => ({ value, label: t('auth.scenarios.' + value) })),
)
function changeScenario(value: string): void {
    const scenario = sessionScenarios.find((scenario) => scenario === value)
    if (scenario) sessionScenario.value = scenario
}
</script>
<template>
    <details class="rounded-md border border-line p-4 text-sm">
        <summary class="cursor-pointer font-semibold">{{ t('auth.controls') }}</summary>
        <div class="mt-4 space-y-4">
            <p class="text-muted">{{ t('auth.mockNotice') }}</p>
            <AppSelect
                id="session-scenario"
                :label="t('auth.scenario')"
                :model-value="sessionScenario"
                :options="options"
                @update:model-value="changeScenario"
            />
            <div v-if="accounts" class="flex flex-wrap gap-2">
                <button
                    v-for="account in sessionFixtures"
                    :key="account.id"
                    type="button"
                    class="rounded border border-line px-3 py-2"
                    @click="emit('account', account.email)"
                >
                    {{ account.email }}
                </button>
            </div>
        </div>
    </details>
    <p v-if="!sessionStorageAvailable" role="status" class="text-sm text-muted">
        {{ t('auth.storageWarning') }}
    </p>
</template>
