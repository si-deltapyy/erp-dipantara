import '../css/app.css'
import './bootstrap'

if (document.querySelector('script[data-page="app"]')) {
    void import('./inertia')
} else if (!window.Alpine) {
    void import('alpinejs').then(({ default: Alpine }) => {
        window.Alpine = Alpine
        Alpine.start()
    })
}
