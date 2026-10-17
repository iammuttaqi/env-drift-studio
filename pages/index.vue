<script setup lang="ts">
import { ref } from 'vue'
import {
  Layers,
  CheckCircle2,
  AlertOctagon,
  Split,
  ShieldAlert,
  HelpCircle,
  UploadCloud,
  FileCheck,
} from 'lucide-vue-next'
import { useEnvDrift } from '~/composables/useEnvDrift'
import DriftMatrixTable from '~/components/matrix/DriftMatrixTable.vue'
import EnvInputDrawer from '~/components/matrix/EnvInputDrawer.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiBadge from '~/components/ui/UiBadge.vue'

const {
  stages,
  activeStages,
  stageCounts,
  rawContents,
  syntaxErrors,
  isZeroKnowledgeMasked,
  searchQuery,
  filterStatus,
  activeStageTab,
  matrix,
  healthScore,
  metrics,
  isAnalyzing,
  updateStageContent,
  clearStage,
  computeDrift,
  toggleMasking,
  loadPreset,
} = useEnvDrift()

const isInputDrawerOpen = ref(false)

function handleOpenImport() {
  isInputDrawerOpen.value = true
}

function handleApplyInput() {
  isInputDrawerOpen.value = false
  computeDrift()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Executive Parity Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <!-- Parity Score -->
      <UiCard class="p-3 bg-[#111827]">
        <span class="text-[11px] font-mono uppercase text-[#9ca3af] block">Parity Score</span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span
            class="text-xl sm:text-2xl font-bold font-mono tabular-nums"
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
          <span class="text-[10px] text-[#9ca3af] font-mono">health</span>
        </div>
      </UiCard>

      <!-- Total Keys -->
      <UiCard class="p-3 bg-[#111827]">
        <span class="text-[11px] font-mono uppercase text-[#9ca3af] block">Total Keys</span>
        <div class="mt-1 text-xl sm:text-2xl font-bold font-mono text-[#f9fafb] tabular-nums">
          {{ metrics.totalUniqueKeys }}
        </div>
      </UiCard>

      <!-- In-Sync -->
      <UiCard class="p-3 bg-[#111827]">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono uppercase text-[#9ca3af]">In-Sync</span>
          <CheckCircle2 class="w-3.5 h-3.5 text-[#10b981]" />
        </div>
        <div class="mt-1 text-xl sm:text-2xl font-bold font-mono text-[#10b981] tabular-nums">
          {{ metrics.inSyncCount }}
        </div>
      </UiCard>

      <!-- Missing -->
      <UiCard class="p-3 bg-[#111827]">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono uppercase text-[#9ca3af]">Missing</span>
          <AlertOctagon class="w-3.5 h-3.5 text-[#ef4444]" />
        </div>
        <div class="mt-1 text-xl sm:text-2xl font-bold font-mono text-[#ef4444] tabular-nums">
          {{ metrics.missingCount }}
        </div>
      </UiCard>

      <!-- Type Mismatches -->
      <UiCard class="p-3 bg-[#111827]">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono uppercase text-[#9ca3af]">Type Mismatch</span>
          <Split class="w-3.5 h-3.5 text-[#f59e0b]" />
        </div>
        <div class="mt-1 text-xl sm:text-2xl font-bold font-mono text-[#f59e0b] tabular-nums">
          {{ metrics.typeMismatchCount }}
        </div>
      </UiCard>

      <!-- Secret Leaks -->
      <UiCard class="p-3 bg-[#111827]">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono uppercase text-[#9ca3af]">Secret Leaks</span>
          <ShieldAlert class="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div
          class="mt-1 text-xl sm:text-2xl font-bold font-mono tabular-nums"
          :class="metrics.leakCount > 0 ? 'text-[#ef4444] animate-pulse' : 'text-slate-400'"
        >
          {{ metrics.leakCount }}
        </div>
      </UiCard>
    </div>

    <!-- Main Drift Matrix Comparison Table -->
    <DriftMatrixTable
      :matrix="matrix"
      :active-stages="activeStages"
      :stage-counts="stageCounts"
      :is-zero-knowledge-masked="isZeroKnowledgeMasked"
      :search-query="searchQuery"
      :filter-status="filterStatus"
      :health-score="healthScore"
      :metrics="metrics"
      :is-analyzing="isAnalyzing"
      @update:search-query="(val) => (searchQuery = val)"
      @update:filter-status="(val) => (filterStatus = val)"
      @toggle-masking="toggleMasking"
      @open-import="handleOpenImport"
      @load-preset="loadPreset"
    />

    <!-- Multi-Stage Ingestion Drawer / Modal -->
    <EnvInputDrawer
      :open="isInputDrawerOpen"
      :active-tab="activeStageTab"
      :raw-contents="rawContents"
      :key-counts="stageCounts"
      :syntax-errors="syntaxErrors"
      @update:open="(val) => (isInputDrawerOpen = val)"
      @update-content="updateStageContent"
      @clear-stage="clearStage"
      @apply="handleApplyInput"
    />
  </div>
</template>
