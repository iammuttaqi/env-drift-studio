import { getPrisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const prisma = getPrisma()
    await prisma.project.count()
    setResponseStatus(event, 200)
    return ''
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Database check failed: ${error.message || error}`,
    })
  }
})
