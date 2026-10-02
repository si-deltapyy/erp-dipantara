<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { WorkspaceGroup } from '@/core/types/workspace'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{
    groups: readonly WorkspaceGroup[]
    activeKey: string
    note?: string
    disabledLabel?: string
}>()
defineEmits<{ navigate: [key: string] }>()
const { t } = useI18n()
</script>

<template>
    <nav class="wf-navigation" :aria-label="t('navigation.label')">
        <div v-for="group in groups" :key="group.label" class="wf-navigation-group">
            <p>{{ group.label }}</p>
            <button
                v-for="link in group.links"
                :key="link.key"
                type="button"
                :aria-current="link.key === activeKey ? 'page' : undefined"
                :disabled="link.disabled"
                :title="link.disabled ? disabledLabel : undefined"
                @click="$emit('navigate', link.key)"
            >
                <AppIcon :name="link.icon" :size="18" />
                <span>{{ link.label }}</span>
                <span v-if="link.key === activeKey" class="wf-nav-dot" aria-hidden="true" />
            </button>
        </div>
        <p v-if="note" class="wf-navigation-note">{{ note }}</p>
    </nav>
</template>
