<script setup lang="ts">
import { ref } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

// Ambil data auth yang di-pass via HandleInertiaRequests middleware
const page = usePage<{ auth?: { user?: any } }>();

// State reactive untuk toggle menu mobile
const mobileMenuOpen = ref(false);
</script>

<template>
    
    <MainLayout>
        <header class="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
            <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            
            <!-- Logo Brand -->
            <Link href="/" class="flex items-center gap-2">
                <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e5b3d] text-lg text-white shadow-md shadow-[#1e5b3d]/20">
                🌲
                </span>
                <span class="text-xl font-extrabold tracking-tight text-slate-900">
                Wood<span class="text-[#1e5b3d]">Flow</span>
                </span>
            </Link>

            <!-- Navigation Links (Desktop) -->
            <nav class="hidden items-center gap-8 md:flex">
                <a href="#fitur" class="text-sm font-semibold text-slate-600 transition hover:text-[#1e5b3d]">Fitur</a>
                <a href="#tentang" class="text-sm font-semibold text-slate-600 transition hover:text-[#1e5b3d]">Tentang Kami</a>
                <a href="#solusi" class="text-sm font-semibold text-slate-600 transition hover:text-[#1e5b3d]">Solusi Kayu</a>
                <a href="#harga" class="text-sm font-semibold text-slate-600 transition hover:text-[#1e5b3d]">Harga</a>
            </nav>

            <!-- Auth Buttons (Desktop) -->
            <div class="hidden items-center gap-3 md:flex">
                <template v-if="page.props.auth?.user">
                <Link href="/dashboard" class="rounded-xl bg-[#1e5b3d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1e5b3d]/20 transition hover:bg-[#16472f]">
                    Dashboard
                </Link>
                <Link href="/logout" method="post" as="button" class="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#1e5b3d] hover:text-[#1e5b3d]">
                    Logout
                </Link>
                </template>
                <template v-else>
                <Link href="/login" class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:text-[#1e5b3d]">
                    Masuk
                </Link>
                <Link href="/register" class="rounded-xl bg-[#1e5b3d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1e5b3d]/20 transition hover:bg-[#16472f]">
                    Coba Gratis
                </Link>
                </template>
            </div>

            <!-- Mobile Hamburger Button -->
            <button @click="mobileMenuOpen = !mobileMenuOpen" type="button" class="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            </div>

            <!-- Mobile Menu Dropdown -->
            <div v-show="mobileMenuOpen" class="border-b border-slate-200 bg-white px-4 pt-2 pb-6 shadow-xl md:hidden">
            <div class="flex flex-col space-y-3">
                <a href="#fitur" @click="mobileMenuOpen = false" class="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">Fitur</a>
                <a href="#tentang" @click="mobileMenuOpen = false" class="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">Tentang Kami</a>
                <a href="#solusi" @click="mobileMenuOpen = false" class="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">Solusi Kayu</a>
                <a href="#harga" @click="mobileMenuOpen = false" class="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">Harga</a>
                
                <hr class="border-slate-100">

                <template v-if="page.props.auth?.user">
                <Link href="/dashboard" class="w-full rounded-xl bg-[#1e5b3d] px-4 py-3 text-center text-sm font-bold text-white">
                    Dashboard
                </Link>
                <Link href="/logout" method="post" as="button" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700">
                    Logout
                </Link>
                </template>
                <template v-else>
                <Link href="/login" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700">
                    Masuk
                </Link>
                <Link href="/register" class="w-full rounded-xl bg-[#1e5b3d] px-4 py-3 text-center text-sm font-bold text-white">
                    Coba Gratis
                </Link>
                </template>
            </div>
            </div>
        </header>
        <section class="relative overflow-hidden bg-[#fbfbfa] pt-28 pb-20 md:pt-36 md:pb-28">
            <!-- Decorative Radial Background Gradient -->
            <div class="ellipse-glow absolute top-0 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#e7efe9]/80 via-[#1e5b3d]/5 to-transparent blur-3xl"></div>

            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
                    
                    <!-- Left Column: Copywriting -->
                    <div class="lg:col-span-7">
                        <!-- Badge -->
                        <div class="inline-flex items-center gap-2 rounded-full border border-[#1e5b3d]/15 bg-[#e7efe9]/60 px-4 py-1.5 backdrop-blur-md">
                            <span class="flex h-2 w-2 rounded-full bg-[#1e5b3d]"></span>
                            <span class="text-xs font-bold uppercase tracking-wider text-[#1e5b3d]">🌲 WoodFlow Operating System</span>
                        </div>

                        <!-- Headline -->
                        <h1 class="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.1]">
                            Kelola Pesanan & 
                            <span class="relative whitespace-nowrap text-[#1e5b3d]">
                                <span class="relative z-10">Keuangan Kayu</span>
                                <svg class="absolute -bottom-2 left-0 -z-10 h-3 w-full fill-[#1e5b3d]/20" viewBox="0 0 100 20" preserveAspectRatio="none">
                                    <path d="M0,15 Q50,5 100,15 T200,15" stroke="currentColor" stroke-width="4" fill="none" />
                                </svg>
                            </span>
                            Lebih Terintegrasi.
                        </h1>

                        <!-- Subheadline -->
                        <p class="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                            Satu platform terpadu untuk mencatat transaksi kayu, melacak antrean produksi, mengontrol arus kas, hingga pemantauan stok secara <span class="font-semibold text-slate-800">real-time</span>.
                        </p>

                        <!-- CTA Action Group -->
                        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <a href="#fitur" class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e5b3d] px-7 py-4 text-base font-bold text-white shadow-xl shadow-[#1e5b3d]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#16472f] hover:shadow-2xl active:translate-y-0">
                                <span>Mulai Kelola Sekarang</span>
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                            </a>

                            <a href="#tentang" class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white/80 px-7 py-4 text-base font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1e5b3d] hover:text-[#1e5b3d] hover:shadow-md active:translate-y-0">
                                Pelajari Sistem
                            </a>
                        </div>

                        <!-- Trust Metrics / Highlights -->
                        <div class="mt-10 flex items-center gap-8 border-t border-slate-200/80 pt-8 text-sm text-slate-600">
                            <div class="flex items-center gap-2">
                                <svg class="h-5 w-5 text-[#1e5b3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                <span>Real-time Inventory</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <svg class="h-5 w-5 text-[#1e5b3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                <span>Laporan Otomatis</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Interactive Visual Showcase -->
                    <div class="relative lg:col-span-5">
                        <div class="relative mx-auto w-full max-w-lg lg:max-w-none">
                            
                            <!-- Main Dashboard Preview Card -->
                            <div class="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
                                <!-- Top Bar Mockup -->
                                <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div class="flex items-center gap-2">
                                        <span class="h-3 w-3 rounded-full bg-rose-400"></span>
                                        <span class="h-3 w-3 rounded-full bg-amber-400"></span>
                                        <span class="h-3 w-3 rounded-full bg-emerald-400"></span>
                                    </div>
                                    <span class="text-xs font-medium text-slate-400">woodflow-dashboard.internal</span>
                                </div>

                                <!-- Card Content Preview -->
                                <div class="mt-5 space-y-4">
                                    <div class="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                        <p class="text-xs font-medium text-slate-500">Total Ringkasan Kas Bulan Ini</p>
                                        <p class="mt-1 text-2xl font-bold text-slate-900">Rp 148.500.000</p>
                                        <span class="mt-1 inline-flex items-center text-xs font-semibold text-emerald-600">
                                            ↑ 12.5% dibanding bulan lalu
                                        </span>
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                                            <span class="text-xs text-slate-500">Pesanan Aktif</span>
                                            <p class="text-lg font-bold text-[#1e5b3d]">24 Pesanan</p>
                                        </div>
                                        <div class="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                                            <span class="text-xs text-slate-[#1e5b3d]">Stok Meranti</span>
                                            <p class="text-lg font-bold text-slate-800">1.420 m³</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Floating Badge 1: Status Order -->
                            <div class="absolute -bottom-6 -left-6 rounded-xl border border-slate-100 bg-white p-4 shadow-xl hidden sm:flex items-center gap-3">
                                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7efe9] text-[#1e5b3d]">
                                    📦
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-slate-400">Status Pengiriman</p>
                                    <p class="text-sm font-bold text-slate-800">Kayu Jati SP-214 (Dikirim)</p>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
        <footer class="border-t border-slate-200 bg-white pt-16 pb-12 text-slate-600">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 gap-10 md:grid-cols-4">
                    
                    <!-- Col 1: Brand Info -->
                    <div class="md:col-span-1">
                        <div class="flex items-center gap-2">
                            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e5b3d] text-base text-white">🌲</span>
                            <span class="text-xl font-extrabold text-slate-900">Wood<span class="text-[#1e5b3d]">Flow</span></span>
                        </div>
                        <p class="mt-4 text-sm leading-relaxed text-slate-500">
                            Sistem manajemen terintegrasi untuk bisnis usaha kayu, pengolahan stok, dan pencatatan keuangan modern.
                        </p>
                    </div>

                    <!-- Col 2: Navigasi Produk -->
                    <div>
                        <h4 class="text-sm font-bold uppercase tracking-wider text-slate-900">Produk</h4>
                        <ul class="mt-4 space-y-2.5 text-sm">
                            <li><a href="#fitur" class="transition hover:text-[#1e5b3d]">Manajemen Stok</a></li>
                            <li><a href="#fitur" class="transition hover:text-[#1e5b3d]">Pencatatan Kas</a></li>
                            <li><a href="#fitur" class="transition hover:text-[#1e5b3d]">Tracking Pesanan</a></li>
                            <li><a href="#fitur" class="transition hover:text-[#1e5b3d]">Laporan Otomatis</a></li>
                        </ul>
                    </div>

                    <!-- Col 3: Perusahaan -->
                    <div>
                        <h4 class="text-sm font-bold uppercase tracking-wider text-slate-900">Perusahaan</h4>
                        <ul class="mt-4 space-y-2.5 text-sm">
                            <li><a href="#tentang" class="transition hover:text-[#1e5b3d]">Tentang Kami</a></li>
                            <li><a href="#" class="transition hover:text-[#1e5b3d]">Karir</a></li>
                            <li><a href="#" class="transition hover:text-[#1e5b3d]">Kebijakan Privasi</a></li>
                            <li><a href="#" class="transition hover:text-[#1e5b3d]">Syarat & Ketentuan</a></li>
                        </ul>
                    </div>

                    <!-- Col 4: Kontak / Bantuan -->
                    <div>
                        <h4 class="text-sm font-bold uppercase tracking-wider text-slate-900">Bantuan</h4>
                        <ul class="mt-4 space-y-2.5 text-sm">
                            <li><a href="#" class="transition hover:text-[#1e5b3d]">Pusat Bantuan</a></li>
                            <li><a href="#" class="transition hover:text-[#1e5b3d]">Dokumentasi API</a></li>
                            <li><a href="#" class="transition hover:text-[#1e5b3d]">Hubungi Dukungan</a></li>
                        </ul>
                    </div>

                </div>

                <!-- Bottom Copyright -->
                <div class="mt-12 border-t border-slate-100 pt-8 text-center text-xs text-slate-400">
                    &copy; WoodFlow. Hak Cipta Dilindungi Undang-Undang.
                </div>
            </div>
        </footer>
    </MainLayout>

</template>