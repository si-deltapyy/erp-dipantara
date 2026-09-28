<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Invoice } from '@/core/types/invoice'
import { useDocumentList } from '@/composables/useDocumentList'
import { useDocumentContent } from '@/composables/useDocumentContent'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useSessionStore } from '@/stores/session'
import AppButton from '@/components/ui/AppButton.vue'
import DocumentPreview from '@/components/ui/DocumentPreview.vue'
const props = defineProps<{ invoice: Invoice }>()
const { t } = useI18n()
const session = useSessionStore()
const permitted = computed(
    () => evaluateRecordAccess(session.user, 'documents.download', props.invoice) === 'allowed',
)
const list = reactive(
    useDocumentList(() =>
        permitted.value ? { parentType: 'invoice', parentId: props.invoice.id } : undefined,
    ),
)
const document = computed(() =>
    list.documents.find((document) => document.id === props.invoice.documentId),
)
const content = reactive(
    useDocumentContent(
        () => props.invoice.id,
        () => permitted.value,
    ),
)
</script>
<template>
    <section v-if="permitted && invoice.documentId" class="panel space-y-3">
        <p class="text-sm text-muted">{{ t('invoices.demoDocument') }}</p>
        <p v-if="list.loading" role="status">{{ t('invoices.loading') }}</p>
        <div v-else-if="list.error" role="alert">
            <p>{{ t(list.error) }}</p>
            <AppButton @click="list.refresh">{{ t('invoices.refresh') }}</AppButton>
        </div>
        <div v-else-if="document" class="flex flex-wrap gap-3">
            <AppButton :pending="!!content.pendingId" @click="content.open(document, 'preview')">{{
                t('invoices.preview')
            }}</AppButton>
            <AppButton
                variant="secondary"
                :pending="!!content.pendingId"
                @click="content.open(document, 'download')"
                >{{ t('invoices.download') }}</AppButton
            >
        </div>
        <p v-if="content.error" role="alert">{{ t(content.error) }}</p>
    </section>
    <DocumentPreview
        :preview="content.preview"
        :error="content.error"
        :pending="!!content.pendingId"
        @close="content.close"
        @download="content.open($event, 'download')"
    />
</template>
