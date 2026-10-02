<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DeliveryDocument } from '@/core/types/delivery'
import { useDocumentList } from '@/composables/useDocumentList'
import DeliverySakrFields from './DeliverySakrFields.vue'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{
    deliveryId: string
    documents: readonly DeliveryDocument[]
    disabled: boolean
    errors: Readonly<Record<string, string | undefined>>
}>()
const emit = defineEmits<{ change: [documents: readonly DeliveryDocument[]] }>()
const { t } = useI18n()
const list = reactive(
    useDocumentList(() => ({ parentType: 'delivery', parentId: props.deliveryId })),
)
</script>
<template>
    <section class="space-y-4">
        <h2 class="text-lg font-semibold">{{ t('deliveries.sakr') }}</h2>
        <p class="text-sm text-muted">{{ t('deliveries.sakrHint') }}</p>
        <p v-if="list.loading" role="status">{{ t('documents.loading') }}</p>
        <div v-else-if="list.error" role="alert">
            <p>{{ t(list.error) }}</p>
            <AppButton variant="secondary" @click="list.refresh">{{
                t('deliveries.refresh')
            }}</AppButton>
        </div>
        <DeliverySakrFields
            v-else
            :documents="documents"
            :files="list.documents"
            :disabled="disabled"
            @change="emit('change', $event)"
        />
        <p
            v-for="[field, error] in Object.entries(errors).filter(([field]) =>
                field.startsWith('documents'),
            )"
            :key="field"
            role="alert"
            class="text-red-700"
        >
            {{ t(error || 'deliveries.invalidDocument') }}
        </p>
    </section>
</template>
