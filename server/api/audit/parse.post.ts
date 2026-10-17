import { parseEnvContent } from '~/server/utils/parser'
import type { ParseEnvRequest, ParseEnvResponse } from '~/types/api'

export default defineEventHandler(async (event): Promise<ParseEnvResponse> => {
  try {
    const body = await readBody<ParseEnvRequest>(event)
    if (!body || !body.stage) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing stage parameter',
      })
    }

    const rawContent = body.rawContent || ''
    const result = parseEnvContent(rawContent)

    return {
      success: true,
      stage: body.stage,
      tokens: result.tokens,
      keyCount: result.keyCount,
      syntaxErrors: result.syntaxErrors,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to parse environment file: ${error.message || error}`,
    })
  }
})
