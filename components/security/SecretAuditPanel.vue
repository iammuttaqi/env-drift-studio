<script setup lang="ts">
import { computed } from 'vue'
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  AlertOctagon,
  AlertTriangle,
  Lock,
  Wand2,
  Copy,
} from 'lucide-vue-next'
import type { SecretLeakAlert } from '~/types/security'
import UiCard from '~/components/ui/UiCard.vue'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'

interface Props {
  alerts: SecretLeakAlert[]
  isAnalyzing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAnalyzing: false,
})

const emit = defineEmits<{
  (e: 'sanitizeExampleSecret', key: string): void
}>()

const criticalLeaks = computed(() => props.alerts.filter((a) => a.severity === 'CRITICAL'))
const warningLeaks = computed(() => props.alerts.filter((a) => a.severity === 'WARNING'))
const publicExposures = computed(() => props.alerts.filter((a) => a.isPublicExposure))
</script>

<template>
  <div class="space-y-6">
    <!-- Critical Public Exposure Banner -->
    <div
      v-if="publicExposures.length > 0"
      class="p-4 sm:p-5 rounded-xl border border-[#9f1239] bg-[#4c0519]/70 text-[#f9fafb] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
    >
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-lg bg-rose-500/20 text-[#ef4444] shrink-0 mt-0.5">
          <AlertOctagon class="w-5 h-5 animate-pulse" />
        </div>
        <div class="space-y-1">
          <h4 class="text-sm font-semibold text-rose-200">
            Critical Security Alert: Live Credential in Public Template
          </h4>
          <p class="text-xs text-rose-300/80 max-w-xl leading-relaxed">
            Found {{ publicExposures.length }} production-grade credential(s) in <code class="font-mono text-rose-200">.env.example</code>. If committed to version control, these secrets can be indexed by public search bots.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <UiButton
          variant="danger"
          size="sm"
          @click="emit('sanitizeExampleSecret', publicExposures[0].key)"
        >
          <template #icon>
            <Wand2 class="w-3.5 h-3.5" />
          </template>
          <span>Sanitize to Mock Placeholders</span>
        </UiButton>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UiCard class="bg-[#111827]">
        <div class="flex items-center justify-between">
          <span class="text-xs text-[#9ca3af]">Total Secret Alerts</span>
          <KeyRound class="w-4 h-4 text-sky-400" />
        </div>
        <div class="mt-2 text-2xl font-bold font-mono text-[#f9fafb] tabular-nums">
          {{ alerts.length }}
        </div>
      </UiCard>

      <UiCard class="bg-[#111827]">
        <div class="flex items-center justify-between">
          <span class="text-xs text-[#9ca3af]">Critical Exposures</span>
          <AlertOctagon class="w-4 h-4 text-[#ef4444]" />
        </div>
        <div class="mt-2 text-2xl font-bold font-mono text-[#ef4444] tabular-nums">
          {{ criticalLeaks.length }}
        </div>
      </UiCard>

      <UiCard class="bg-[#111827]">
        <div class="flex items-center justify-between">
          <span class="text-xs text-[#9ca3af]">High-Entropy Warnings</span>
          <AlertTriangle class="w-4 h-4 text-[#f59e0b]" />
        </div>
        <div class="mt-2 text-2xl font-bold font-mono text-[#f59e0b] tabular-nums">
          {{ warningLeaks.length }}
        </div>
      </UiCard>
    </div>

    <!-- Secret Alerts Table -->
    <UiCard class="p-0 overflow-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-[#f9fafb]">
              Audited Secret Signatures & Entropy Inspection
            </h3>
            <p class="text-xs text-[#9ca3af] mt-0.5">
              Evaluated against AWS, Stripe, GitHub, Slack, Private Keys, JWT signatures, and Shannon entropy (> 4.2 bits/char).
            </p>
          </div>
        </div>
      </template>

      <div v-if="alerts.length === 0" class="py-12 px-6 text-center text-[#9ca3af] space-y-2">
        <ShieldCheck class="w-8 h-8 mx-auto text-[#10b981]" />
        <h4 class="text-sm font-semibold text-[#f9fafb]">No Secret Leaks Detected</h4>
        <p class="text-xs max-w-md mx-auto">
          All active environment variables comply with security heuristics and template hygiene.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-[#1f2937] bg-[#0d131f]/70 text-[#9ca3af] text-[11px] font-mono uppercase">
              <th scope="col" class="py-2.5 px-4 font-semibold">Key Identifier</th>
              <th scope="col" class="py-2.5 px-3 font-semibold">Stage</th>
              <th scope="col" class="py-2.5 px-3 font-semibold">Matched Signature</th>
              <th scope="col" class="py-2.5 px-3 font-semibold">Entropy</th>
              <th scope="col" class="py-2.5 px-3 font-semibold">Masked Preview</th>
              <th scope="col" class="py-2.5 px-4 font-semibold">Remediation Guidance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#1f2937]">
            <tr
              v-for="(alert, idx) in alerts"
              :key="`${alert.stage}-${alert.key}-${idx}`"
              class="hover:bg-[#1e293b]/30 transition-colors"
            >
              <!-- Key -->
              <td class="py-3 px-4 font-mono font-semibold text-[#f9fafb]">
                {{ alert.key }}
              </td>

              <!-- Stage -->
              <td class="py-3 px-3">
                <span
                  class="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border"
                  :class="
                    alert.isPublicExposure
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  "
                >
                  {{ alert.stage }}
                </span>
              </td>

              <!-- Matched Signature -->
              <td class="py-3 px-3">
                <UiBadge :variant="alert.severity === 'CRITICAL' ? 'drift' : 'warning'" size="sm">
                  {{ alert.matchedRule }}
                </UiBadge>
              </td>

              <!-- Entropy Score -->
              <td class="py-3 px-3 font-mono tabular-nums text-slate-300">
                <span :class="alert.entropy > 4.2 ? 'text-amber-400 font-semibold' : ''">
                  {{ alert.entropy }} b/c
                </span>
              </td>

              <!-- Masked Value -->
              <td class="py-3 px-3 font-mono text-slate-400 text-[11px] select-all">
                {{ alert.valueMasked }}
              </td>

              <!-- Guidance -->
              <td class="py-3 px-4 text-xs text-[#9ca3af] max-w-xs">
                {{ alert.remediation }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>
