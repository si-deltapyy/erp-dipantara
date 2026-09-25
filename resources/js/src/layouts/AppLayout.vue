<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppBrand from '@/components/layout/AppBrand.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import MobileNavigation from '@/components/layout/MobileNavigation.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { mockEnabled, businessMockEnabled } from '@/core/constants/environment'

import SessionActions from '@/views/auth/components/SessionActions.vue'
const { t } = useI18n()
const route = useRoute()
const mobileOpen = ref(false)
const pageTitle = computed(() => t(route.meta.titleKey))
const DemoPanel =
    import.meta.env.DEV && businessMockEnabled
        ? defineAsyncComponent(() => import('@/views/development/components/DemoPanel.vue'))
        : undefined
</script>

<template>
    <a
        href="#main-content"
        class="sr-only z-50 rounded bg-white p-4 focus:not-sr-only focus:fixed"
        >{{ t('navigation.skip') }}</a
    >
    <aside
        class="fixed inset-y-0 left-0 hidden w-[260px] flex-col border-r border-line bg-white lg:flex"
    >
        <div class="px-6 py-7"><AppBrand /></div>
        <AppNavigation class="mt-5" />
        <p class="mt-auto border-t border-line p-6 text-xs leading-5 text-muted">
            {{ t('brand.description') }}
        </p>
    </aside>
    <MobileNavigation :open="mobileOpen" @close="mobileOpen = false" />
    <div class="flex min-h-dvh min-w-0 flex-col lg:ml-[260px]">
        <header
            class="sticky top-0 z-20 flex min-h-20 items-center gap-3 border-b border-line bg-white px-4 sm:px-8"
        >
            <button
                type="button"
                class="icon-button lg:hidden"
                :aria-label="t('navigation.open')"
                :aria-expanded="mobileOpen"
                aria-controls="mobile-navigation"
                @click="mobileOpen = true"
            >
                <AppIcon name="menu" />
            </button>
            <div class="min-w-0">
                <p class="text-xs text-muted">{{ t('shell.workspace') }}</p>
                <p class="truncate text-sm font-semibold">{{ pageTitle }}</p>
            </div>
            <span
                v-if="mockEnabled || businessMockEnabled"
                class="ml-auto rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary-strong"
                >{{ t('shell.mock') }}</span
            >
            <span
                v-else
                class="ml-auto rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-muted"
                >{{ t('shell.stage') }}</span
            >
            <SessionActions />
        </header>
        <main
            id="main-content"
            tabindex="-1"
            class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 sm:py-10"
        >
            <DemoPanel v-if="DemoPanel" class="mb-6" />
            <RouterView />
        </main>
        <footer class="flex flex-wrap justify-between gap-2 px-4 py-6 text-xs text-muted sm:px-8">
            <span>{{ t('shell.footer') }}</span
            ><span>{{ t('shell.release') }}</span>
        </footer>
    </div>
</template>
