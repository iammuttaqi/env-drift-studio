import { getPrisma } from '~/server/utils/prisma'
import type { GetProjectsResponse, ProjectSummary } from '~/types/api'
import type { EnvironmentStage } from '~/types/drift'

export default defineEventHandler(async (event): Promise<GetProjectsResponse> => {
  try {
    const prisma = getPrisma()
    const projects = await prisma.project.findMany({
      include: {
        environments: {
          select: {
            stage: true,
          },
        },
        auditReports: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const projectSummaries: ProjectSummary[] = projects.map((p) => {
      const latestAudit = p.auditReports[0]
        ? {
            healthScore: p.auditReports[0].healthScore,
            driftCount: p.auditReports[0].driftCount,
            leakCount: p.auditReports[0].leakCount,
            createdAt: p.auditReports[0].createdAt.toISOString(),
          }
        : undefined

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        environmentStages: p.environments.map((e) => e.stage as EnvironmentStage),
        latestAudit,
      }
    })

    return {
      success: true,
      projects: projectSummaries,
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch projects: ${error.message || error}`,
    })
  }
})
