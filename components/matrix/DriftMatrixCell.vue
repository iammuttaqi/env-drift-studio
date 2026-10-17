<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Eye,
  EyeOff,
  Fingerprint,
  AlertTriangle,
  ShieldAlert,
  Info,
  Check,
  Hash,
} from 'lucide-vue-next'
import type { CellValue } from '~/types/drift'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiPopover from '~/components/ui/UiPopover.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'

interface Props {
  cell?: CellValue
  isGlobalMasked: boolean
  varKey: string
  stage: string
}

const props = defineProps<Props>()

const localRevealed = ref(false)

const isRevealed = computed(() => {
  if (!props.isGlobalMasked) return true
  return localRevealed.value
})

const truncatedHash = computed(() => {
  if (!props.cell?.hash) return 'sha256:none'
  return `sha256:${props.cell.hash.slice(0, 6)}...${props.cell.hash.slice(-4)}`
})

const maskedBullets = computed(() => {
  if (!props.cell?.value) return '—'
  return '••••••••'
})

function toggleReveal(e: MouseEvent) {
  e.stopPropagation()
  localRevealed.value = !localRevealed.value
}
</script>

<template>
  <div class="group relative flex items-center justify-between min-h-[38px] px-3 py-1.5 font-mono text-xs">
    <!-- Case 1: Variable does not exist in this stage -->
    <template v-if="!cell || !cell.exists">
      <div class="flex items-center gap-1.5 text-[#ef4444] opacity-80">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        <span class="text-[11px] font-sans italic">Not defined</span>
      </div>
    </template>

    <!-- Case 2: Variable exists but is empty -->
    <template v-else-if="cell.inferredType === 'empty'">
      <div class="flex items-center gap-1.5 text-[#f59e0b] opacity-80">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span class="text-[11px] font-sans italic">Empty ("")</span>
      </div>
    </template>

    <!-- Case 3: Variable exists with value -->
    <template v-else>
      <div class="flex items-center gap-2 max-w-[calc(100%-28px)] overflow-hidden">
        <!-- Value Display: Plaintext or Masked -->
        <span
          v-if="isRevealed"
          class="truncate text-slate-200 select-all font-mono"
          :title="cell.value"
        >
          {{ cell.value }}
        </span>

        <span
          v-else
          class="truncate text-[#9ca3af] font-mono text-[11px] flex items-center gap-1.5"
          :title="`SHA-256: ${cell.hash}`"
        >
          <Fingerprint class="w-3 h-3 text-sky-400 shrink-0" />
          <span class="text-sky-300/90 font-mono">{{ truncatedHash }}</span>
        </span>

        <!-- Secret leak indicator icon -->
        <UiTooltip v-if="cell.hasSecretLeak" text="High entropy or live secret signature detected!">
          <span class="shrink-0 p-0.5 rounded bg-amber-500/20 text-amber-400">
            <ShieldAlert class="w-3 h-3" />
          </span>
        </UiTooltip>
      </div>

      <!-- Action buttons & Popover Details -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- Toggle Reveal Eye Button -->
        <button
          type="button"
          class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1e293b] rounded transition-all"
          :title="isRevealed ? 'Hide raw value' : 'Inspect unmasked value'"
          @click="toggleReveal"
        >
          <EyeOff v-if="isRevealed" class="w-3.5 h-3.5" />
          <Eye v-else class="w-3.5 h-3.5" />
        </button>

        <!-- Cell Detail Popover -->
        <UiPopover align="end">
          <template #trigger>
            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1e293b] rounded transition-all"
              title="Inspect cell details"
            >
              <Info class="w-3.5 h-3.5" />
            </button>
          </template>

          <div class="space-y-3 font-sans">
            <div class="flex items-center justify-between border-b border-[#1f2937] pb-2">
              <span class="font-mono text-xs font-semibold text-[#f9fafb] truncate max-w-[180px]">
                {{ varKey }}
              </span>
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1e293b] text-slate-300">
                {{ stage }}
              </span>
            </div>

            <!-- Inferred Primitive -->
            <div class="space-y-1 text-xs">
              <div class="flex justify-between text-[#9ca3af]">
                <span>Inferred Type:</span>
                <span class="font-mono text-sky-400 capitalize">{{ cell.inferredType }}</span>
              </div>
              <div class="flex justify-between text-[#9ca3af]">
                <span>Shannon Entropy:</span>
                <span
                  class="font-mono tabular-nums"
                  :class="cell.entropyScore > 4.2 ? 'text-amber-400 font-semibold' : 'text-slate-300'"
                >
                  {{ cell.entropyScore }} bits/char
                </span>
              </div>
            </div>

            <!-- SHA-256 Checksum -->
            <div class="space-y-1 text-xs">
              <span class="text-[#9ca3af] block">Cryptographic Fingerprint:</span>
              <div class="p-1.5 rounded bg-[#0b0f19] border border-[#1f2937] font-mono text-[10px] break-all text-slate-400 select-all">
                {{ cell.hash }}
              </div>
            </div>

            <!-- Full Raw Plaintext Preview -->
            <div class="space-y-1 text-xs pt-1 border-t border-[#1f2937]">
              <span class="text-[#9ca3af] block">Exact Stored Value:</span>
              <div class="p-1.5 rounded bg-[#0b0f19] border border-[#1f2937] font-mono text-[11px] break-all text-slate-200 select-all max-h-24 overflow-y-auto">
                {{ cell.value }}
              </div>
            </div>
          </div>
        </UiPopover>
      </div>
    </template>
  </div>
</template>
