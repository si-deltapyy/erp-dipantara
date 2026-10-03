<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session'
import GraderEditor from './components/GraderEditor.vue'
import GraderFields from './components/GraderFields.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppState from '@/components/ui/AppState.vue'
import { useI18n } from 'vue-i18n'
import { useGraderList } from './composables/useGraderList'
import GraderTable from './components/GraderTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const {
    response,
    query,
    search,
    loading,
    error,
    refresh,
    searchGraders,
    changePage,
    selectedId,
    detail,
    canCreate,
} = useGraderList()
const session = useSessionStore()
const editing = ref(false)
const success = ref(false)
const canUpdate = computed(() => !!session.user?.permissions.includes('graders.update.all'))
const {
    record: selectedGrader,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
} = detail
function saved(): void {
    editing.value = false
    selectedId.value = undefined
    success.value = true
    void refresh()
}
watch(
    () => session.user,
    () => {
        editing.value = false
        selectedId.value = undefined
        success.value = false
    },
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('graders.title')" :description="t('graders.subtitle')">
            <template #actions
                ><AppButton v-if="canCreate" disabled :title="t('graders.createUnavailable')">{{
                    t('graders.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('graders.createUnavailable') }}</p>
        <p v-if="success" role="status" class="text-sm text-primary">{{ t('graders.saved') }}</p>
        <AppPanel :title="t('graders.list')" class="space-y-5">
            <template #actions
                ><span v-if="response" class="text-sm text-muted">{{
                    t('graders.total', { count: response.meta.total })
                }}</span></template
            >
            <form
                class="flex flex-wrap items-end gap-3 border-b border-line pb-5"
                @submit.prevent="searchGraders"
            >
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="grader-search"
                        v-model="search"
                        :label="t('graders.search')"
                        :placeholder="t('graders.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('graders.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('graders.refresh')
                }}</AppButton>
            </form>

            <p v-if="error" role="alert" class="text-sm text-danger">{{ t(error) }}</p>
            <GraderTable
                :graders="response?.data ?? []"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
                @retry="refresh"
                @select="selectedId = $event"
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
        <AppModal
            :open="!!selectedId && !editing"
            :title="t('graders.detail')"
            @close="selectedId = undefined"
        >
            <AppState v-if="detailLoading" kind="loading" />
            <AppState
                v-else-if="detailError"
                kind="error"
                :message="t(detailError)"
                @retry="refreshDetail"
            />
            <template v-else-if="selectedGrader">
                <p class="mb-5 font-semibold">{{ selectedGrader.name }}</p>
                <GraderFields :model-value="selectedGrader" :errors="{}" disabled />
                <div class="wf-form-actions">
                    <AppButton v-if="canUpdate" @click="editing = true">{{
                        t('graders.edit')
                    }}</AppButton>
                </div>
            </template>
        </AppModal>
        <GraderEditor
            v-if="editing && selectedGrader && canUpdate"
            :grader="selectedGrader"
            @close="editing = false"
            @saved="saved"
        />
    </section>
</template>
