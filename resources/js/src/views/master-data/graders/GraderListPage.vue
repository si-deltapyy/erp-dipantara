<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Grader } from '@/core/types/grader'
import { useSessionStore } from '@/stores/session'
import { useGraderRecoveryStore } from '@/stores/grader-recovery'
import { useGraderList } from './composables/useGraderList'
import GraderProvisionDialog from './components/GraderProvisionDialog.vue'
import GraderEditor from './components/GraderEditor.vue'
import GraderTable from './components/GraderTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const session = useSessionStore()
const recovery = useGraderRecoveryStore()
const { response, query, search, loading, error, canCreate, refresh, searchGraders, changePage } =
    useGraderList()
const canUpdate = computed(() => !!session.user?.permissions.includes('graders.update.all'))
const canProvision = computed(() => !!session.user?.permissions.includes('graders.provision.all'))
const provisioning = shallowRef<Grader | undefined>(
    recovery.provision?.actorId === session.user?.id ? recovery.provision?.grader : undefined,
)
const recovered = recovery.snapshot?.actorId === session.user?.id ? recovery.snapshot : null
const editing = ref(!!recovered)
const selected = shallowRef<Grader | undefined>(recovered?.grader)
const success = ref('')
function open(grader?: Grader): void {
    selected.value = grader
    success.value = ''
    provisioning.value = undefined
    editing.value = true
}
function saved(): void {
    editing.value = false
    selected.value = undefined
    success.value = 'graders.saved'
    void refresh()
}
function close(): void {
    editing.value = false
    selected.value = undefined
    recovery.$reset()
}
function openProvision(grader: Grader): void {
    editing.value = false
    success.value = ''
    provisioning.value = grader
}
function provisioned(): void {
    provisioning.value = undefined
    success.value = 'graders.provisionSaved'
    void refresh()
}
function closeProvision(): void {
    provisioning.value = undefined
    recovery.provision = null
}
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('graders.title')" :description="t('graders.subtitle')">
            <template #actions
                ><AppButton v-if="canCreate" @click="open()">{{
                    t('graders.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p
            v-if="success"
            role="status"
            class="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
        >
            {{ t(success) }}
        </p>
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
                :can-update="canUpdate"
                :can-provision="canProvision"
                @provision="openProvision"
                @edit="open"
                @retry="refresh"
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
        <GraderProvisionDialog
            v-if="provisioning && canProvision"
            :grader="provisioning"
            @close="closeProvision"
            @saved="provisioned"
        />
        <GraderEditor
            v-if="editing && (selected ? canUpdate : canCreate)"
            :grader="selected"
            @close="close"
            @saved="saved"
        />
    </section>
</template>
