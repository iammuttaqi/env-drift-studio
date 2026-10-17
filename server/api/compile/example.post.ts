import { sanitizeToExample } from '~/server/utils/exampleSanitizer'
import type { CompileExampleRequest, CompileExampleResponse } from '~/types/api'

export default defineEventHandler(async (event): Promise<CompileExampleResponse> => {
  try {
    const body = await readBody<CompileExampleRequest>(event)
    if (!body || !body.tokens || !Array.isArray(body.tokens)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: tokens array is required',
      })
    }

    const result = sanitizeToExample(body.tokens, body.customPlaceholders)

    return {
      success: true,
      sanitizedContent: result.sanitizedContent,
      scrubbedCount: result.scrubbedCount,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to compile .env.example: ${error.message || error}`,
    })
  }
})
