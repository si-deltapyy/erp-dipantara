@extends('layouts.app')

@section('title', 'WoodFlow - Sistem Manajemen Pesanan & Keuangan Kayu')

@section('content')

    <section class="relative overflow-hidden bg-[#fbfbfa] pt-28 pb-20 md:pt-36 md:pb-28">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
                <!-- Left Column: Copywriting -->
                <div class="lg:col-span-7">
                    <!-- Headline -->
                    <h1 class="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.1]">
                        Selamat Datang
                        <span class="relative whitespace-nowrap text-[#1e5b3d]">
                            <span class="relative z-10">{{ Auth::user()->roles->first()->name }}</span>
                            <svg class="absolute -bottom-2 left-0 -z-10 h-3 w-full fill-[#1e5b3d]/20" viewBox="0 0 100 20" preserveAspectRatio="none">
                                <path d="M0,15 Q50,5 100,15 T200,15" stroke="currentColor" stroke-width="4" fill="none" />
                            </svg>
                        </span>
                    </h1>

                    orderan : {{ $countPreOrdersActive }} <br>
                    orderan selesai : {{ $countPreOrdersCompleted }} <br>
                    orderan diproses : {{ $countPreOrdersProcessed }} <br>
                    hutang ke mitra : {{ $countDebtorsToMitra }} <br>
                    hutang dari pembeli : {{ $countDebtorsFromBuyer }} <br>
                </div>
            </div>
        </div>
    </section>
    
@endsection