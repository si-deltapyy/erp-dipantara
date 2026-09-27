<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppNumberInput from '@/components/ui/AppNumberInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const name = ref('')
const category = ref('first')
const quantity = ref<number | null>(1)
const invalid = ref(false)
const pending = ref(false)
const saved = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const options = computed(() =>
    ['first', 'second'].map((value) => ({ value, label: t('ui.' + value) })),
)
function save(): void {
    if (pending.value) return
    invalid.value = !name.value.trim()
    saved.value = false
    if (invalid.value) return
    pending.value = true
    timer = setTimeout(() => {
        pending.value = false
        saved.value = true
    }, 700)
}
onScopeDispose(() => clearTimeout(timer))
</script>
<template>
    <section class="panel">
        <h2 class="mb-5 text-lg font-bold">{{ t('ui.form') }}</h2>
        <form class="space-y-4" @submit.prevent="save">
            <AppTextInput
                id="sample-name"
                v-model="name"
                :label="t('ui.name')"
                :disabled="pending"
                :error="invalid ? t('ui.invalid') : undefined"
            />
            <div class="grid gap-4 sm:grid-cols-2">
                <AppSelect
                    id="sample-category"
                    v-model="category"
                    :label="t('ui.category')"
                    :options="options"
                    :disabled="pending"
                />
                <AppNumberInput
                    id="sample-quantity"
                    v-model="quantity"
                    :label="t('ui.quantity')"
                    :disabled="pending"
                    min="0"
                    step="1"
                />
            </div>
            <AppButton type="submit" :pending="pending">{{ t('ui.save') }}</AppButton>
            <p v-if="saved" role="status" class="text-sm text-muted">{{ t('ui.saved') }}</p>
        </form>
    </section>
</template>
