<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WoodFlow - Dipantara Timber ERP</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Alpine.js CDN for interactive animations -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            dark: '#0f1f16',      /* Deep Forest Dark */
                            primary: '#1e3a2b',   /* Timber Emerald */
                            accent: '#8b5e34',    /* Teak Wood */
                            gold: '#d4a373',      /* Golden Wood */
                            light: '#f4f6f0',     /* Eco Off-white */
                            card: '#162b20'
                        }
                    },
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'sans-serif'],
                    },
                    animation: {
                        'float': 'float 6s ease-in-out infinite',
                        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    },
                    keyframes: {
                        float: {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-12px)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .wood-gradient {
            background: linear-gradient(135deg, #0f1f16 0%, #1e3a2b 50%, #2a4738 100%);
        }
    </style>
</head>
<body class="bg-brand-light text-gray-800 font-sans antialiased overflow-x-hidden selection:bg-brand-accent selection:text-white" x-data="{ mobileMenu: false }">

    <!-- Header / Navbar -->
    <header class="bg-brand-dark/95 backdrop-blur-md border-b border-emerald-900/40 sticky top-0 z-50 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <!-- Brand Logo -->
                <a href="#" class="flex items-center space-x-3 group">
                    <div class="w-11 h-11 bg-gradient-to-br from-brand-accent to-brand-gold rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-accent/20 group-hover:scale-105 transition-transform duration-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                        </svg>
                    </div>
                    <div>
                        <span class="text-xl font-black tracking-wider text-white block leading-none">WOODFLOW</span>
                        <span class="text-[10px] font-bold text-brand-gold tracking-widest uppercase">Dipantara Timber ERP</span>
                    </div>
                </a>

                <!-- Desktop Navigation -->
                <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-emerald-100/80">
                    <a href="#fitur" class="hover:text-brand-gold transition-colors">Fitur Utama</a>
                    <a href="#alur" class="hover:text-brand-gold transition-colors">Alur Kerja</a>
                    <a href="#statistik" class="hover:text-brand-gold transition-colors">Performa</a>
                    <a href="#faq" class="hover:text-brand-gold transition-colors">FAQ</a>
                </nav>

                <!-- Auth Buttons -->
                <div class="hidden md:flex items-center space-x-4">
                    @if (Route::has('login'))
                        @auth
                            <a href="{{ url('/dashboard') }}" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-accent to-amber-700 text-white font-semibold hover:shadow-lg hover:shadow-brand-accent/30 hover:-translate-y-0.5 transition-all duration-200">
                                Dashboard ERP &rarr;
                            </a>
                        @else
                            <a href="{{ route('login') }}" class="px-5 py-2.5 rounded-xl text-emerald-200 font-medium hover:text-white hover:bg-white/5 transition duration-200">
                                Log in
                            </a>
                            @if (Route::has('register'))
                                <a href="{{ route('register') }}" class="px-6 py-2.5 rounded-xl bg-brand-accent hover:bg-amber-800 text-white font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                                    Akses Sistem
                                </a>
                            @endif
                        @endauth
                    @endif
                </div>

                <!-- Mobile Menu Button -->
                <button @click="mobileMenu = !mobileMenu" class="md:hidden text-emerald-200 focus:outline-none">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path x-show="!mobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        <path x-show="mobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile Menu Dropdown -->
        <div x-show="mobileMenu" x-transition class="md:hidden bg-brand-dark border-b border-emerald-900/50 px-4 pt-2 pb-6 space-y-3">
            <a href="#fitur" @click="mobileMenu = false" class="block text-emerald-100 py-2">Fitur Utama</a>
            <a href="#alur" @click="mobileMenu = false" class="block text-emerald-100 py-2">Alur Kerja</a>
            <a href="#statistik" @click="mobileMenu = false" class="block text-emerald-100 py-2">Performa</a>
            <a href="#faq" @click="mobileMenu = false" class="block text-emerald-100 py-2">FAQ</a>
            <div class="pt-4 border-t border-emerald-900/50 flex flex-col space-y-2">
                @auth
                    <a href="{{ url('/dashboard') }}" class="w-full text-center py-2.5 rounded-xl bg-brand-accent text-white font-semibold">Dashboard ERP</a>
                @else
                    <a href="{{ route('login') }}" class="w-full text-center py-2.5 rounded-xl border border-emerald-700 text-emerald-100">Log in</a>
                @endauth
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="wood-gradient text-white relative overflow-hidden py-20 lg:py-32">
        <!-- Background Decorative Glows -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                <!-- Hero Text Content -->
                <div class="lg:col-span-7 space-y-8 text-center lg:text-left">
                    <div class="inline-flex items-center space-x-2 bg-emerald-900/60 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-emerald-300 uppercase shadow-inner">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Sistem ERP Pengelolaan Hutan Raya v2.0</span>
                        <img :src="barcode_svg" alt="Barcode Kayu" class="w-48 h-auto" />
                        <p>Kode Log: abc</p>
                    </div>

                    <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
                        Kendali Penuh Rantai Pasok <span class="bg-gradient-to-r from-brand-gold via-amber-200 to-amber-500 bg-clip-text text-transparent">Kayu Hutan Raya</span>
                    </h1>

                    <p class="text-lg text-emerald-100/80 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        Integrasi end-to-end pemanenan, inventarisasi log tegakan, pelacakan barcode barcode/RFID, hingga verifikasi legalitas SVLK untuk PT Dipantara Timber.
                    </p>

                    <!-- CTA Buttons -->
                    <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                        @auth
                            <a href="{{ url('/dashboard') }}" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-accent to-amber-700 text-white font-bold text-base shadow-xl shadow-brand-accent/20 hover:scale-105 transition-all duration-300 text-center">
                                Masuk ke Dashboard &rarr;
                            </a>
                        @else
                            <a href="{{ route('login') }}" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-accent to-amber-700 text-white font-bold text-base shadow-xl shadow-brand-accent/20 hover:scale-105 transition-all duration-300 text-center">
                                Mulai Operasional
                            </a>
                        @endauth
                        <a href="#alur" class="w-full sm:w-auto px-8 py-4 rounded-xl glass-card text-emerald-100 font-semibold text-base hover:bg-white/10 transition-all duration-300 text-center">
                            Lihat Alur Kerja
                        </a>
                    </div>

                    <!-- Highlight Badges -->
                    <div class="pt-6 border-t border-emerald-900/60 grid grid-cols-3 gap-4 text-center lg:text-left">
                        <div>
                            <div class="text-2xl font-extrabold text-brand-gold">100%</div>
                            <div class="text-xs text-emerald-200/70">Lacak Origin Kayu</div>
                        </div>
                        <div>
                            <div class="text-2xl font-extrabold text-brand-gold">SVLK</div>
                            <div class="text-xs text-emerald-200/70">Kepatuhan Legal</div>
                        </div>
                        <div>
                            <div class="text-2xl font-extrabold text-brand-gold">Real-time</div>
                            <div class="text-xs text-emerald-200/70">Monitoring TPK</div>
                        </div>
                    </div>
                </div>

                <!-- Hero Visual (Interactive Floating Dashboard Card) -->
                <div class="lg:col-span-5 relative">
                    <div class="relative mx-auto max-w-md lg:max-w-none animate-float">
                        
                        <!-- Main Card -->
                        <div class="bg-brand-card rounded-3xl p-6 shadow-2xl border border-emerald-500/20 text-white space-y-6 relative z-10">
                            <div class="flex justify-between items-center pb-4 border-b border-emerald-800/60">
                                <div class="flex items-center space-x-3">
                                    <div class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                                    <span class="text-sm font-semibold tracking-wide text-emerald-200">Status Tebangan Hari Ini</span>
                                </div>
                                <span class="text-xs bg-emerald-900/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/50">Live Sync</span>
                            </div>

                            <!-- Metrics Box -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-800/40">
                                    <span class="text-xs text-emerald-300/70 block mb-1">Volume Kayu Log</span>
                                    <span class="text-2xl font-black text-white">2,845 m³</span>
                                    <span class="text-[10px] text-emerald-400 block mt-1">↑ +12% dari minggu lalu</span>
                                </div>
                                <div class="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-800/40">
                                    <span class="text-xs text-emerald-300/70 block mb-1">Barcode Terdaftar</span>
                                    <span class="text-2xl font-black text-brand-gold">1,120 Pcs</span>
                                    <span class="text-[10px] text-emerald-400 block mt-1">100% Terverifikasi</span>
                                </div>
                            </div>

                            <!-- Progress Tracking -->
                            <div class="space-y-3">
                                <div class="flex justify-between text-xs font-medium">
                                    <span class="text-emerald-200">Kuota Tebangan Petak D-04</span>
                                    <span class="text-brand-gold">84%</span>
                                </div>
                                <div class="w-full bg-emerald-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-emerald-800/50">
                                    <div class="bg-gradient-to-r from-brand-accent to-brand-gold h-1.5 rounded-full transition-all duration-1000" style="width: 84%"></div>
                                </div>
                            </div>

                            <!-- Real-time Activity Mini List -->
                            <div class="space-y-2 pt-2">
                                <p class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Aktivitas Terakhir TPK</p>
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs hover:bg-white/10 transition">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                                        <span>Log Jati #LOG-8821 Diangkut</span>
                                    </div>
                                    <span class="text-emerald-300/60">10m lalu</span>
                                </div>
                            </div>
                        </div>

                        <!-- Back Glow Behind Card -->
                        <div class="absolute -inset-1 bg-gradient-to-r from-brand-accent to-emerald-600 rounded-3xl blur-xl opacity-30 -z-10"></div>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- Section 1: Fitur Utama ERP -->
    <section id="fitur" class="py-24 bg-white relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <h2 class="text-xs font-bold text-brand-accent uppercase tracking-widest">Modul Terintegrasi</h2>
                <p class="text-3xl sm:text-4xl font-extrabold text-brand-dark">Dirancang Khusus untuk Industri Kayu Hutan Raya</p>
                <p class="text-gray-600">Menyederhanakan kompleksitas pengelolaan kayu dari hutan hingga menjadi produk siap distribusi.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                <!-- Feature 1 -->
                <div class="p-8 rounded-2xl bg-brand-light border border-gray-200/80 hover:border-brand-accent/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-accent transition-all duration-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    </div>
                    <h3 class="text-xl font-bold text-brand-dark mb-3">Barcode Log Tagging</h3>
                    <p class="text-gray-600 text-sm leading-relaxed">
                        Pemberian identitas unik RFID/Barcode pada setiap batang kayu hasil tebangan untuk pelacakan diameter, panjang, dan kualitas kayu secara akurat.
                    </p>
                </div>

                <!-- Feature 2 -->
                <div class="p-8 rounded-2xl bg-brand-light border border-gray-200/80 hover:border-brand-accent/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-accent transition-all duration-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <h3 class="text-xl font-bold text-brand-dark mb-3">Otomatisasi SVLK & Dokumen</h3>
                    <p class="text-gray-600 text-sm leading-relaxed">
                        Penerbitan Surat Keterangan Sahnya Hasil Hutan (SKSHH) dan sertifikasi legalitas kayu secara otomatis sesuai regulasi pemerintah.
                    </p>
                </div>

                <!-- Feature 3 -->
                <div class="p-8 rounded-2xl bg-brand-light border border-gray-200/80 hover:border-brand-accent/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div class="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-accent transition-all duration-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-6v6m4-5v5m-8-9h11M4 21h16M3 7h18"/></svg>
                    </div>
                    <h3 class="text-xl font-bold text-brand-dark mb-3">Manajemen TPK & Stok</h3>
                    <p class="text-gray-600 text-sm leading-relaxed">
                        Pantau penumpukan kayu di Tempat Penimbunan Kayu (TPK) secara visual, mencegah kerugian penyusutan volume dan kerusakan kayu.
                    </p>
                </div>

            </div>
        </div>
    </section>

    <!-- Section 2: Alur Kerja (Workflow Timeline) -->
    <section id="alur" class="py-24 bg-brand-dark text-white relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center max-w-3xl mx-auto mb-20 space-y-4">
                <h2 class="text-xs font-bold text-brand-gold uppercase tracking-widest">Sistem Rantai Pasok</h2>
                <p class="text-3xl sm:text-4xl font-extrabold">Bagaimana WoodFlow Bekerja</p>
            </div>

            <!-- Workflow Steps -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                
                <!-- Step 1 -->
                <div class="space-y-4 relative text-center md:text-left">
                    <div class="w-14 h-14 rounded-2xl bg-brand-accent text-white font-extrabold text-xl flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-brand-accent/30">
                        01
                    </div>
                    <h4 class="text-lg font-bold text-emerald-200">Inventarisasi Hutan</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        Pencatatan data pohon tegakan dan zonasi petak tebang di kawasan hutan raya Dipantara Timber.
                    </p>
                </div>

                <!-- Step 2 -->
                <div class="space-y-4 relative text-center md:text-left">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-800 border border-emerald-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto md:mx-0">
                        02
                    </div>
                    <h4 class="text-lg font-bold text-emerald-200">Penebangan & Tagging</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        Kayu ditebang, diukur kubikasi nilainya, dan dipasang barcode fisik sebelum masuk truk angkut.
                    </p>
                </div>

                <!-- Step 3 -->
                <div class="space-y-4 relative text-center md:text-left">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-800 border border-emerald-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto md:mx-0">
                        03
                    </div>
                    <h4 class="text-lg font-bold text-emerald-200">Penerimaan TPK</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        Petugas TPK memindai barcode untuk memvalidasi fisik kayu dengan manifes pengiriman.
                    </p>
                </div>

                <!-- Step 4 -->
                <div class="space-y-4 relative text-center md:text-left">
                    <div class="w-14 h-14 rounded-2xl bg-brand-gold text-brand-dark font-extrabold text-xl flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-brand-gold/20">
                        04
                    </div>
                    <h4 class="text-lg font-bold text-emerald-200">Distribusi & Legalitas</h4>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        Penerbitan dokumen legal angkut otomatis dan kayu siap diproses industri atau diekspor.
                    </p>
                </div>

            </div>
        </div>
    </section>

    <!-- Section 3: Statistik Performa -->
    <section id="statistik" class="py-20 bg-brand-light border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div class="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div class="text-3xl sm:text-4xl font-black text-brand-primary mb-2">50.000+</div>
                    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Batang Kayu Terlacak</div>
                </div>
                <div class="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div class="text-3xl sm:text-4xl font-black text-brand-accent mb-2">99.8%</div>
                    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Akurasi Kubikasi</div>
                </div>
                <div class="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div class="text-3xl sm:text-4xl font-black text-brand-primary mb-2">12 Hutan</div>
                    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blok Hutan Raya</div>
                </div>
                <div class="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div class="text-3xl sm:text-4xl font-black text-brand-accent mb-2">0 Halangan</div>
                    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit SVLK Legalitas</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 4: Pertanyaan Umum (FAQ) Accordion -->
    <section id="faq" class="py-24 bg-white" x-data="{ active: null }">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16 space-y-3">
                <h2 class="text-xs font-bold text-brand-accent uppercase tracking-widest">FAQ</h2>
                <p class="text-3xl font-extrabold text-brand-dark">Pertanyaan Umum Mengenai WoodFlow</p>
            </div>

            <div class="space-y-4">
                
                <!-- FAQ 1 -->
                <div class="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200">
                    <button @click="active = (active === 1 ? null : 1)" class="w-full p-6 text-left font-bold text-brand-dark flex justify-between items-center bg-gray-50 hover:bg-gray-100">
                        <span>Apakah sistem ini mendukung pemindaian offline di dalam hutan?</span>
                        <span class="text-xl font-bold transition-transform" :class="active === 1 ? 'rotate-180' : ''">&darr;</span>
                    </button>
                    <div x-show="active === 1" x-collapse class="p-6 bg-white text-sm text-gray-600 border-t border-gray-100 leading-relaxed">
                        Ya. Aplikasi mobile lapangan WoodFlow dilengkapi dengan fitur penyimpanan offline. Data pemindaian barcode kayu di area hutan tanpa sinyal akan tersimpan lokal dan otomatis tersinkronisasi saat perangkat terhubung ke jaringan internet.
                    </div>
                </div>

                <!-- FAQ 2 -->
                <div class="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200">
                    <button @click="active = (active === 2 ? null : 2)" class="w-full p-6 text-left font-bold text-brand-dark flex justify-between items-center bg-gray-50 hover:bg-gray-100">
                        <span>Bagaimana WoodFlow menjamin kepatuhan SVLK?</span>
                        <span class="text-xl font-bold transition-transform" :class="active === 2 ? 'rotate-180' : ''">&darr;</span>
                    </button>
                    <div x-show="active === 2" x-collapse class="p-6 bg-white text-sm text-gray-600 border-t border-gray-100 leading-relaxed">
                        WoodFlow mencatat riwayat asal-usul kayu (*chain of custody*) dari koordinat pohon ditebang hingga dokumen angkut. Data ini terekam tidak dapat dimanipulasi sehingga mempermudah proses verifikasi audit SVLK.
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-brand-dark text-white border-t border-emerald-900/40 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row justify-between items-center gap-6">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-white font-bold">
                        W
                    </div>
                    <span class="font-bold tracking-wider text-white">WOODFLOW</span>
                </div>

                <div class="text-xs text-gray-400 text-center md:text-right space-y-1">
                    <p>&copy; {{ date('Y') }} PT Dipantara Timber. All rights reserved.</p>
                    <p>Sistem ERP Pengelolaan Kayu Hutan Raya Berkelanjutan.</p>
                </div>
            </div>
        </div>
    </footer>

</body>
</html>