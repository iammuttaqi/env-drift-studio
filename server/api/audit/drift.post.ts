import { alignDriftMatrix } from '~/server/utils/drift'
import { parseEnvContent } from '~/server/utils/parser'
import type { DriftAnalysisRequest, DriftAnalysisResponse } from '~/types/api'
import type { EnvironmentStage } from '~/types/drift'
import type { EnvToken } from '~/types/ast'

export default defineEventHandler(async (event): Promise<DriftAnalysisResponse> => {
  try {
    const body = await readBody<DriftAnalysisRequest>(event)
    if (!body || !body.stages || !Array.isArray(body.stages)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: stages array is required',
      })
    }

    const stagesMap: Record<EnvironmentStage, { tokens: EnvToken[] }> = {
      development: { tokens: [] },
      staging: { tokens: [] },
      production: { tokens: [] },
      example: { tokens: [] },
    }

    for (const stageInput of body.stages) {
      if (stageInput.tokens && Array.isArray(stageInput.tokens)) {
        stagesMap[stageInput.stage] = { tokens: stageInput.tokens }
      } else if (typeof stageInput.rawContent === 'string') {
        const parsed = parseEnvContent(stageInput.rawContent)
        stagesMap[stageInput.stage] = { tokens: parsed.tokens }
      }
    }

    const referenceStage = body.referenceStage || 'example'
    const result = alignDriftMatrix(stagesMap, referenceStage)

    return {
      success: true,
      healthScore: result.healthScore,
      metrics: result.metrics,
      matrix: result.matrix,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to analyze drift: ${error.message || error}`,
    })
  }
})
