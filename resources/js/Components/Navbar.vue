<script setup>
import { ref } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

// Ambil data auth yang di-pass via HandleInertiaRequests middleware
const page = usePage();

// State reactive untuk toggle menu mobile
const mobileMenuOpen = ref(false);
</script>

<template>
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
          <a href="/dashboard" class="rounded-xl bg-[#1e5b3d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1e5b3d]/20 transition hover:bg-[#16472f]">
            Dashboard
          </a>
          <Link href="/logout" method="post" as="button" class="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#1e5b3d] hover:text-[#1e5b3d]">
            Logout
          </Link>
        </template>
        <template v-else>
          <a href="/login" class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:text-[#1e5b3d]">
            Masuk
          </a>
          <a href="/register" class="rounded-xl bg-[#1e5b3d] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1e5b3d]/20 transition hover:bg-[#16472f]">
            Coba Gratis
          </a>
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
          <a href="/dashboard" class="w-full rounded-xl bg-[#1e5b3d] px-4 py-3 text-center text-sm font-bold text-white">
            Dashboard
          </a>
          <Link href="/logout" method="post" as="button" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700">
            Logout
          </Link>
        </template>
        <template v-else>
          <a href="/login" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700">
            Masuk
          </a>
          <a href="/register" class="w-full rounded-xl bg-[#1e5b3d] px-4 py-3 text-center text-sm font-bold text-white">
            Coba Gratis
          </a>
        </template>
      </div>
    </div>
  </header>
</template>