<script setup lang="ts">
withDefaults(
    defineProps<{
        name:
            | 'home'
            | 'menu'
            | 'close'
            | 'arrow'
            | 'layers'
            | 'screen'
            | 'link'
            | 'flask'
            | 'check'
            | 'document'
            | 'truck'
            | 'wallet'
            | 'chart'
            | 'users'
            | 'box'
            | 'search'
            | 'calendar'
            | 'chevron'
            | 'clock'
            | 'arrow-up'
            | 'arrow-down'
            | 'invoice-in'
            | 'invoice-out'
        size?: number
    }>(),
    { size: 20 },
)

const paths = {
    home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'm6 6 12 12M6 18 18 6',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    layers: 'm12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5',
    screen: 'M3 4h18v13H3ZM8 21h8m-4-4v4',
    link: 'm10 13 4-4m-6 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 0 2-2a4 4 0 0 0-6-6l-2 2',
    flask: 'M9 3h6m-5 0v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M8 14h8',
    check: 'm5 12 4 4L19 6',
    document: 'M14 3H5v18h14V8Zm0 0v5h5M8 12h8M8 16h5',
    truck: 'M2 5h12v12H2Zm12 5h4l4 4v3h-8M7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0m13 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
    wallet: 'M20 8H5a2 2 0 0 1 0-4h13v4M3 6v13a1 1 0 0 0 1 1h16V8m0 4h-5v4h5m-3-2h.01',
    chart: 'M4 3v17h17M8 15v-4m5 4V7m5 8V4',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-7a4 4 0 0 1 0 8m3 9v-2a4 4 0 0 0-3-4',
    box: 'm12 3 9 5v9l-9 5-9-5V8Zm-9 5 9 5 9-5m-9 5v9M7.5 5.5l9 5',
    search: 'M21 21l-5-5m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    calendar: 'M4 5h16v16H4ZM8 3v4m8-4v4M4 11h16m-12 4h2m4 0h2',
    chevron: 'm9 5 7 7-7 7',
    clock: 'M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    'arrow-up': 'M12 19V5m-6 6 6-6 6 6',
    'arrow-down': 'M12 5v14m-6-6 6 6 6-6',
    'invoice-in': 'M14 3H5v18h14V8Zm0 0v5h5M12 10v8m-3-3 3 3 3-3',
    'invoice-out': 'M14 3H5v18h14V8Zm0 0v5h5M12 18v-8m-3 3 3-3 3 3',
}
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path :d="paths[name]" />
    </svg>
</template>
