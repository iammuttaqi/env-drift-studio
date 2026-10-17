import { compileZodSchema } from '~/server/utils/zodCompiler'
import type { CompileZodRequest, CompileZodResponse } from '~/types/api'

export default defineEventHandler(async (event): Promise<CompileZodResponse> => {
  try {
    const body = await readBody<CompileZodRequest>(event)
    if (!body || !body.matrix || !Array.isArray(body.matrix)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: matrix array is required',
      })
    }

    const result = compileZodSchema(body.matrix, {
      clientPrefix: body.clientPrefix,
      framework: body.framework,
    })

    return {
      success: true,
      tsCode: result.tsCode,
      serverKeysCount: result.serverKeysCount,
      clientKeysCount: result.clientKeysCount,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to compile Zod schema: ${error.message || error}`,
    })
  }
})
