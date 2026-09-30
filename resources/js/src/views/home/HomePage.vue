<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import { ref, onMounted } from 'vue'

const dashboardData = ref<any>(null)
const loading = ref(true)

const formatCurrency = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return 'Rp 0'

  if (typeof val === 'string' && val.trim().startsWith('Rp')) {
    return val
  }

  const num = Number(val)
  if (isNaN(num)) return String(val)

  const absNum = Math.abs(num)

  if (absNum >= 1_000_000_000) {
    const formatted = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')
    return `Rp ${formatted}M`
  }

  if (absNum >= 100_000_000) {
    const formatted = (num / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return `Rp ${formatted}Jt`
  }

  return `Rp ${num.toLocaleString('id-ID')}`
}

const loadData = async () => {
  try {
    // Ambil token yang tersimpan di localStorage
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch('/api/v1/dashboard', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}` 
        }
    });
    
    if (response.status === 401) {
        window.location.href = '/login';
        return;
    }

    if (!response.ok) throw new Error('Gagal memuat data');
    dashboardData.value = await response.json();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const { t } = useI18n()

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');

  if (tokenFromUrl) {
      localStorage.setItem('auth_token', tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
  }
  if (!localStorage.getItem('auth_token')) {
      window.location.href = '/login';
      return;
  }
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <header class="mb-6">
      <div class="flex items-center gap-3">
        <div class="h-8 w-2.5 rounded-full bg-amber-800/80"></div>
        <h1 class="text-2xl font-bold tracking-tight text-amber-950 sm:text-3xl">
          {{ t('home.title') || 'Dashboard Management & Summary' }}
        </h1>
      </div>
      <p class="mt-1 text-sm text-amber-900/70">
        {{ t('home.description') || 'Monitoring real-time untuk pengambilan keputusan' }}
      </p>
    </header>

    <!-- State Loading -->
    <div v-if="loading" class="p-8 text-center text-muted">
      <p>Memuat status...</p>
    </div>

    <!-- Main Grid Layout -->
    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      
      <!-- Left Column: 6 Summary Cards (2 Grid Columns) -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
        
        <!-- Card 1: Total PO Aktif -->
        <article class="panel relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border-t-4 border-amber-800/40">
          <div class="flex items-center justify-between">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 text-primary">
              <AppIcon name="close" :size="20" />
            </span>
            <span class="text-2xl font-bold text-amber-950">
              {{ dashboardData?.data?.summary?.total_po_aktif ?? 24 }}
            </span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-bold text-gray-800">Total PO Aktif</h3>
            <p class="mt-0.5 text-xs text-gray-500">Pesanan dalam sistem</p>
          </div>
        </article>

        <!-- Card 2: PO Dalam Proses -->
        <article class="panel relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border-t-4 border-amber-800/40">
          <div class="flex items-center justify-between">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 text-primary">
              <AppIcon name="loader" :size="20" />
            </span>
            <span class="text-2xl font-bold text-amber-950">
              {{ dashboardData?.data?.summary?.po_dalam_proses ?? 12 }}
            </span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-bold text-gray-800">PO Dalam Proses</h3>
            <p class="mt-0.5 text-xs text-gray-500">Sedang dikerjakan</p>
          </div>
        </article>

        <!-- Card 3: PO Menunggu DP -->
        <article class="panel relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border-t-4 border-amber-800/40">
          <div class="flex items-center justify-between">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 text-primary">
              <AppIcon name="hourglass" :size="20" />
            </span>
            <span class="text-2xl font-bold text-primary">
              {{ dashboardData?.data?.summary?.po_menunggu_dp ?? 5 }}
            </span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-bold text-gray-800">PO Menunggu DP</h3>
            <p class="mt-0.5 text-xs text-gray-500">Belum ada pembayaran</p>
          </div>
        </article>

        <!-- Card 4: PO Menunggu Pelunasan -->
        <article class="panel relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border-t-4 border-amber-800/40">
          <div class="flex items-center justify-between">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 text-primary">
              <AppIcon name="clock" :size="20" />
            </span>
            <span class="text-2xl font-bold text-amber-950">
              {{ dashboardData?.data?.summary?.po_menunggu_pelunasan ?? 7 }}
            </span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-bold text-gray-800">PO Menunggu Pelunasan</h3>
            <p class="mt-0.5 text-xs text-gray-500">Pengiriman selesai</p>
          </div>
        </article>

        <!-- Card 5: Total Piutang Buyer -->
        <article class="panel relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border-t-4 border-amber-800/40">
          <div class="flex items-center justify-between">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 text-primary">
              <AppIcon name="dollar-sign" :size="20" />
            </span>
            <span class="text-xl font-bold text-primary">
              {{ formatCurrency(dashboardData?.data?.summary?.total_piutang) ?? '-Rp 0' }}
            </span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-bold text-gray-800">Total Piutang Buyer</h3>
            <p class="mt-0.5 text-xs text-gray-500">Belum diterima</p>
          </div>
        </article>

        <!-- Card 6: Total Hutang ke Mitra -->
        <article class="panel relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border-t-4 border-amber-800/40">
          <div class="flex items-center justify-between">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 text-primary">
              <AppIcon name="credit-card" :size="20" />
            </span>
            <span class="text-xl font-bold text-primary">
                {{ formatCurrency(dashboardData?.data?.summary?.total_hutang) ?? '-Rp 0' }}
            </span>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-bold text-gray-800">Total Hutang ke Mitra</h3>
            <p class="mt-0.5 text-xs text-gray-500">Belum dibayar</p>
          </div>
        </article>

      </div>

      <!-- Right Column: Cashflow Summary & Grafik Omzet -->
      <div class="space-y-6">
        
        <!-- Cashflow Summary Panel -->
        <div class="rounded-2xl bg-amber-900 p-6 text-white shadow-md">
          <div class="mb-6 flex items-center gap-2">
            <AppIcon name="layers" :size="20" class="text-amber-200" />
            <h2 class="text-lg font-bold">Cashflow Summary</h2>
          </div>

          <div class="space-y-5">
            <!-- Pemasukan -->
            <div>
              <div class="mb-1.5 flex justify-between text-sm">
                <span class="text-amber-100/80">Pemasukan</span>
                <span class="font-bold text-emerald-400">
                  {{ formatCurrency(dashboardData?.data?.cashflow?.pemasukan) ?? '-Rp 0' }}
                </span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-amber-950/60">
                <div class="h-full rounded-full bg-emerald-400" style="width: 80%"></div>
              </div>
            </div>

            <!-- Pengeluaran -->
            <div>
              <div class="mb-1.5 flex justify-between text-sm">
                <span class="text-amber-100/80">Pengeluaran</span>
                <span class="font-bold text-rose-300">
                  {{ formatCurrency(dashboardData?.data?.cashflow?.pengeluaran) ?? '-Rp 0' }}
                </span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-amber-950/60">
                <div class="h-full rounded-full bg-rose-400" style="width: 55%"></div>
              </div>
            </div>

            <!-- Net Cashflow -->
            <div>
              <div class="mb-1.5 flex justify-between text-sm">
                <span class="text-amber-100/80">Net Cashflow</span>
                <span class="font-bold text-amber-200">
                  {{ formatCurrency(dashboardData?.data?.cashflow?.net) ?? '-Rp 0' }}
                </span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-amber-950/60">
                <div class="h-full rounded-full bg-amber-400/60" style="width: 40%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grafik Omzet Panel -->
        <div class="rounded-xl bg-white p-5 shadow-sm border-t-4 border-amber-800/40">
          <div class="mb-4 flex items-center gap-2">
            <AppIcon name="bar-chart-2" :size="18" class="text-primary" />
            <h3 class="text-sm font-bold text-gray-800">Grafik Omzet</h3>
          </div>

          <div class="space-y-3 text-xs">
            <!-- Jan -->
            <div class="flex items-center gap-3">
              <span class="w-7 text-gray-500 font-medium">Jan</span>
              <div class="flex-1 overflow-hidden rounded-full bg-gray-100 h-3">
                <div class="h-full rounded-full bg-amber-900" style="width: 60%"></div>
              </div>
              <span class="w-16 text-right font-bold text-gray-800">Rp 450M</span>
            </div>

            <!-- Feb -->
            <div class="flex items-center gap-3">
              <span class="w-7 text-gray-500 font-medium">Feb</span>
              <div class="flex-1 overflow-hidden rounded-full bg-gray-100 h-3">
                <div class="h-full rounded-full bg-amber-800/80" style="width: 75%"></div>
              </div>
              <span class="w-16 text-right font-bold text-gray-800">Rp 580M</span>
            </div>

            <!-- Mar -->
            <div class="flex items-center gap-3">
              <span class="w-7 text-gray-500 font-medium">Mar</span>
              <div class="flex-1 overflow-hidden rounded-full bg-gray-100 h-3">
                <div class="h-full rounded-full bg-amber-600/70" style="width: 90%"></div>
              </div>
              <span class="w-16 text-right font-bold text-gray-800">Rp 720M</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>