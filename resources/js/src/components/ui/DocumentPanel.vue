<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DocumentReference } from '@/core/types/document'
import AppButton from './AppButton.vue'
const props = defineProps<{
    accept?: string
    copy?: { title: string; description: string; file: string; empty: string; hint: string }
    documents: readonly DocumentReference[]
    loading: boolean
    listError: string
    uploadError: string
    fileError: string
    contentError: string
    selectedName?: string
    pending: boolean
    progress: number
    uncertain: boolean
    saved: boolean
    canRead: boolean
    canUpload: boolean
    canDownload: boolean
    pendingId: string
}>()
const emit = defineEmits<{
    select: [file?: File]
    upload: []
    refresh: []
    preview: [document: DocumentReference]
    download: [document: DocumentReference]
    discard: []
}>()
const { t } = useI18n()
const fileId = useId()
function select(event: Event): void {
    const input = event.target as HTMLInputElement
    emit('select', input.files?.[0])
    input.value = ''
}
</script>
<template>
    <section class="panel space-y-4" :aria-label="t(copy?.title ?? 'documents.title')">
        <h2 class="text-lg font-semibold">{{ t(copy?.title ?? 'documents.title') }}</h2>
        <p class="text-sm text-muted">{{ t(copy?.description ?? 'documents.description') }}</p>
        <div v-if="canUpload" class="space-y-3">
            <label :for="fileId" class="block font-semibold">{{
                t(copy?.file ?? 'documents.file')
            }}</label>
            <input
                :id="fileId"
                type="file"
                :accept="accept ?? 'application/pdf,image/jpeg,image/png'"
                class="block w-full min-w-0 rounded border border-line p-2"
                :disabled="pending || uncertain"
                :aria-describedby="fileId + '-hint' + (fileError ? ' ' + fileId + '-error' : '')"
                :aria-invalid="!!fileError"
                @change="select"
            />
            <p :id="fileId + '-hint'" class="text-sm text-muted">
                {{ t(copy?.hint ?? 'documents.hint') }}
            </p>
            <p v-if="selectedName" class="break-all">{{ selectedName }}</p>
            <p v-if="fileError" :id="fileId + '-error'" role="alert" class="text-red-700">
                {{ t(fileError) }}
            </p>
            <p v-if="uploadError" role="alert">{{ t(uploadError) }}</p>
            <p v-if="uncertain" role="status">{{ t('documents.uncertain') }}</p>
            <div v-if="pending" role="status">
                <label :for="fileId + '-progress'">{{
                    t('documents.progress', { percent: progress })
                }}</label>
                <progress
                    :id="fileId + '-progress'"
                    class="block w-full"
                    :value="progress"
                    max="100"
                />
            </div>
            <div class="flex flex-wrap gap-3">
                <AppButton
                    :pending="pending"
                    :disabled="!selectedName || !!fileError"
                    @click="emit('upload')"
                >
                    {{ t(uncertain ? 'documents.retryUpload' : 'documents.upload') }}
                </AppButton>
                <AppButton
                    v-if="selectedName && !uncertain"
                    variant="secondary"
                    :disabled="pending"
                    @click="emit('discard')"
                    >{{ t('documents.discard') }}</AppButton
                >
            </div>
        </div>
        <p v-if="saved" role="status">{{ t('documents.saved') }}</p>
        <template v-if="canRead">
            <p v-if="loading" role="status">{{ t('documents.loading') }}</p>
            <div v-else-if="listError" role="alert" class="space-y-2">
                <p>{{ t(listError) }}</p>
                <AppButton variant="secondary" @click="emit('refresh')">{{
                    t('documents.refresh')
                }}</AppButton>
            </div>
            <template v-else>
                <p v-if="!documents.length">{{ t(copy?.empty ?? 'documents.empty') }}</p>
                <ul v-else class="space-y-4">
                    <li
                        v-for="document in props.documents"
                        :key="document.id"
                        class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"
                    >
                        <div class="min-w-0">
                            <p class="break-all font-semibold">{{ document.fileName }}</p>
                            <p class="text-sm text-muted">
                                {{ document.mimeType }} ·
                                {{ t('documents.bytes', { size: document.sizeBytes }) }}
                            </p>
                        </div>
                        <div v-if="canDownload" class="flex flex-wrap gap-2">
                            <AppButton
                                variant="secondary"
                                :aria-disabled="!!pendingId"
                                @click="!pendingId && emit('preview', document)"
                                >{{ t('documents.preview') }}</AppButton
                            >
                            <AppButton
                                variant="secondary"
                                :aria-disabled="!!pendingId"
                                @click="!pendingId && emit('download', document)"
                                >{{ t('documents.download') }}</AppButton
                            >
                        </div>
                    </li>
                </ul>
                <AppButton variant="secondary" :disabled="loading" @click="emit('refresh')">{{
                    t('documents.refresh')
                }}</AppButton>
            </template>
        </template>
        <p v-if="pendingId" role="status">{{ t('documents.fetching') }}</p>
        <p v-if="contentError" role="alert">{{ t(contentError) }}</p>
    </section>
</template>
