<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { canAccess } from '@/core/domain/access-policy'
import { navigation } from '@/router/navigation'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import { mockEnabled } from '@/core/constants/environment'

defineEmits<{ navigate: [] }>()
const { t } = useI18n()
const store = useSessionStore()
const links = computed(() =>
    navigation.filter((entry) => {
        if (!mockEnabled && entry.developmentCapability) return false
        return canAccess(store.user, entry.requiredPermissions, entry.developmentCapability)
    }),
)
</script>

<template>
    <nav :aria-label="t('navigation.label')" class="px-4">
        <p class="mb-4 px-3 text-xs font-bold tracking-widest text-muted">
            {{ t('navigation.workspace') }}
        </p>
        <RouterLink
            v-for="link in links"
            :key="link.name"
            v-slot="{ isExactActive }"
            :to="{ name: link.name }"
            class="mb-2 flex min-h-11 items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-muted hover:bg-primary-light"
            active-class="bg-primary-light !text-primary-strong"
            @click="$emit('navigate')"
        >
            <AppIcon :name="link.icon" />
            <span>{{ t(link.label) }}</span>
            <span v-if="isExactActive" class="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
        </RouterLink>
    </nav>
</template>
