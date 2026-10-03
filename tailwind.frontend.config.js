import defaultTheme from 'tailwindcss/defaultTheme'

const token =
    (name) =>
    ({ opacityValue } = {}) =>
        opacityValue === undefined
            ? `var(--wf-${name})`
            : `color-mix(in srgb, var(--wf-${name}) calc(${opacityValue} * 100%), transparent)`

export default {
    content: ['./resources/js/src/**/*.{vue,ts}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: token('primary'),
                    light: token('muted'),
                    strong: token('primary-strong'),
                },
                canvas: token('canvas'),
                ink: token('ink'),
                muted: token('muted-foreground'),
                line: token('line'),
                success: { DEFAULT: token('success'), light: token('success-light') },
                danger: { DEFAULT: token('danger'), light: token('danger-light') },
            },
            fontFamily: { sans: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans] },
            boxShadow: { panel: 'var(--wf-panel-shadow)' },
        },
    },
    plugins: [],
}
