<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

const { t } = useI18n()
const features = [
    { key: 'navigation', icon: 'home' as const },
    { key: 'responsive', icon: 'screen' as const },
    { key: 'connection', icon: 'layers' as const },
]
</script>

<template>
    <div class="space-y-8">
        <section
            class="relative overflow-hidden rounded-xl bg-ink px-6 py-10 text-white sm:px-10 sm:py-14"
        >
            <div class="relative z-10 max-w-xl">
                <p class="mb-4 text-xs font-semibold tracking-[0.16em] text-white/70">
                    {{ t('home.eyebrow') }}
                </p>
                <h1 class="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    {{ t('home.title') }}
                </h1>
                <p class="mt-5 max-w-lg text-sm leading-7 text-white/75">
                    {{ t('home.description') }}
                </p>
            </div>
            <div
                aria-hidden="true"
                class="absolute -right-12 -top-20 h-80 w-80 rounded-full border-[40px] border-white/5"
            />
            <div
                aria-hidden="true"
                class="absolute -bottom-32 right-12 h-72 w-72 rounded-full border-[40px] border-white/5"
            />
        </section>
        <section class="panel flex items-start gap-4" aria-labelledby="workspace-status">
            <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary"
                ><AppIcon name="layers" :size="24"
            /></span>
            <div>
                <h2 id="workspace-status" class="text-base font-semibold">
                    {{ t('home.status') }}
                </h2>
                <p class="mt-2 text-sm leading-6 text-muted">{{ t('home.statusDescription') }}</p>
            </div>
        </section>
        <section aria-labelledby="foundation-title">
            <h2 id="foundation-title" class="text-lg font-bold">{{ t('home.foundation') }}</h2>
            <p class="mt-1 text-sm leading-6 text-muted">{{ t('home.foundationDescription') }}</p>
            <div class="mt-5 grid gap-5 md:grid-cols-3">
                <article v-for="feature in features" :key="feature.key" class="panel">
                    <AppIcon :name="feature.icon" :size="24" class="mb-5 text-primary" />
                    <h3 class="text-sm font-bold">
                        {{ t('home.cards.' + feature.key + '.title') }}
                    </h3>
                    <p class="mt-3 text-sm leading-6 text-muted">
                        {{ t('home.cards.' + feature.key + '.description') }}
                    </p>
                </article>
            </div>
        </section>
    </div>
</template>
