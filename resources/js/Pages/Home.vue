<script setup>
import { ref } from 'vue';

defineProps({
  title: String,
  message: String,
});

const search = ref('');
const stats = ref([
  { label: 'Total Modul', value: '24', change: '+12%', color: 'text-emerald-500' },
  { label: 'Pengguna Aktif', value: '1,240', change: '+5%', color: 'text-blue-500' },
  { label: 'Status Sistem', value: 'Optimal', change: '99.9%', color: 'text-indigo-500' },
]);

const items = ref([
  { id: 1, name: 'Manajemen Pengguna', category: 'Sistem', status: 'Aktif' },
  { id: 2, name: 'Laporan Keuangan', category: 'Finansial', status: 'Pending' },
  { id: 3, name: 'Inventaris Barang', category: 'Logistik', status: 'Aktif' },
]);
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-6 md:p-10 text-slate-800">
    <div class="max-w-5xl mx-auto space-y-6">
      
      <!-- Header Section -->
      <header class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ title }}
          </h1>
          <p class="mt-1 text-sm text-slate-500">
            {{ message }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition">
            Ekspor
          </button>
          <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-sm transition">
            + Tambah Data
          </button>
        </div>
      </header>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          v-for="(stat, idx) in stats" 
          :key="idx" 
          class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
        >
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ stat.label }}</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-2xl font-bold text-slate-900">{{ stat.value }}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100" :class="stat.color">
              {{ stat.change }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Card / Table Area -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <!-- Filter Bar -->
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="relative w-full sm:w-72">
            <input 
              v-model="search"
              type="text" 
              placeholder="Cari sesuatu..." 
              class="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end text-sm text-slate-500">
            <span>Filter:</span>
            <select class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Semua</option>
              <option>Aktif</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-slate-400 text-xs uppercase font-semibold tracking-wider">
                <th class="py-3 px-6">ID</th>
                <th class="py-3 px-6">Nama Modul</th>
                <th class="py-3 px-6">Kategori</th>
                <th class="py-3 px-6">Status</th>
                <th class="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr 
                v-for="item in items" 
                :key="item.id"
                class="hover:bg-slate-50/80 transition"
              >
                <td class="py-4 px-6 font-medium text-slate-400">#0{{ item.id }}</td>
                <td class="py-4 px-6 font-semibold text-slate-800">{{ item.name }}</td>
                <td class="py-4 px-6 text-slate-500">{{ item.category }}</td>
                <td class="py-4 px-6">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right space-x-2">
                  <button class="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                  <button class="text-rose-600 hover:text-rose-900 font-medium">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  </div>
</template>