<script setup lang="ts">
import { useEnvDrift } from '~/composables/useEnvDrift'
import SecretAuditPanel from '~/components/security/SecretAuditPanel.vue'

const {
  leakAlerts,
  isAnalyzing,
  sanitizeExampleSecret,
} = useEnvDrift()
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold text-[#f9fafb]">
        Security & Secret Leak Inspector
      </h2>
      <p class="text-xs text-[#9ca3af]">
        Detect unmasked cryptographic secrets, live production API tokens, and high-entropy variables before public exposure.
      </p>
    </div>

    <SecretAuditPanel
      :alerts="leakAlerts"
      :is-analyzing="isAnalyzing"
      @sanitize-example-secret="sanitizeExampleSecret"
    />
  </div>
</template>
