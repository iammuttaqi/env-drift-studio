<script setup lang="ts">
import {
  FileDiff,
  Layers,
  Database,
  Server,
  ArrowRight,
  UploadCloud,
} from 'lucide-vue-next'
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'

const emit = defineEmits<{
  (e: 'loadPreset', presetSlug: string): void
  (e: 'openImport'): void
}>()

const samplePresets = [
  {
    slug: 'nextjs-saas',
    title: 'Next.js SaaS Stack',
    desc: 'B2B subscription SaaS with Stripe payments, AWS S3 storage, and Postgres.',
    driftHighlights: '2 missing keys, 1 live secret in example, 1 type mismatch',
    icon: Layers,
  },
  {
    slug: 'supabase-stripe',
    title: 'Supabase & Stripe Storefront',
    desc: 'E-commerce stack with Supabase backend, Stripe checkout, and Resend mail.',
    driftHighlights: 'Multi-environment JWT tokens, Stripe restricted keys',
    icon: Database,
  },
  {
    slug: 'microservices-api',
    title: 'Microservices API Gateway',
    desc: 'High-throughput Node/Go cluster with Redis cache and Kafka broker.',
    driftHighlights: 'Cluster networking, rate-limiting variables, telemetry',
    icon: Server,
  },
]
</script>

<template>
  <div class="py-12 px-6 flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-8">
    <!-- Icon & Headline -->
    <div class="space-y-3">
      <div class="w-12 h-12 rounded-xl bg-[#1e293b] border border-[#374151] flex items-center justify-center mx-auto text-sky-400">
        <FileDiff class="w-6 h-6" />
      </div>
      <h3 class="text-xl font-semibold text-[#f9fafb]">
        No Environment Configurations Loaded
      </h3>
      <p class="text-xs sm:text-sm text-[#9ca3af] max-w-lg mx-auto">
        Import your local <code class="text-sky-400 font-mono">.env</code> files across Development, Staging, Production, and Example to detect configuration drift, secret leaks, and type mismatches.
      </p>
    </div>

    <!-- Primary Action: Ingestion Drawer Button -->
    <div>
      <UiButton variant="primary" size="md" @click="emit('openImport')">
        <template #icon>
          <UploadCloud class="w-4 h-4" />
        </template>
        <span>Open Multi-Stage Ingestion Drawer</span>
      </UiButton>
    </div>

    <!-- Divider -->
    <div class="w-full flex items-center gap-4 text-xs text-[#6b7280]">
      <div class="h-px flex-1 bg-[#1f2937]" />
      <span>or test with an intentional drift preset</span>
      <div class="h-px flex-1 bg-[#1f2937]" />
    </div>

    <!-- 1-Click Sample Presets Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
      <div
        v-for="preset in samplePresets"
        :key="preset.slug"
        class="group p-4 rounded-xl border border-[#1f2937] bg-[#111827] hover:border-sky-500/50 hover:bg-[#161f30] transition-all cursor-pointer flex flex-col justify-between"
        @click="emit('loadPreset', preset.slug)"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <component :is="preset.icon" class="w-4 h-4 text-sky-400" />
            <ArrowRight class="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 class="text-xs font-semibold text-[#f9fafb]">
            {{ preset.title }}
          </h4>
          <p class="text-[11px] text-[#9ca3af] line-clamp-2">
            {{ preset.desc }}
          </p>
        </div>

        <div class="pt-3 mt-3 border-t border-[#1f2937] text-[10px] text-amber-400/90 font-mono">
          {{ preset.driftHighlights }}
        </div>
      </div>
    </div>
  </div>
</template>
