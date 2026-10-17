<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Split,
  HelpCircle,
  MessageSquare,
} from 'lucide-vue-next'
import type { MatrixRow, EnvironmentStage } from '~/types/drift'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'
import DriftMatrixCell from './DriftMatrixCell.vue'

interface Props {
  row: MatrixRow
  isGlobalMasked: boolean
  activeStages: EnvironmentStage[]
}

const props = defineProps<Props>()

const badgeVariant = computed(() => {
  switch (props.row.status) {
    case 'IN_SYNC':
      return 'healthy'
    case 'MISSING':
      return 'drift'
    case 'TYPE_MISMATCH':
    case 'EMPTY':
      return 'warning'
    case 'ORPHANED':
    default:
      return 'neutral'
  }
})

const statusLabel = computed(() => {
  switch (props.row.status) {
    case 'IN_SYNC':
      return 'In Sync'
    case 'MISSING':
      return 'Missing'
    case 'TYPE_MISMATCH':
      return 'Type Mismatch'
    case 'EMPTY':
      return 'Empty'
    case 'ORPHANED':
      return 'Orphaned'
    default:
      return props.row.status
  }
})
</script>

<template>
  <tr class="group border-b border-[#1f2937] hover:bg-[#111827]/70 transition-colors">
    <!-- Key Column -->
    <td class="py-2.5 px-4 align-top w-[260px] max-w-[280px]">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs font-semibold text-[#f9fafb] truncate tracking-tight" :title="row.key">
            {{ row.key }}
          </span>

          <!-- Comment Tooltip if available -->
          <UiTooltip v-if="row.comment" :text="row.comment">
            <span class="text-[#9ca3af] hover:text-[#f9fafb] cursor-help">
              <MessageSquare class="w-3 h-3" />
            </span>
          </UiTooltip>
        </div>

        <!-- Status Badge with Drift Reason Tooltip -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <UiTooltip
            v-if="row.driftReasons && row.driftReasons.length > 0"
            :text="row.driftReasons.join('; ')"
          >
            <UiBadge :variant="badgeVariant" size="sm" class="cursor-help">
              <template #icon>
                <CheckCircle2 v-if="row.status === 'IN_SYNC'" class="w-3 h-3 text-[#10b981]" />
                <AlertOctagon v-else-if="row.status === 'MISSING'" class="w-3 h-3 text-[#ef4444]" />
                <Split v-else-if="row.status === 'TYPE_MISMATCH'" class="w-3 h-3 text-[#f59e0b]" />
                <AlertTriangle v-else-if="row.status === 'EMPTY'" class="w-3 h-3 text-[#f59e0b]" />
                <HelpCircle v-else class="w-3 h-3 text-[#9ca3af]" />
              </template>
              {{ statusLabel }}
            </UiBadge>
          </UiTooltip>

          <UiBadge v-else :variant="badgeVariant" size="sm">
            <template #icon>
              <CheckCircle2 v-if="row.status === 'IN_SYNC'" class="w-3 h-3 text-[#10b981]" />
              <AlertOctagon v-else-if="row.status === 'MISSING'" class="w-3 h-3 text-[#ef4444]" />
              <Split v-else-if="row.status === 'TYPE_MISMATCH'" class="w-3 h-3 text-[#f59e0b]" />
              <AlertTriangle v-else-if="row.status === 'EMPTY'" class="w-3 h-3 text-[#f59e0b]" />
              <HelpCircle v-else class="w-3 h-3 text-[#9ca3af]" />
            </template>
            {{ statusLabel }}
          </UiBadge>
        </div>
      </div>
    </td>

    <!-- Stage Columns: Development, Staging, Production, Example -->
    <td
      v-for="stage in activeStages"
      :key="stage"
      class="py-1 px-1 align-middle border-l border-[#1f2937] min-w-[190px]"
    >
      <DriftMatrixCell
        :cell="row.values[stage]"
        :is-global-masked="isGlobalMasked"
        :var-key="row.key"
        :stage="stage"
      />
    </td>
  </tr>
</template>
