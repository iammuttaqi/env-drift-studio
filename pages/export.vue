<script setup lang="ts">
import { useEnvDrift } from '~/composables/useEnvDrift'
import CiExportModal from '~/components/export/CiExportModal.vue'

const {
  generatedMarkdownReport,
  generatedGithubActionYaml,
  healthScore,
  strictFailOnDrift,
  generateCIExports,
} = useEnvDrift()

function handleRefresh() {
  generateCIExports()
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold text-[#f9fafb]">
        CI/CD Gatekeeper & Audit Reports
      </h2>
      <p class="text-xs text-[#9ca3af]">
        Export formatted Markdown audit summaries for Pull Request reviews and drop-in GitHub Actions workflows.
      </p>
    </div>

    <CiExportModal
      :markdown-report="generatedMarkdownReport"
      :github-action-yaml="generatedGithubActionYaml"
      :health-score="healthScore"
      :strict-fail-on-drift="strictFailOnDrift"
      @update:strict-fail-on-drift="(val) => { strictFailOnDrift = val; generateCIExports(); }"
      @refresh="handleRefresh"
    />
  </div>
</template>
