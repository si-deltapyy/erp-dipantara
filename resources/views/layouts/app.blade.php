<!DOCTYPE html>
<html lang="id" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>@yield('title', 'WoodFlow - Sistem Manajemen Pesanan & Keuangan Kayu')</title>
    <meta name="description" content="@yield('description', 'WoodFlow adalah sistem manajemen pesanan dan keuangan kayu yang membantu bisnis kayu mengelola stok, pesanan, dan keuangan secara efisien.')">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Alpine.js untuk interaktivitas UI (Navbar Mobile, Dropdown, dll) -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    @vite([
        'resources/css/app.css',
        'resources/js/app.js'
    ])

    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
    </style>

    @stack('styles')
</head>

<body class="flex min-h-screen flex-col bg-[#fbfbfa] text-slate-800 antialiased" x-data="{ mobileMenuOpen: false }">

    <!-- NAVBAR HEADER -->
    <header class="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            
            <!-- Logo Brand -->
            <a href="/" class="flex items-center gap-2">
                <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e5b3d] text-lg text-white shadow-md shadow-[#1e5b3d]/20">
                    🌲
                </span>
                <span class="text-xl font-extrabold tracking-tight text-slate-900">
                    Wood<span class="text-[#1e5b3d]">Flow</span>
                </span>
            </a>

            <!-- Navigation Links (Desktop) -->
            <nav class="hidden items-center gap-8 md:flex">
                <a href="#fitur" class="text-sm font-semibold text-slate-600 transition hover:text-[#1e5b3d]">Fitur</a>
                <a href="#tentang" class="text-sm font-semibold text-slate-600 transition hover:text-[#1e5b3d]">Tentang Kami</a>
                <a href="#solusi" class="text-sm font-semibold text-slate-600 transition hover:text-[#1e5b3d]">Solusi Kayu</a>
                <a href="#harga" class="text-sm font-semibold text-slate-600 transition hover:text-[#1e5b3d]">Harga</a>
            </nav>

            <!-- Auth Buttons (Desktop) -->
            <div class="hidden items-center gap-3 md:flex">
                @auth
                    <a href="{{ route('dashboard') }}" class="rounded-xl bg-[#1e5b3d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1e5b3d]/20 transition hover:bg-[#16472f]">
                        Dashboard
                    </a>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#1e5b3d] hover:text-[#1e5b3d]">
                            Logout
                        </button>
                    </form>
                @else
                    <a href="{{ route('login') }}" class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:text-[#1e5b3d]">
                        Masuk
                    </a>
                    <a href="{{ route('register') }}" class="rounded-xl bg-[#1e5b3d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1e5b3d]/20 transition hover:bg-[#16472f]">
                        Coba Gratis
                    </a>
                @endauth
            </div>

            <!-- Mobile Hamburger Button -->
            <button @click="mobileMenuOpen = !mobileMenuOpen" type="button" class="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path x-show="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    <path x-show="mobileMenuOpen" x-cloak stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <!-- Mobile Menu Dropdown -->
        <div x-show="mobileMenuOpen" x-cloak class="border-b border-slate-200 bg-white px-4 pt-2 pb-6 shadow-xl md:hidden">
            <div class="flex flex-col space-y-3">
                <a href="#fitur" @click="mobileMenuOpen = false" class="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">Fitur</a>
                <a href="#tentang" @click="mobileMenuOpen = false" class="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">Tentang Kami</a>
                <a href="#solusi" @click="mobileMenuOpen = false" class="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">Solusi Kayu</a>
                <a href="#harga" @click="mobileMenuOpen = false" class="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50">Harga</a>
                
                <hr class="border-slate-100">

                @auth
                    <a href="{{ route('dashboard') }}" class="w-full rounded-xl bg-[#1e5b3d] px-4 py-3 text-center text-sm font-bold text-white">Dashboard</a>
                @else
                    <a href="{{ route('login') }}" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700">Masuk</a>
                    <a href="{{ route('register') }}" class="w-full rounded-xl bg-[#1e5b3d] px-4 py-3 text-center text-sm font-bold text-white">Coba Gratis</a>
                @endauth
            </div>
        </div>
    </header>

    <!-- MAIN CONTENT AREA -->
    <main class="flex-grow">
        @yield('content')
    </main>

    <!-- FOOTER -->
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
                &copy; {{ date('Y') }} WoodFlow. Hak Cipta Dilindungi Undang-Undang.
            </div>
        </div>
    </footer>

    @stack('scripts')

</body>

</html>