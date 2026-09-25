<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Mitra } from '@/core/types/mitra'
import { useSessionStore } from '@/stores/session'
import { useMitraRecoveryStore } from '@/stores/mitra-recovery'
import { useMitraList } from './composables/useMitraList'
import MitraEditor from './components/MitraEditor.vue'
import MitraTable from './components/MitraTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const session = useSessionStore()
const recovery = useMitraRecoveryStore()
const { response, query, search, loading, error, canCreate, refresh, searchMitras, changePage } =
    useMitraList()
const canUpdate = computed(() => !!session.user?.permissions.includes('mitras.update.all'))
const recovered = recovery.snapshot?.actorId === session.user?.id ? recovery.snapshot : null
const editing = ref(!!recovered)
const selected = shallowRef<Mitra | undefined>(recovered?.mitra)
const success = ref(false)
function open(mitra?: Mitra): void {
    selected.value = mitra
    success.value = false
    editing.value = true
}
function saved(): void {
    editing.value = false
    selected.value = undefined
    success.value = true
    void refresh()
}
function close(): void {
    editing.value = false
    selected.value = undefined
    recovery.$reset()
}
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="mb-1 text-sm font-semibold text-primary">{{ t('mitras.section') }}</p>
                <h1 class="text-2xl font-bold tracking-tight">{{ t('mitras.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('mitras.subtitle') }}</p>
            </div>
            <AppButton v-if="canCreate" @click="open()">{{ t('mitras.add') }}</AppButton>
        </header>
        <p
            v-if="success"
            role="status"
            class="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
            {{ t('mitras.saved') }}
        </p>
        <div class="panel space-y-5">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchMitras">
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="mitra-search"
                        v-model="search"
                        :label="t('mitras.search')"
                        :placeholder="t('mitras.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('mitras.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('mitras.refresh')
                }}</AppButton>
            </form>
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="font-semibold">{{ t('mitras.list') }}</h2>
                <p v-if="response" class="text-sm text-muted">
                    {{ t('mitras.total', { count: response.meta.total }) }}
                </p>
            </div>
            <p v-if="error" role="alert" class="text-sm text-red-700">{{ t(error) }}</p>
            <MitraTable
                :mitras="response?.data ?? []"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
                :can-update="canUpdate"
                @edit="open"
                @retry="refresh"
            />
            <AppPagination
                v-if="response && !error"
                :page="query.page"
                :page-size="response.meta.perPage"
                :total="response.meta.total"
                :disabled="loading"
                @update:page="changePage"
            />
        </div>
        <MitraEditor
            v-if="editing && (selected ? canUpdate : canCreate)"
            :mitra="selected"
            @close="close"
            @saved="saved"
        />
    </section>
</template>
