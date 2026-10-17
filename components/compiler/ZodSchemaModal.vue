<script setup lang="ts">
import { ref } from 'vue'
import {
  Copy,
  Check,
  Download,
  FileCode,
  FileCheck,
  SlidersHorizontal,
} from 'lucide-vue-next'
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiTabs, { type TabItem } from '~/components/ui/UiTabs.vue'

interface Props {
  zodCode: string
  exampleCode: string
  serverKeysCount: number
  clientKeysCount: number
  scrubbedCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'recompile', framework: 'nextjs' | 'nuxtjs' | 'node', clientPrefix: string): void
}>()

const activeTab = ref('zod')
const selectedFramework = ref<'nextjs' | 'nuxtjs' | 'node'>('nextjs')
const customClientPrefix = ref('NEXT_PUBLIC_')
const copied = ref(false)

const tabs: TabItem[] = [
  { id: 'zod', label: 'env.ts (Zod Schema)', icon: FileCode },
  { id: 'example', label: '.env.example (Sanitized)', icon: FileCheck },
]

function handleFrameworkChange(fw: 'nextjs' | 'nuxtjs' | 'node') {
  selectedFramework.value = fw
  if (fw === 'nuxtjs') {
    customClientPrefix.value = 'NUXT_PUBLIC_'
  } else if (fw === 'nextjs') {
    customClientPrefix.value = 'NEXT_PUBLIC_'
  } else {
    customClientPrefix.value = 'PUBLIC_'
  }
  emit('recompile', selectedFramework.value, customClientPrefix.value)
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

function downloadFile(content: string, fileName: string) {
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
    <!-- Configuration Bar -->
    <UiCard class="bg-[#111827]">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <!-- Framework Selection -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-[#9ca3af] font-medium">Framework:</span>
          <div class="inline-flex rounded-lg bg-[#0b0f19] p-1 border border-[#1f2937]">
            <button
              type="button"
              :class="[
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                selectedFramework === 'nextjs' ? 'bg-[#1e293b] text-[#f9fafb]' : 'text-[#9ca3af] hover:text-[#f9fafb]',
              ]"
              @click="handleFrameworkChange('nextjs')"
            >
              Next.js
            </button>
            <button
              type="button"
              :class="[
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                selectedFramework === 'nuxtjs' ? 'bg-[#1e293b] text-[#f9fafb]' : 'text-[#9ca3af] hover:text-[#f9fafb]',
              ]"
              @click="handleFrameworkChange('nuxtjs')"
            >
              Nuxt 3
            </button>
            <button
              type="button"
              :class="[
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                selectedFramework === 'node' ? 'bg-[#1e293b] text-[#f9fafb]' : 'text-[#9ca3af] hover:text-[#f9fafb]',
              ]"
              @click="handleFrameworkChange('node')"
            >
              Node.js
            </button>
          </div>
        </div>

        <!-- Client Prefix Input -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-[#9ca3af] font-medium">Client Prefix:</span>
          <div class="w-36">
            <UiInput
              v-model="customClientPrefix"
              placeholder="PREFIX_"
              @change="emit('recompile', selectedFramework, customClientPrefix)"
            />
          </div>
        </div>

        <!-- Stats -->
        <div class="flex items-center gap-3 text-xs font-mono text-[#9ca3af] self-end sm:self-auto">
          <span>Server: <strong class="text-slate-200 tabular-nums">{{ serverKeysCount }}</strong></span>
          <span>Client: <strong class="text-slate-200 tabular-nums">{{ clientKeysCount }}</strong></span>
          <span>Scrubbed: <strong class="text-sky-400 tabular-nums">{{ scrubbedCount }}</strong></span>
        </div>
      </div>
    </UiCard>

    <!-- Code Viewer Card -->
    <UiCard class="p-0 overflow-hidden">
      <template #header>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <UiTabs v-model="activeTab" :tabs="tabs" class="w-auto" />

          <div class="flex items-center gap-2">
            <UiButton
              variant="outline"
              size="sm"
              @click="copyToClipboard(activeTab === 'zod' ? zodCode : exampleCode)"
            >
              <template #icon>
                <Check v-if="copied" class="w-3.5 h-3.5 text-[#10b981]" />
                <Copy v-else class="w-3.5 h-3.5" />
              </template>
              <span>{{ copied ? 'Copied to Clipboard' : 'Copy Code' }}</span>
            </UiButton>

            <UiButton
              variant="primary"
              size="sm"
              @click="downloadFile(activeTab === 'zod' ? zodCode : exampleCode, activeTab === 'zod' ? 'env.ts' : '.env.example')"
            >
              <template #icon>
                <Download class="w-3.5 h-3.5" />
              </template>
              <span>Download {{ activeTab === 'zod' ? 'env.ts' : '.env.example' }}</span>
            </UiButton>
          </div>
        </div>
      </template>

      <!-- Code Block -->
      <div class="bg-[#0b0f19] p-4 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed select-all">
        <pre v-if="activeTab === 'zod'"><code>{{ zodCode }}</code></pre>
        <pre v-else><code>{{ exampleCode }}</code></pre>
      </div>
    </UiCard>
  </div>
</template>
