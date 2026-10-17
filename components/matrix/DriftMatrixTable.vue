<script setup lang="ts">
import { computed } from 'vue'
import type { MatrixRow, EnvironmentStage, DriftMetrics } from '~/types/drift'
import DriftMatrixHeader from './DriftMatrixHeader.vue'
import DriftMatrixRow from './DriftMatrixRow.vue'
import DriftMatrixEmptyState from './DriftMatrixEmptyState.vue'
import UiSkeleton from '~/components/ui/UiSkeleton.vue'

interface StageCounts {
  development: number
  staging: number
  production: number
  example: number
}

interface Props {
  matrix: MatrixRow[]
  activeStages: EnvironmentStage[]
  stageCounts: StageCounts
  isZeroKnowledgeMasked: boolean
  searchQuery: string
  filterStatus: string
  healthScore: number
  metrics: DriftMetrics
  isAnalyzing: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:filterStatus', val: string): void
  (e: 'toggleMasking'): void
  (e: 'openImport'): void
  (e: 'loadPreset', slug: string): void
}>()

const filteredRows = computed(() => {
  return props.matrix.filter((row) => {
    // 1. Search Query filter
    if (props.searchQuery) {
      const q = props.searchQuery.toLowerCase().trim()
      const matchKey = row.key.toLowerCase().includes(q)
      const matchComment = row.comment?.toLowerCase().includes(q)
      if (!matchKey && !matchComment) return false
    }

    // 2. Status filter
    if (props.filterStatus === 'ALL') return true
    if (props.filterStatus === 'DRIFT') {
      return row.status !== 'IN_SYNC'
    }
    if (props.filterStatus === 'IN_SYNC') {
      return row.status === 'IN_SYNC'
    }
    if (props.filterStatus === 'TYPE_MISMATCH') {
      return row.status === 'TYPE_MISMATCH'
    }
    if (props.filterStatus === 'EMPTY') {
      return row.status === 'EMPTY'
    }

    return true
  })
})

const stageLabels: Record<EnvironmentStage, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
  example: 'Example (.env.example)',
}
</script>

<template>
  <div class="rounded-xl border border-[#1f2937] bg-[#111827] shadow-xl overflow-hidden flex flex-col">
    <!-- Header Controls -->
    <DriftMatrixHeader
      :search-query="searchQuery"
      :filter-status="filterStatus"
      :is-zero-knowledge-masked="isZeroKnowledgeMasked"
      :total-keys="matrix.length"
      :filtered-count="filteredRows.length"
      :drift-count="metrics.missingCount + metrics.typeMismatchCount + metrics.emptyCount"
      :leak-count="metrics.leakCount"
      @update:search-query="(val) => emit('update:searchQuery', val)"
      @update:filter-status="(val) => emit('update:filterStatus', val)"
      @toggle-masking="emit('toggleMasking')"
      @open-import="emit('openImport')"
    />

    <!-- Empty State if matrix is completely empty -->
    <template v-if="matrix.length === 0 && !isAnalyzing">
      <DriftMatrixEmptyState
        @open-import="emit('openImport')"
        @load-preset="(slug) => emit('loadPreset', slug)"
      />
    </template>

    <!-- Table content -->
    <template v-else>
      <div class="overflow-x-auto w-full">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-[#1f2937] bg-[#0d131f]/80 text-[#9ca3af] text-[11px] font-mono uppercase tracking-wider select-none">
              <th scope="col" class="py-3 px-4 font-semibold w-[260px] max-w-[280px]">
                Variable Key & Status
              </th>
              <th
                v-for="stage in activeStages"
                :key="stage"
                scope="col"
                class="py-3 px-3 font-semibold border-l border-[#1f2937] min-w-[190px]"
              >
                <div class="flex items-center justify-between">
                  <span>{{ stageLabels[stage] }}</span>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e293b] text-slate-300 tabular-nums">
                    {{ stageCounts[stage] }} keys
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-[#1f2937]">
            <!-- Loading Skeletons -->
            <template v-if="isAnalyzing">
              <tr v-for="i in 6" :key="`skeleton-${i}`" class="border-b border-[#1f2937]">
                <td class="py-3 px-4">
                  <UiSkeleton class="h-4 w-32 mb-1.5" />
                  <UiSkeleton class="h-3 w-16" />
                </td>
                <td v-for="s in activeStages" :key="s" class="py-3 px-3 border-l border-[#1f2937]">
                  <UiSkeleton class="h-4 w-28" />
                </td>
              </tr>
            </template>

            <!-- Rendered Rows -->
            <template v-else-if="filteredRows.length > 0">
              <DriftMatrixRow
                v-for="row in filteredRows"
                :key="row.key"
                :row="row"
                :is-global-masked="isZeroKnowledgeMasked"
                :active-stages="activeStages"
              />
            </template>

            <!-- No search match row -->
            <tr v-else>
              <td :colspan="activeStages.length + 1" class="py-8 text-center text-xs text-[#9ca3af]">
                No environment variables match your search and filter criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
