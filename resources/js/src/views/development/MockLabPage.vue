<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createFoundationApi } from '@/api/foundation-api'
import { createFoundationMock } from '@/api/adapters/foundation-mock'
import { mockScenarios } from '@/api/mocks/foundation-fixtures'
import type { MockScenario } from '@/core/types/foundation'
import { useLatestRequest } from '@/composables/useLatestRequest'

const { t } = useI18n()
const scenario = ref<MockScenario>('success')
const api = createFoundationApi(createFoundationMock())
const { result, error, pending, run } = useLatestRequest((signal) =>
    api.list({ signal, scenario: scenario.value }),
)
watch(
    scenario,
    () => {
        void run()
    },
    { immediate: true },
)
</script>

<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-2xl font-bold">{{ t('lab.title') }}</h1>
            <p class="mt-2 text-sm leading-6 text-muted">{{ t('lab.description') }}</p>
        </div>
        <section class="panel">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div class="min-w-0 flex-1">
                    <label for="scenario" class="mb-2 block text-sm font-semibold">{{
                        t('lab.scenario')
                    }}</label>
                    <select
                        id="scenario"
                        v-model="scenario"
                        class="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
                        :aria-invalid="error?.kind === 'validation'"
                        :aria-describedby="
                            error?.kind === 'validation' ? 'scenario-error' : undefined
                        "
                    >
                        <option v-for="option in mockScenarios" :key="option" :value="option">
                            {{ t('lab.scenarios.' + option) }}
                        </option>
                    </select>
                    <p
                        v-if="error?.fieldErrors.scenario"
                        id="scenario-error"
                        class="mt-2 text-sm text-danger"
                    >
                        {{ t('lab.validation') }}
                    </p>
                </div>
                <button type="button" class="primary-button" :disabled="pending" @click="run">
                    {{ t('lab.retry') }}
                </button>
            </div>
        </section>
        <section class="panel" :aria-busy="pending" aria-labelledby="results-title">
            <h2 id="results-title" class="mb-5 font-semibold">{{ t('lab.results') }}</h2>
            <div aria-live="polite" role="status">
                <p v-if="pending" class="py-8 text-center text-muted">{{ t('lab.loading') }}</p>
                <p v-else-if="error" class="rounded-md bg-danger-light p-4 text-sm text-danger">
                    {{ t('lab.errors.' + error.kind) }}
                </p>
                <p v-else-if="!result?.length" class="py-8 text-center text-muted">
                    {{ t('lab.empty') }}
                </p>
                <div v-else>
                    <p class="mb-4 text-xs text-muted">
                        {{ t('lab.count', { count: result.length }) }}
                    </p>
                    <ul class="divide-y divide-line">
                        <li
                            v-for="record in result"
                            :key="record.id"
                            class="flex flex-wrap justify-between gap-2 py-4 text-sm"
                        >
                            <span>{{ record.label }}</span
                            ><span class="font-mono text-xs text-muted">{{ record.id }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    </div>
</template>
