<script setup lang="ts">
import { ref } from 'vue'
import {
  Copy,
  Check,
  Download,
  Terminal,
  FileText,
  ShieldCheck,
} from 'lucide-vue-next'
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiTabs, { type TabItem } from '~/components/ui/UiTabs.vue'

interface Props {
  markdownReport: string
  githubActionYaml: string
  healthScore: number
  strictFailOnDrift: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:strictFailOnDrift', val: boolean): void
  (e: 'refresh'): void
}>()

const activeTab = ref('markdown')
const copied = ref(false)

const tabs: TabItem[] = [
  { id: 'markdown', label: 'PR Summary (Markdown)', icon: FileText },
  { id: 'github', label: 'GitHub Actions (.yml)', icon: Terminal },
]

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy report:', err)
  }
}

function downloadReport(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Controls Header -->
    <UiCard class="bg-[#111827]">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-[#1e293b] text-sky-400">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-[#f9fafb]">
              CI/CD Parity Enforcement Gatekeeper
            </h3>
            <p class="text-xs text-[#9ca3af]">
              Automate drift checks on incoming Pull Requests and prevent uncommitted secret leaks.
            </p>
          </div>
        </div>

        <!-- Strict Gate Toggle -->
        <label class="flex items-center gap-2.5 cursor-pointer text-xs select-none">
          <input
            type="checkbox"
            :checked="strictFailOnDrift"
            class="rounded border-[#374151] bg-[#0b0f19] text-sky-500 focus:ring-sky-500/50 w-4 h-4"
            @change="(e) => emit('update:strictFailOnDrift', (e.target as HTMLInputElement).checked)"
          />
          <span class="text-[#f9fafb] font-medium">Fail pipeline on configuration drift</span>
        </label>
      </div>
    </UiCard>

    <!-- Preview Container -->
    <UiCard class="p-0 overflow-hidden">
      <template #header>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <UiTabs v-model="activeTab" :tabs="tabs" class="w-auto" />

          <div class="flex items-center gap-2">
            <UiButton
              variant="outline"
              size="sm"
              @click="copyToClipboard(activeTab === 'markdown' ? markdownReport : githubActionYaml)"
            >
              <template #icon>
                <Check v-if="copied" class="w-3.5 h-3.5 text-[#10b981]" />
                <Copy v-else class="w-3.5 h-3.5" />
              </template>
              <span>{{ copied ? 'Copied' : 'Copy Content' }}</span>
            </UiButton>

            <UiButton
              variant="primary"
              size="sm"
              @click="
                downloadReport(
                  activeTab === 'markdown' ? markdownReport : githubActionYaml,
                  activeTab === 'markdown' ? 'env-drift-report.md' : 'env-drift-check.yml'
                )
              "
            >
              <template #icon>
                <Download class="w-3.5 h-3.5" />
              </template>
              <span>Download {{ activeTab === 'markdown' ? '.md' : '.yml' }}</span>
            </UiButton>
          </div>
        </div>
      </template>

      <!-- Content Viewer -->
      <div class="bg-[#0b0f19] p-4 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed select-all">
        <pre v-if="activeTab === 'markdown'"><code>{{ markdownReport }}</code></pre>
        <pre v-else><code>{{ githubActionYaml }}</code></pre>
      </div>
    </UiCard>
  </div>
</template>
