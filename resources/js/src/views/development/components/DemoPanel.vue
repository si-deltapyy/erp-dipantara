<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import DemoScenarioControls from './DemoScenarioControls.vue'
import { useDemoPanel } from '../composables/useDemoPanel'
const { t } = useI18n()
const {
    snapshot,
    samples,
    modes,
    errorKey,
    loading,
    saving,
    confirming,
    resetting,
    retryMutation,
    canControl,
    canUpdate,
    refresh,
    increment,
    retry,
    reset,
    configure,
} = useDemoPanel()
const expanded = ref(!!errorKey.value)
watch(errorKey, (message) => {
    if (message) expanded.value = true
})
function synchronizeExpanded(event: Event): void {
    if (event.target instanceof HTMLDetailsElement) expanded.value = event.target.open
}
</script>
<template>
    <details
        class="panel border border-line"
        data-testid="persistent-demo"
        :open="expanded"
        @toggle="synchronizeExpanded"
    >
        <summary
            class="cursor-pointer font-semibold focus-visible:outline focus-visible:outline-primary"
        >
            {{ t('demo.title') }}
        </summary>
        <div class="mt-4 space-y-4">
            <p class="text-sm text-muted">{{ t('demo.description') }}</p>
            <p class="break-words text-xs text-muted">
                {{ t('demo.modes') }}: {{ modes.join(', ') }}
            </p>
            <p v-if="snapshot" class="text-xs text-muted">
                {{ t('demo.revision', { revision: snapshot.metadata.revision }) }}
            </p>
            <DemoScenarioControls
                v-if="canControl"
                :key="snapshot?.metadata.generation"
                :disabled="saving || resetting"
                @configure="configure"
            />
            <p v-if="errorKey" role="alert" class="rounded bg-danger-light p-3 text-sm text-danger">
                {{ t(errorKey) }}
            </p>
            <p v-if="loading" role="status" class="text-sm text-muted">{{ t('demo.loading') }}</p>
            <p v-else-if="!samples.length" class="text-sm text-muted">{{ t('demo.empty') }}</p>
            <ul v-else class="divide-y divide-line">
                <li
                    v-for="sample in samples"
                    :key="sample.id"
                    class="flex flex-wrap items-center justify-between gap-3 py-3"
                    :data-testid="sample.id"
                >
                    <div>
                        <p class="text-sm font-semibold">{{ t(sample.label) }}</p>
                        <p class="text-sm text-muted">
                            {{ t('demo.quantity', { quantity: sample.quantity }) }}
                        </p>
                    </div>
                    <AppButton
                        v-if="canUpdate(sample)"
                        variant="secondary"
                        :disabled="saving || resetting || !!retryMutation"
                        @click="increment(sample)"
                        >{{ t('demo.increment') }}</AppButton
                    >
                </li>
            </ul>
            <div class="flex flex-wrap gap-3">
                <AppButton variant="secondary" :disabled="loading || resetting" @click="refresh">{{
                    t('demo.refresh')
                }}</AppButton>
                <AppButton
                    v-if="retryMutation"
                    :pending="saving"
                    :disabled="resetting"
                    @click="retry"
                    >{{ t('demo.retryWrite') }}</AppButton
                >
                <AppButton
                    v-if="canControl"
                    variant="secondary"
                    :disabled="saving || resetting"
                    @click="confirming = true"
                    >{{ t('demo.reset') }}</AppButton
                >
            </div>
        </div>
        <AppConfirmDialog
            :open="confirming"
            :title="t('demo.resetTitle')"
            :description="t('demo.resetDescription')"
            :pending="resetting"
            @cancel="confirming = false"
            @confirm="reset"
        />
    </details>
</template>
