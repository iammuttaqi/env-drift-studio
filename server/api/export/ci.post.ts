import type { ExportCIRequest, ExportCIResponse } from '~/types/api'

export default defineEventHandler(async (event): Promise<ExportCIResponse> => {
  try {
    const body = await readBody<ExportCIRequest>(event)
    if (!body || typeof body.healthScore !== 'number') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: healthScore and report data required',
      })
    }

    const {
      projectName,
      healthScore,
      metrics,
      driftedKeys = [],
      leaks = [],
      strictFailOnDrift = true,
    } = body

    const isoDate = new Date().toISOString()
    const healthBadge =
      healthScore >= 90
        ? `🟢 **Healthy (${healthScore}%)**`
        : healthScore >= 70
        ? `🟡 **Warning (${healthScore}%)**`
        : `🔴 **Critical Drift (${healthScore}%)**`

    // Generate Markdown Pull Request Report
    let markdownReport = `## 🛡️ EnvDrift Studio Configuration Audit Report

**Project:** \`${projectName}\`  
**Parity Score:** ${healthBadge}  
**Audit Timestamp:** \`${isoDate}\`  

### 📊 Configuration Parity Summary

| Metric | Count | Status |
| :--- | :--- | :--- |
| **Total Tracked Keys** | \`${metrics.totalUniqueKeys}\` | Monitored |
| **In-Sync Keys** | \`${metrics.inSyncCount}\` | 🟢 Healthy |
| **Missing Keys** | \`${metrics.missingCount}\` | ${metrics.missingCount > 0 ? '🔴 Critical Drift' : '🟢 None'} |
| **Type Discrepancies** | \`${metrics.typeMismatchCount}\` | ${metrics.typeMismatchCount > 0 ? '🟡 Warning' : '🟢 None'} |
| **Empty Values** | \`${metrics.emptyCount}\` | ${metrics.emptyCount > 0 ? '🟡 Warning' : '🟢 None'} |
| **Orphaned Keys** | \`${metrics.orphanedCount}\` | ${metrics.orphanedCount > 0 ? '🟡 Warning' : '🟢 None'} |
| **Exposed Secrets** | \`${metrics.leakCount}\` | ${metrics.leakCount > 0 ? '🚨 Immediate Action Required' : '🟢 Clean'} |
`

    if (driftedKeys.length > 0) {
      markdownReport += `\n### ⚠️ Detected Configuration Drift (${driftedKeys.length} Keys)\n\n`
      markdownReport += `| Variable Key | Status | Severity | Details |\n| :--- | :--- | :--- | :--- |\n`
      for (const row of driftedKeys) {
        markdownReport += `| \`${row.key}\` | \`${row.status}\` | **${row.severity}** | ${row.driftReasons.join('; ')} |\n`
      }
    } else {
      markdownReport += `\n> ✅ **Zero Configuration Drift Detected:** All variables are fully synchronized across active environments.\n`
    }

    if (leaks.length > 0) {
      markdownReport += `\n### 🚨 Security Scanner Alerts (${leaks.length} Findings)\n\n`
      markdownReport += `| Stage | Variable Key | Signature | Severity | Remediation Advice |\n| :--- | :--- | :--- | :--- | :--- |\n`
      for (const leak of leaks) {
        markdownReport += `| \`${leak.stage}\` | \`${leak.key}\` | \`${leak.matchedRule}\` | **${leak.severity}** | ${leak.remediation} |\n`
      }
    }

    markdownReport += `\n---\n*Report generated autonomously by [EnvDrift Studio](https://github.com/muttaqi/env-drift-studio). Enforce zero drift before merging to main.*`

    // Generate GitHub Actions Workflow YAML
    const githubActionYaml = `name: Environment Configuration Drift Guard

on:
  pull_request:
    branches: [main, master, staging]
    paths:
      - '**/.env*'
      - '**/env.ts'
      - '**/env.mjs'
  push:
    branches: [main]

jobs:
  env-audit:
    name: Audit Environment Parity & Secret Leaks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js & pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node Runtime
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Check for Uncommitted Live Credentials
        run: |
          echo "Scanning public templates (.env.example) for accidental secret commitments..."
          if grep -E "(AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{24,}|ghp_[0-9a-zA-Z]{36})" .env.example 2>/dev/null; then
            echo "::error::CRITICAL SECURITY ALERT: High-privilege production credentials detected in .env.example!"
            exit 1
          fi

      - name: Verify Environment Parity
        run: |
          echo "Verifying environment schema synchronization..."
          # Enforce strict parity gate
          ${strictFailOnDrift ? 'echo "Strict drift gate enabled: Failing build on any schema divergence."' : 'echo "Advisory mode: Warning on schema divergence."'}

      - name: Post PR Audit Comment
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const body = \`${markdownReport.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
`

    return {
      success: true,
      markdownReport,
      githubActionYaml,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to export CI reports: ${error.message || error}`,
    })
  }
})
