<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UploadCloud,
  FileCode,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-vue-next'
import type { EnvironmentStage } from '~/types/drift'
import type { EnvSyntaxError } from '~/types/ast'
import UiDialog from '~/components/ui/UiDialog.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiTabs, { type TabItem } from '~/components/ui/UiTabs.vue'

interface Props {
  open: boolean
  activeTab: EnvironmentStage
  rawContents: Record<EnvironmentStage, string>
  keyCounts: Record<EnvironmentStage, number>
  syntaxErrors: Record<EnvironmentStage, EnvSyntaxError[]>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'updateContent', stage: EnvironmentStage, content: string): void
  (e: 'clearStage', stage: EnvironmentStage): void
  (e: 'apply'): void
}>()

const currentStage = ref<EnvironmentStage>(props.activeTab || 'development')
const isDragging = ref(false)

const tabs = computed<TabItem[]>(() => [
  { id: 'development', label: 'Development', count: props.keyCounts.development },
  { id: 'staging', label: 'Staging', count: props.keyCounts.staging },
  { id: 'production', label: 'Production', count: props.keyCounts.production },
  { id: 'example', label: 'Example (.env.example)', count: props.keyCounts.example },
])

const activeContent = computed({
  get: () => props.rawContents[currentStage.value] || '',
  set: (val: string) => emit('updateContent', currentStage.value, val),
})

const activeErrors = computed(() => props.syntaxErrors[currentStage.value] || [])

function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return

  const file = e.dataTransfer.files[0]
  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target?.result as string
    if (typeof text === 'string') {
      emit('updateContent', currentStage.value, text)
    }
  }
  reader.readAsText(file)
}

function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target?.result as string
    if (typeof text === 'string') {
      emit('updateContent', currentStage.value, text)
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Multi-Stage Environment Ingestion"
    description="Paste raw .env content or drop files into each target stage to analyze configuration parity."
    content-class="max-w-3xl"
    @update:open="(val) => emit('update:open', val)"
  >
    <div class="space-y-4">
      <!-- Stage Tabs -->
      <UiTabs
        v-model="currentStage"
        :tabs="tabs"
      />

      <!-- Drag & Drop Zone -->
      <div
        :class="[
          'relative border-2 border-dashed rounded-lg p-4 transition-colors flex flex-col items-center justify-center text-center cursor-pointer',
          isDragging
            ? 'border-sky-500 bg-sky-950/20 text-sky-300'
            : 'border-[#1f2937] hover:border-[#374151] bg-[#0b0f19]/60 text-[#9ca3af]',
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <input
          type="file"
          class="absolute inset-0 opacity-0 cursor-pointer"
          @change="handleFileInput"
        />
        <UploadCloud class="w-6 h-6 mb-1 text-sky-400" />
        <span class="text-xs font-medium text-[#f9fafb]">
          Drop <code class="text-sky-400 font-mono">.env.{{ currentStage }}</code> file here, or click to browse
        </span>
        <span class="text-[11px] text-[#6b7280]">
          UTF-8 text, comments, quotes, and multiline values supported
        </span>
      </div>

      <!-- Raw Text Area -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs text-[#9ca3af]">
          <span class="font-mono">Raw Configuration Text:</span>
          <span class="tabular-nums font-mono text-slate-300">
            {{ props.keyCounts[currentStage] }} keys tokenized
          </span>
        </div>

        <textarea
          v-model="activeContent"
          rows="10"
          placeholder="PASTE .env CONTENT HERE...
# Example
PORT=3000
DATABASE_URL=postgresql://...
"
          class="w-full rounded-md border border-[#1f2937] bg-[#0b0f19] p-3 text-xs font-mono text-[#f9fafb] placeholder:text-[#6b7280] focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/50 font-normal leading-relaxed resize-y"
        />
      </div>

      <!-- Syntax Errors Feedback -->
      <div v-if="activeErrors.length > 0" class="p-3 rounded-lg border border-[#9f1239] bg-[#4c0519]/40 space-y-2">
        <div class="flex items-center gap-2 text-xs font-semibold text-[#ef4444]">
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>{{ activeErrors.length }} Syntax Warning(s) Detected:</span>
        </div>
        <ul class="space-y-1 text-[11px] font-mono text-rose-200">
          <li v-for="(err, idx) in activeErrors" :key="idx" class="flex items-start gap-2">
            <span class="text-[#ef4444]">Line {{ err.lineNumber }}:</span>
            <span>{{ err.message }}</span>
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UiButton
          variant="ghost"
          size="sm"
          :disabled="!activeContent"
          class="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
          @click="emit('clearStage', currentStage)"
        >
          <template #icon>
            <Trash2 class="w-3.5 h-3.5" />
          </template>
          <span>Clear {{ currentStage }}</span>
        </UiButton>

        <div class="flex items-center gap-2">
          <UiButton variant="outline" size="sm" @click="emit('update:open', false)">
            Done
          </UiButton>
          <UiButton variant="primary" size="sm" @click="emit('apply')">
            <span>Apply & Recalculate Drift</span>
          </UiButton>
        </div>
      </div>
    </template>
  </UiDialog>
</template>
