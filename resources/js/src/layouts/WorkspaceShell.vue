<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { WorkspaceGroup } from '@/core/types/workspace'
import WorkspaceNavigation from '@/components/layout/WorkspaceNavigation.vue'
import WorkspaceBrand from '@/components/layout/WorkspaceBrand.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{
    groups: readonly WorkspaceGroup[]
    activeKey: string
    title: string
    userName: string
    userRole: string
    initials: string
    navigationNote?: string
    disabledNavigationLabel?: string
}>()
const emit = defineEmits<{ navigate: [key: string] }>()
const { t } = useI18n()
const mobileOpen = ref(false)
let desktop: MediaQueryList | undefined
function closeMobile(): void {
    mobileOpen.value = false
}
function navigate(key: string): void {
    closeMobile()
    emit('navigate', key)
}
onMounted(() => {
    desktop = window.matchMedia('(min-width: 1024px)')
    desktop.addEventListener('change', closeMobile)
})
onScopeDispose(() => desktop?.removeEventListener('change', closeMobile))
</script>

<template>
    <div class="woodflow-theme wf-shell">
        <a href="#workspace-content" class="wf-skip">{{ t('navigation.skip') }}</a>
        <aside class="wf-sidebar">
            <WorkspaceBrand />
            <WorkspaceNavigation
                :groups="groups"
                :active-key="activeKey"
                :note="navigationNote"
                :disabled-label="disabledNavigationLabel"
                @navigate="navigate"
            />
            <div class="wf-sidebar-footer">
                <span class="wf-company-monogram">D</span>
                <div>
                    <strong>{{ t('brand.company') }}</strong>
                    <p>{{ t('shell.workspace') }}</p>
                </div>
            </div>
        </aside>
        <AppDrawer
            :open="mobileOpen"
            :title="t('navigation.label')"
            side="left"
            class="wf-mobile-navigation"
            @close="closeMobile"
        >
            <WorkspaceBrand />
            <WorkspaceNavigation
                :groups="groups"
                :active-key="activeKey"
                :note="navigationNote"
                :disabled-label="disabledNavigationLabel"
                @navigate="navigate"
            />
        </AppDrawer>
        <div class="wf-workspace">
            <header class="wf-topbar">
                <button
                    type="button"
                    class="wf-icon-button wf-mobile-toggle"
                    :aria-label="t('navigation.open')"
                    :aria-expanded="mobileOpen"
                    @click="mobileOpen = true"
                >
                    <AppIcon name="menu" />
                </button>
                <div class="wf-breadcrumb">
                    <span>{{ t('shell.workspace') }}</span
                    ><AppIcon name="chevron" :size="13" /><strong>{{ title }}</strong>
                </div>
                <div class="wf-topbar-end">
                    <slot name="notice" />
                    <div class="wf-profile">
                        <span class="wf-avatar">{{ initials }}</span>
                        <div>
                            <strong>{{ userName }}</strong
                            ><span>{{ userRole }}</span>
                        </div>
                    </div>
                    <slot name="account-actions" />
                </div>
            </header>
            <main id="workspace-content" tabindex="-1" class="wf-main"><slot /></main>
            <footer class="wf-footer">
                <span>{{ t('shell.footer') }}</span
                ><span>{{ t('brand.description') }}</span>
            </footer>
        </div>
    </div>
</template>
