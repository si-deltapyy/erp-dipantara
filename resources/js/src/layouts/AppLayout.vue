<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import WorkspaceShell from './WorkspaceShell.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppState from '@/components/ui/AppState.vue'
import SessionActions from '@/views/auth/components/SessionActions.vue'
import { useSessionStore } from '@/stores/session'
import { useWorkspaceNavigation } from '@/composables/useWorkspaceNavigation'

const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const { groups, activeKey, navigate } = useWorkspaceNavigation()
const initials = computed(
    () =>
        session.user?.displayName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() ?? '',
)
</script>

<template>
    <WorkspaceShell
        :groups="groups"
        :active-key="activeKey"
        :title="t(route.meta.titleKey)"
        :user-name="session.user?.displayName ?? ''"
        :user-role="session.user?.roles.join(', ') ?? ''"
        :initials="initials"
        @navigate="navigate"
    >
        <template #account-actions><SessionActions :show-name="false" /></template>
        <section v-if="route.meta.featureUnavailable" class="space-y-6">
            <AppPageHeader :title="t(route.meta.titleKey)" />
            <AppState class="panel" kind="empty" :message="t('ui.featureUnavailable')" />
        </section>
        <RouterView v-else />
    </WorkspaceShell>
</template>
