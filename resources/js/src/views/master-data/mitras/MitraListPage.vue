<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref, shallowRef, watch } from 'vue'
import type { MitraRecord } from '@/core/types/mitra'
import { useSessionStore } from '@/stores/session'
import { useMitraList } from './composables/useMitraList'
import MitraTable from './components/MitraTable.vue'
import MitraEditor from './components/MitraEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const { response, query, search, loading, error, canCreate, refresh, searchMitras, changePage } =
    useMitraList()
const session = useSessionStore()
const editing = ref(false)
const selectedMitra = shallowRef<MitraRecord>()
const canUpdate = computed(() => !!session.user?.permissions.includes('mitras.update.all'))
const success = ref(false)
function open(mitra?: MitraRecord): void {
    selectedMitra.value = mitra
    success.value = false
    editing.value = true
}
function saved(): void {
    editing.value = false
    success.value = true
    void refresh()
}
watch(
    () => session.user,
    () => {
        editing.value = false
        selectedMitra.value = undefined
        success.value = false
    },
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('mitras.title')" :description="t('mitras.subtitle')">
            <template #actions
                ><AppButton v-if="canCreate" @click="open()">{{
                    t('mitras.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p v-if="success" role="status" class="text-sm text-primary">{{ t('mitras.saved') }}</p>
        <AppPanel :title="t('mitras.list')" class="space-y-5">
            <template #actions
                ><span v-if="response" class="text-sm text-muted">{{
                    t('mitras.total', { count: response.meta.total })
                }}</span></template
            >
            <form
                class="flex flex-wrap items-end gap-3 border-b border-line pb-5"
                @submit.prevent="searchMitras"
            >
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

            <p v-if="error" role="alert" class="text-sm text-danger">{{ t(error) }}</p>
            <MitraTable
                :mitras="response?.data ?? []"
                :can-update="canUpdate"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
                @retry="refresh"
                @edit="open"
            />
            <template #footer
                ><AppPagination
                    v-if="response && !error"
                    numbered
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    :disabled="loading"
                    @update:page="changePage"
            /></template>
        </AppPanel>
        <MitraEditor
            v-if="editing && (selectedMitra ? canUpdate : canCreate)"
            :mitra="selectedMitra"
            @close="editing = false"
            @saved="saved"
        />
    </section>
</template>
