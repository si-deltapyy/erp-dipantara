<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DocumentReference } from '@/core/types/document'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'
defineProps<{
    preview?: { url: string; document: DocumentReference }
    error?: string
    pending?: boolean
    printable?: boolean
}>()
const emit = defineEmits<{ close: []; download: [document: DocumentReference] }>()
const { t } = useI18n()
const frame = ref<HTMLIFrameElement>()
function print(): void {
    frame.value?.contentWindow?.print()
}
</script>
<template>
    <AppModal
        :open="!!preview"
        :title="t('documents.preview')"
        class="max-w-4xl"
        @close="emit('close')"
    >
        <template v-if="preview"
            ><p class="mb-3 break-all font-semibold">{{ preview.document.fileName }}</p>
            <img
                v-if="preview.document.mimeType.startsWith('image/')"
                :src="preview.url"
                :alt="preview.document.fileName"
                class="max-h-[65vh] w-full object-contain"
            /><iframe
                v-else
                ref="frame"
                :src="preview.url"
                :title="preview.document.fileName"
                class="h-[60vh] w-full border-0"
            />
            <p class="mt-3 text-sm text-muted">{{ t('documents.previewFallback') }}</p>
            <p v-if="error" role="alert">{{ t(error) }}</p>
            <div class="mt-3 flex flex-wrap gap-3">
                <AppButton
                    variant="secondary"
                    :pending="pending"
                    @click="emit('download', preview.document)"
                    >{{ t('documents.download') }}</AppButton
                ><AppButton
                    v-if="printable && preview.document.mimeType === 'application/pdf'"
                    variant="secondary"
                    @click="print"
                    >{{ t('documents.print') }}</AppButton
                >
            </div></template
        >
    </AppModal>
</template>
