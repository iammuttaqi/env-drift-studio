<script setup lang="ts">
import { onMounted } from 'vue'
import {
  Layers,
  ShieldAlert,
  FileCode,
  Terminal,
  Fingerprint,
  Eye,
  Database,
  ChevronDown,
  Sparkles,
} from 'lucide-vue-next'
import { useEnvDrift } from '~/composables/useEnvDrift'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiDropdownMenu, { type MenuItem } from '~/components/ui/UiDropdownMenu.vue'

const {
  healthScore,
  metrics,
  isZeroKnowledgeMasked,
  projectName,
  loadPreset,
  init,
} = useEnvDrift()

onMounted(async () => {
  await init()
})

const route = useRoute()

const navLinks = [
  { path: '/', label: 'Drift Matrix', icon: Layers },
  { path: '/security', label: 'Security & Leaks', icon: ShieldAlert, countKey: 'leakCount' },
  { path: '/compiler', label: 'Schema Compiler', icon: FileCode },
  { path: '/export', label: 'CI/CD Gatekeeper', icon: Terminal },
]

const presetMenuItems: MenuItem[] = [
  { id: 'nextjs-saas', label: 'Next.js SaaS Stack' },
  { id: 'supabase-stripe', label: 'Supabase & Stripe Storefront' },
  { id: 'microservices-api', label: 'Microservices API Gateway' },
]

function handlePresetSelect(item: MenuItem) {
  loadPreset(item.id)
}
</script>

<template>
  <div class="min-h-screen bg-[#0b0f19] text-[#f9fafb] flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
    <!-- Top Sticky Header -->
    <header class="sticky top-0 z-40 border-b border-[#1f2937] bg-[#0b0f19]/90 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <!-- Brand & Preset Switcher -->
        <div class="flex items-center gap-3 sm:gap-4 shrink-0">
          <NuxtLink to="/" class="flex items-center gap-2.5 group">
            <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:border-sky-500/60 transition-colors">
              <Layers class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-sm tracking-tight text-[#f9fafb]">
                EnvDrift <span class="text-sky-400 font-normal">Studio</span>
              </span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1e293b] text-slate-300 border border-[#374151]">
                v1.0
              </span>
            </div>
          </NuxtLink>

          <!-- Preset Switcher -->
          <UiDropdownMenu :items="presetMenuItems" @select="handlePresetSelect">
            <button
              type="button"
              class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#111827] border border-[#1f2937] text-slate-300 hover:border-[#374151] hover:text-[#f9fafb] transition-colors"
            >
              <span class="truncate max-w-[140px]">{{ projectName }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-[#9ca3af]" />
            </button>
          </UiDropdownMenu>
        </div>

        <!-- Center Nav Tabs -->
        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors select-none',
              route.path === link.path
                ? 'bg-[#1e293b] text-[#f9fafb] border border-[#374151]'
                : 'text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#111827]',
            ]"
          >
            <component :is="link.icon" class="w-3.5 h-3.5" />
            <span>{{ link.label }}</span>
            <span
              v-if="link.countKey === 'leakCount' && metrics.leakCount > 0"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-rose-950/80 border border-rose-800 text-rose-300 tabular-nums animate-pulse"
            >
              {{ metrics.leakCount }}
            </span>
          </NuxtLink>
        </nav>

        <!-- Right Health Ribbon & Privacy Status -->
        <div class="flex items-center gap-3">
          <!-- Parity Health Score Ribbon -->
          <div class="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#111827] border border-[#1f2937]">
            <span class="text-[11px] text-[#9ca3af] uppercase font-mono tracking-wider hidden sm:inline">Parity:</span>
            <span
              class="text-xs font-mono font-bold tabular-nums"
              :class="
                healthScore >= 90
                  ? 'text-[#10b981]'
                  : healthScore >= 70
                  ? 'text-[#f59e0b]'
                  : 'text-[#ef4444]'
              "
            >
              {{ healthScore }}%
            </span>
          </div>

          <!-- Zero-Knowledge Shield Indicator -->
          <div
            class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono border"
            :class="
              isZeroKnowledgeMasked
                ? 'bg-sky-950/30 border-sky-800/60 text-sky-400'
                : 'bg-slate-900 border-[#1f2937] text-[#9ca3af]'
            "
            :title="isZeroKnowledgeMasked ? 'Client-side SHA-256 masking active' : 'Plaintext display active'"
          >
            <Fingerprint v-if="isZeroKnowledgeMasked" class="w-3.5 h-3.5" />
            <Eye v-else class="w-3.5 h-3.5" />
            <span class="text-[11px] hidden lg:inline">{{ isZeroKnowledgeMasked ? 'Zero-Knowledge' : 'Plaintext' }}</span>
          </div>
        </div>
      </div>

      <!-- Mobile Nav Row -->
      <div class="md:hidden flex items-center justify-around border-t border-[#1f2937] px-2 py-1.5 bg-[#0b0f19]">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          :class="[
            'inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium',
            route.path === link.path ? 'bg-[#1e293b] text-[#f9fafb]' : 'text-[#9ca3af]',
          ]"
        >
          <component :is="link.icon" class="w-3.5 h-3.5" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Main View Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-[#1f2937] bg-[#0b0f19] py-4 text-xs text-[#9ca3af]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div class="flex items-center gap-2 font-mono text-[11px]">
          <Database class="w-3.5 h-3.5 text-sky-400" />
          <span>Persistence: SQLite cold-start adapter (<code class="text-slate-300">/tmp/envdrift.db</code>)</span>
        </div>

        <div class="text-[11px]">
          Zero external secret transmission • Autonomous configuration parity & drift guard
        </div>
      </div>
    </footer>
  </div>
</template>
