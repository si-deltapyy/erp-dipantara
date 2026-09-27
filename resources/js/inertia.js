import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'

void createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./src/views/landing/**/*.vue', { eager: true })
        return pages[`./src/views/landing/${name}.vue`]
    },
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .mount(el)
    },
})
