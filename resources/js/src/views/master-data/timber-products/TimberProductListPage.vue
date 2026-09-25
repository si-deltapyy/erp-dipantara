<script setup lang="ts">
import { canReadPrices } from '@/core/domain/record-policy'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TimberProduct } from '@/core/types/timber-product'
import { useSessionStore } from '@/stores/session'
import { useTimberProductRecoveryStore } from '@/stores/timber-product-recovery'
import { useTimberProductList } from './composables/useTimberProductList'
import TimberProductEditor from './components/TimberProductEditor.vue'
import TimberProductTable from './components/TimberProductTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const session = useSessionStore()
const recovery = useTimberProductRecoveryStore()
const {
    response,
    query,
    search,
    loading,
    error,
    canCreate: canCreateRecord,
    refresh,
    searchTimberProducts,
    changePage,
} = useTimberProductList()
const canReadPrice = computed(() => canReadPrices(session.user))
const canCreate = computed(() => canCreateRecord.value && canReadPrice.value)
const canUpdate = computed(
    () => canReadPrice.value && !!session.user?.permissions.includes('timber-products.update.all'),
)
const recovered = recovery.snapshot?.actorId === session.user?.id ? recovery.snapshot : null
const editing = ref(!!recovered)
const selected = shallowRef<TimberProduct | undefined>(recovered?.timberProduct)
const success = ref(false)
function open(timberProduct?: TimberProduct): void {
    selected.value = timberProduct
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
                <p class="mb-1 text-sm font-semibold text-primary">
                    {{ t('timber-products.section') }}
                </p>
                <h1 class="text-2xl font-bold tracking-tight">{{ t('timber-products.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('timber-products.subtitle') }}</p>
            </div>
            <AppButton v-if="canCreate" @click="open()">{{ t('timber-products.add') }}</AppButton>
        </header>
        <p
            v-if="success"
            role="status"
            class="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
            {{ t('timber-products.saved') }}
        </p>
        <div class="panel space-y-5">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchTimberProducts">
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="timber-product-search"
                        v-model="search"
                        :label="t('timber-products.search')"
                        :placeholder="t('timber-products.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('timber-products.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('timber-products.refresh')
                }}</AppButton>
            </form>
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="font-semibold">{{ t('timber-products.list') }}</h2>
                <p v-if="response" class="text-sm text-muted">
                    {{ t('timber-products.total', { count: response.meta.total }) }}
                </p>
            </div>
            <p v-if="error" role="alert" class="text-sm text-red-700">{{ t(error) }}</p>
            <TimberProductTable
                :timber-products="response?.data ?? []"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
                :can-update="canUpdate"
                :can-read-prices="canReadPrice"
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
        <TimberProductEditor
            v-if="editing && (selected ? canUpdate : canCreate)"
            :timber-product="selected"
            @close="close"
            @saved="saved"
        />
    </section>
</template>
