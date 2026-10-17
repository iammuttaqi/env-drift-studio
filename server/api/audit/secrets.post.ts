import { isCandidateSecret, maskSecretValue } from '~/server/utils/entropy'
import type { ScanSecretsRequest, ScanSecretsResponse } from '~/types/api'
import type { SecretLeakAlert, SecretMatchedRule, LeakSeverity } from '~/types/security'

export default defineEventHandler(async (event): Promise<ScanSecretsResponse> => {
  try {
    const body = await readBody<ScanSecretsRequest>(event)
    if (!body || !body.stages || !Array.isArray(body.stages)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: stages array is required',
      })
    }

    const alerts: SecretLeakAlert[] = []
    let criticalCount = 0
    let warningCount = 0

    for (const stageGroup of body.stages) {
      const stage = stageGroup.stage
      const isPublic = stage === 'example'

      for (const entry of stageGroup.entries) {
        if (!entry.value || !entry.value.trim()) continue

        const check = isCandidateSecret(entry.key, entry.value)
        if (check.isSecret) {
          const rule: SecretMatchedRule = check.rule || 'SHANNON_ENTROPY'
          const severity: LeakSeverity = isPublic ? 'CRITICAL' : check.severity || 'WARNING'

          if (severity === 'CRITICAL') {
            criticalCount++
          } else {
            warningCount++
          }

          let remediation = 'Rotate this credential immediately and replace with an uncommitted mock placeholder.'
          if (isPublic) {
            remediation = 'CRITICAL: Live credential detected in public template. Scrub immediately to prevent version control exposure.'
          } else if (rule === 'AWS_KEY') {
            remediation = 'Revoke this AWS Access Key in IAM console and store via an environment secrets manager.'
          } else if (rule === 'STRIPE_SECRET') {
            remediation = 'Live Stripe key found. Restrict API privileges and store in secure production environment.'
          } else if (rule === 'GITHUB_TOKEN') {
            remediation = 'GitHub personal access token detected. Revoke in GitHub developer settings.'
          } else if (rule === 'PRIVATE_KEY') {
            remediation = 'Unencrypted private key detected in environment file. Move to KMS or secure secrets storage.'
          }

          alerts.push({
            stage,
            key: entry.key,
            valueMasked: maskSecretValue(entry.value),
            entropy: check.entropy,
            matchedRule: rule,
            severity,
            isPublicExposure: isPublic,
            remediation,
          })
        }
      }
    }

    return {
      success: true,
      totalAlerts: alerts.length,
      criticalCount,
      warningCount,
      alerts,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to scan secrets: ${error.message || error}`,
    })
  }
})
