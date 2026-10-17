<script setup lang="ts">
import {
  Search,
  Eye,
  EyeOff,
  Fingerprint,
  Filter,
  Plus,
  SlidersHorizontal,
} from 'lucide-vue-next'
import UiInput from '~/components/ui/UiInput.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiBadge from '~/components/ui/UiBadge.vue'

interface Props {
  searchQuery: string
  filterStatus: string
  isZeroKnowledgeMasked: boolean
  totalKeys: number
  filteredCount: number
  driftCount: number
  leakCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:filterStatus', val: string): void
  (e: 'toggleMasking'): void
  (e: 'openImport'): void
}>()

const filterOptions = [
  { id: 'ALL', label: 'All Keys' },
  { id: 'DRIFT', label: 'Drift Only' },
  { id: 'IN_SYNC', label: 'In Sync' },
  { id: 'TYPE_MISMATCH', label: 'Type Mismatches' },
  { id: 'EMPTY', label: 'Empty' },
]
</script>

<template>
  <div class="flex flex-col gap-3 py-3 border-b border-[#1f2937] bg-[#111827]/40 px-4 rounded-t-xl">
    <!-- Top toolbar: Search & Actions -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="w-full sm:w-72">
        <UiInput
          :model-value="searchQuery"
          placeholder="Filter variable keys..."
          @update:model-value="(val) => emit('update:searchQuery', val)"
        >
          <template #prefix>
            <Search class="w-3.5 h-3.5" />
          </template>
        </UiInput>
      </div>

      <!-- Action Controls -->
      <div class="flex items-center gap-2 self-end sm:self-auto flex-wrap">
        <!-- Zero Knowledge Masking Toggle -->
        <UiButton
          variant="outline"
          size="sm"
          :class="isZeroKnowledgeMasked ? 'border-sky-500/50 text-sky-400 bg-sky-950/20' : 'text-[#9ca3af]'"
          @click="emit('toggleMasking')"
        >
          <template #icon>
            <Fingerprint v-if="isZeroKnowledgeMasked" class="w-3.5 h-3.5 text-sky-400" />
            <Eye v-else class="w-3.5 h-3.5 text-[#9ca3af]" />
          </template>
          <span>{{ isZeroKnowledgeMasked ? 'Privacy Mask: ON (SHA-256)' : 'Privacy Mask: OFF (Plaintext)' }}</span>
        </UiButton>

        <!-- Import / Add Stage Button -->
        <UiButton variant="primary" size="sm" @click="emit('openImport')">
          <template #icon>
            <Plus class="w-3.5 h-3.5" />
          </template>
          <span>Import Environments</span>
        </UiButton>
      </div>
    </div>

    <!-- Filter Pills & Counts Ribbon -->
    <div class="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
      <!-- Filter buttons -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          v-for="opt in filterOptions"
          :key="opt.id"
          type="button"
          :class="[
            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors select-none',
            filterStatus === opt.id
              ? 'bg-[#1e293b] text-[#f9fafb] border border-[#374151]'
              : 'text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1e293b]/60 border border-transparent',
          ]"
          @click="emit('update:filterStatus', opt.id)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Result Counter -->
      <div class="flex items-center gap-2 text-xs font-mono text-[#9ca3af]">
        <span>Showing <strong class="text-slate-200 tabular-nums">{{ filteredCount }}</strong> of <strong class="text-slate-200 tabular-nums">{{ totalKeys }}</strong> keys</span>
        <UiBadge v-if="driftCount > 0" variant="drift" size="sm">
          {{ driftCount }} Drifted
        </UiBadge>
        <UiBadge v-if="leakCount > 0" variant="warning" size="sm" pulse>
          {{ leakCount }} Leak Alerts
        </UiBadge>
      </div>
    </div>
  </div>
</template>
