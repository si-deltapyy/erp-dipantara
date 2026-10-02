<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useSessionStore } from '@/stores/session'
import { useDocumentList } from '@/composables/useDocumentList'
import { useDocumentUpload } from '@/composables/useDocumentUpload'
import { useDocumentContent } from '@/composables/useDocumentContent'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import DocumentPanel from '@/components/ui/DocumentPanel.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ order: PurchaseOrder }>()
const { t } = useI18n()
const session = useSessionStore()
const canRead = computed(
    () => evaluateRecordAccess(session.user, 'documents.read', props.order) === 'allowed',
)
const canDownload = computed(
    () => evaluateRecordAccess(session.user, 'documents.download', props.order) === 'allowed',
)
const parent = computed(() =>
    canRead.value ? { parentType: 'purchase-order' as const, parentId: props.order.id } : undefined,
)
const list = reactive(useDocumentList(() => parent.value))
const upload = reactive(useDocumentUpload(() => props.order, list.refresh))
const content = reactive(
    useDocumentContent(
        () => props.order.id,
        () => canDownload.value,
    ),
)
const discard = reactive(
    useUnsavedChanges(
        () => session.status === 'authenticated' && !!upload.file,
        () => session.status === 'authenticated' && upload.pending,
    ),
)
</script>
<template>
    <DocumentPanel
        v-if="canRead || upload.canUpload"
        :documents="list.documents"
        :loading="list.loading"
        :list-error="list.error"
        :upload-error="upload.error"
        :file-error="upload.fileError"
        :content-error="content.error"
        :selected-name="upload.file?.name"
        :pending="upload.pending"
        :progress="upload.progress"
        :uncertain="upload.uncertain"
        :saved="upload.saved"
        :can-read="canRead"
        :can-upload="upload.canUpload"
        :can-download="canDownload"
        :pending-id="content.pendingId"
        @select="upload.select"
        @upload="upload.upload"
        @refresh="list.refresh"
        @preview="content.open($event, 'preview')"
        @download="content.open($event, 'download')"
        @discard="discard.requestDiscard(() => upload.select())"
    />
    <AppModal :open="!!content.preview" :title="t('documents.preview')" @close="content.close">
        <template v-if="content.preview">
            <p class="mb-3 break-all font-semibold">{{ content.preview.document.fileName }}</p>
            <img
                v-if="content.preview.document.mimeType.startsWith('image/')"
                :src="content.preview.url"
                :alt="content.preview.document.fileName"
                class="max-h-[65vh] w-full object-contain"
            />
            <iframe
                v-else
                :src="content.preview.url"
                :title="content.preview.document.fileName"
                class="h-[60vh] w-full border-0"
            />
            <p class="mt-3 text-sm text-muted">{{ t('documents.previewFallback') }}</p>
            <p v-if="content.error" role="alert">{{ t(content.error) }}</p>
            <AppButton
                variant="secondary"
                :pending="!!content.pendingId"
                @click="content.open(content.preview.document, 'download')"
                >{{ t('documents.download') }}</AppButton
            >
        </template>
    </AppModal>
    <AppConfirmDialog
        :open="discard.confirming"
        :title="t('purchase-orders.discardTitle')"
        :description="t('documents.discardDescription')"
        @confirm="discard.confirm"
        @cancel="discard.cancel"
    />
</template>
