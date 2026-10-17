<script setup lang="ts">
import { useEnvDrift } from '~/composables/useEnvDrift'
import ZodSchemaModal from '~/components/compiler/ZodSchemaModal.vue'

const {
  generatedZodCode,
  generatedExampleCode,
  serverKeysCount,
  clientKeysCount,
  scrubbedCount,
  compileZodSchema,
} = useEnvDrift()

function handleRecompile(framework: 'nextjs' | 'nuxtjs' | 'node', clientPrefix: string) {
  compileZodSchema(framework, clientPrefix)
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold text-[#f9fafb]">
        Type-Safe Schema & Example Template Compiler
      </h2>
      <p class="text-xs text-[#9ca3af]">
        Synthesize runtime configuration contracts into production-ready Zod / @t3-oss/env-core code and clean .env.example files.
      </p>
    </div>

    <ZodSchemaModal
      :zod-code="generatedZodCode"
      :example-code="generatedExampleCode"
      :server-keys-count="serverKeysCount"
      :client-keys-count="clientKeysCount"
      :scrubbed-count="scrubbedCount"
      @recompile="handleRecompile"
    />
  </div>
</template>
