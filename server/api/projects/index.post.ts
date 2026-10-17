import { getPrisma } from '~/server/utils/prisma'
import { parseEnvContent } from '~/server/utils/parser'
import { computeSha256Sync } from '~/server/utils/entropy'
import type { SaveProjectRequest, SaveProjectResponse } from '~/types/api'

export default defineEventHandler(async (event): Promise<SaveProjectResponse> => {
  try {
    const body = await readBody<SaveProjectRequest>(event)
    if (!body || !body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Project name is required',
      })
    }

    const prisma = getPrisma()
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const project = await prisma.project.upsert({
      where: { slug },
      create: {
        name: body.name,
        slug,
        description: body.description || null,
      },
      update: {
        name: body.name,
        description: body.description || null,
      },
    })

    if (body.environments && Array.isArray(body.environments)) {
      for (const env of body.environments) {
        const parsed = parseEnvContent(env.rawContent)
        const hash = computeSha256Sync(env.rawContent)

        await prisma.environment.upsert({
          where: {
            projectId_stage: {
              projectId: project.id,
              stage: env.stage,
            },
          },
          create: {
            projectId: project.id,
            stage: env.stage,
            fileName: env.fileName || `.env.${env.stage}`,
            rawContent: env.rawContent,
            parsedJson: JSON.stringify(parsed.tokens),
            hash,
          },
          update: {
            fileName: env.fileName || `.env.${env.stage}`,
            rawContent: env.rawContent,
            parsedJson: JSON.stringify(parsed.tokens),
            hash,
          },
        })
      }
    }

    if (body.auditReport) {
      await prisma.auditReport.create({
        data: {
          projectId: project.id,
          healthScore: body.auditReport.healthScore,
          driftCount: body.auditReport.driftCount,
          leakCount: body.auditReport.leakCount,
          matrixJson: body.auditReport.matrixJson,
        },
      })
    }

    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        updatedAt: project.updatedAt.toISOString(),
      },
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to save project: ${error.message || error}`,
    })
  }
})
