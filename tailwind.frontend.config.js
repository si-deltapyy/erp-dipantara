import defaultTheme from 'tailwindcss/defaultTheme'

export default {
    content: ['./resources/js/src/**/*.{vue,ts}'],
    theme: {
        extend: {
            colors: {
                primary: { DEFAULT: '#4361ee', light: '#eaf1ff', strong: '#304aca' },
                canvas: '#fafafa',
                ink: '#0e1726',
                muted: '#536079',
                line: '#e0e6ed',
                success: { DEFAULT: '#147d52', light: '#ddf5f0' },
                danger: { DEFAULT: '#b42332', light: '#fff5f5' },
            },
            fontFamily: { sans: ['Nunito Sans', ...defaultTheme.fontFamily.sans] },
            boxShadow: { panel: '0 2px 8px rgb(14 23 38 / 5%)' },
        },
    },
    plugins: [],
}
