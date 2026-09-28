<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Delivery } from '@/core/types/delivery'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { canActOnDelivery } from '@/core/domain/delivery-policy'
import { useSessionStore } from '@/stores/session'
import { useDocumentList } from '@/composables/useDocumentList'
import { useDocumentTransfer } from '@/composables/useDocumentTransfer'
import { useDocumentContent } from '@/composables/useDocumentContent'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import DocumentPanel from '@/components/ui/DocumentPanel.vue'
import DocumentPreview from '@/components/ui/DocumentPreview.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ delivery: Delivery; locked?: boolean }>()
const { t } = useI18n()
const session = useSessionStore()
const canRead = computed(
    () => evaluateRecordAccess(session.user, 'documents.read', props.delivery) === 'allowed',
)
const canDownload = computed(
    () => evaluateRecordAccess(session.user, 'documents.download', props.delivery) === 'allowed',
)
const list = reactive(
    useDocumentList(() =>
        canRead.value ? { parentType: 'delivery', parentId: props.delivery.id } : undefined,
    ),
)
const upload = reactive(
    useDocumentTransfer(
        () => ({
            identity: props.delivery.id,
            parentType: 'delivery',
            parentId: props.delivery.id,
            purpose: 'sakr',
            scope: props.delivery,
            permitted: !props.locked && canActOnDelivery(session.user, props.delivery, 'update'),
        }),
        list.refresh,
    ),
)
const content = reactive(
    useDocumentContent(
        () => props.delivery.id,
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
    <section class="space-y-4">
        <h2 class="text-lg font-semibold">{{ t('deliveries.sakr') }}</h2>

        <dl v-if="delivery.documents.length" class="panel grid gap-4 sm:grid-cols-2">
            <div v-for="document in delivery.documents" :key="document.direction">
                <dt class="font-semibold">
                    {{ t('deliveries.directions.' + document.direction) }}
                </dt>
                <dd>{{ document.number }} · {{ document.documentDate }}</dd>
            </div>
        </dl>
        <DocumentPanel
            v-if="canRead || upload.canUpload"
            accept="application/pdf"
            :copy="{
                title: 'deliveries.sakrFiles',
                description:
                    delivery.status === 'draft' ? 'deliveries.sakrHint' : 'deliveries.sakrReadHint',
                file: 'deliveries.choosePdf',
                empty: 'deliveries.noFiles',
                hint: 'deliveries.pdfOnly',
            }"
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
    </section>
    <DocumentPreview
        :preview="content.preview"
        :error="content.error"
        :pending="!!content.pendingId"
        printable
        @close="content.close"
        @download="content.open($event, 'download')"
    />
    <AppConfirmDialog
        :open="discard.confirming"
        :title="t('deliveries.discardTitle')"
        :description="t('documents.discardDescription')"
        @confirm="discard.confirm"
        @cancel="discard.cancel"
    />
</template>
