<script setup>
import Navbar from '@/Components/Navbar.vue';
import Footer from '@/Components/Footer.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <!-- Navbar Stays at Top -->
    <Navbar />

    <!-- Dynamic Content Area -->
    <main class="flex-grow">
      <slot />
    </main>

    <!-- Footer Stays at Bottom -->
    <Footer />
  </div>
</template>