import type { EnvToken } from '~/types/ast'
import type {
  MatrixRow,
  DriftClassification,
  CellValue,
  EnvironmentStage,
  DriftAnalysisResult,
  DriftMetrics,
} from '~/types/drift'
import { inferPrimitiveType, isCandidateSecret, computeSha256Sync } from './entropy'

export function alignDriftMatrix(
  stagesMap: Record<EnvironmentStage, { tokens: EnvToken[] }>,
  referenceStage: EnvironmentStage = 'example'
): DriftAnalysisResult {
  const allStages: EnvironmentStage[] = ['development', 'staging', 'production', 'example']
  const activeStages = allStages.filter((s) => stagesMap[s]?.tokens && stagesMap[s].tokens.length > 0)

  // Collect all unique keys across active stages
  const keySet = new Set<string>()
  for (const s of activeStages) {
    for (const token of stagesMap[s].tokens) {
      keySet.add(token.key)
    }
  }

  const sortedKeys = Array.from(keySet).sort((a, b) => a.localeCompare(b))
  const matrix: MatrixRow[] = []

  let inSyncCount = 0
  let missingCount = 0
  let emptyCount = 0
  let typeMismatchCount = 0
  let orphanedCount = 0
  let leakCount = 0

  for (const key of sortedKeys) {
    const presence = {
      development: false,
      staging: false,
      production: false,
      example: false,
    }

    const values: Record<string, CellValue> = {}
    const typesSeen = new Set<string>()
    let representativeComment: string | undefined

    for (const stage of activeStages) {
      const token = stagesMap[stage]?.tokens.find((t) => t.key === key)
      const exists = Boolean(token)
      presence[stage] = exists

      if (exists && token) {
        if (!representativeComment && (token.commentBefore || token.inlineComment)) {
          representativeComment = token.commentBefore || token.inlineComment
        }

        const val = token.value
        const inferredType = inferPrimitiveType(val)
        if (inferredType !== 'empty') {
          typesSeen.add(inferredType)
        }

        const secretCheck = isCandidateSecret(key, val)
        if (secretCheck.isSecret && stage === 'example') {
          leakCount++
        }

        values[stage] = {
          stage,
          exists: true,
          value: val,
          inferredType,
          isMasked: true,
          hash: computeSha256Sync(val),
          entropyScore: secretCheck.entropy,
          hasSecretLeak: secretCheck.isSecret,
        }
      }
    }

    const driftReasons: string[] = []
    let status: DriftClassification = 'IN_SYNC'

    const inReference = stagesMap[referenceStage]?.tokens.some((t) => t.key === key)
    const missingInActiveStages = activeStages.filter((s) => !presence[s])
    const emptyInActiveStages = activeStages.filter((s) => presence[s] && values[s]?.inferredType === 'empty')

    // Detect boolean trap: e.g. "0" vs "false"
    const hasBooleanTrap =
      activeStages.some((s) => presence[s] && values[s]?.value.toLowerCase() === 'false') &&
      activeStages.some((s) => presence[s] && values[s]?.value === '0')

    if (inReference && missingInActiveStages.length > 0) {
      status = 'MISSING'
      missingCount++
      driftReasons.push(`Missing in ${missingInActiveStages.join(', ')}`)
    } else if (presence.production && (presence.development || presence.staging) && missingInActiveStages.length > 0) {
      status = 'MISSING'
      missingCount++
      driftReasons.push(`Stage parity gap: missing in ${missingInActiveStages.join(', ')}`)
    } else if (hasBooleanTrap || typesSeen.size > 1) {
      status = 'TYPE_MISMATCH'
      typeMismatchCount++
      if (hasBooleanTrap) {
        driftReasons.push('Boolean trap: "false" (truthy in JS string runtime) vs numeric 0')
      } else {
        driftReasons.push(`Conflicting primitive types: ${Array.from(typesSeen).join(' vs ')}`)
      }
    } else if (emptyInActiveStages.length > 0) {
      status = 'EMPTY'
      emptyCount++
      driftReasons.push(`Empty value declared in ${emptyInActiveStages.join(', ')}`)
    } else if (!inReference && stagesMap[referenceStage]?.tokens.length > 0) {
      status = 'ORPHANED'
      orphanedCount++
      driftReasons.push(`Not declared in reference stage (${referenceStage})`)
    } else {
      status = 'IN_SYNC'
      inSyncCount++
    }

    const severity =
      status === 'MISSING'
        ? 'CRITICAL'
        : status === 'IN_SYNC'
        ? 'HEALTHY'
        : 'WARNING'

    matrix.push({
      key,
      status,
      severity,
      comment: representativeComment,
      presence,
      values,
      driftReasons,
    })
  }

  const penalty =
    missingCount * 15 +
    leakCount * 25 +
    typeMismatchCount * 10 +
    emptyCount * 5

  const healthScore = Math.max(0, 100 - penalty)

  const metrics: DriftMetrics = {
    totalUniqueKeys: sortedKeys.length,
    inSyncCount,
    missingCount,
    emptyCount,
    typeMismatchCount,
    orphanedCount,
    leakCount,
  }

  return {
    healthScore,
    metrics,
    matrix,
  }
}
