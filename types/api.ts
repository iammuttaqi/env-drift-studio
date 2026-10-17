import type { EnvToken, EnvSyntaxError } from './ast'
import type { DriftAnalysisResult, MatrixRow, EnvironmentStage } from './drift'
import type { SecretLeakAlert, ScanSecretsResult } from './security'

export interface ProjectSummary {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  environmentStages: EnvironmentStage[]
  latestAudit?: {
    healthScore: number
    driftCount: number
    leakCount: number
    createdAt: string
  }
}

export interface GetProjectsResponse {
  success: boolean
  projects: ProjectSummary[]
}

export interface SaveProjectRequest {
  name: string
  slug?: string
  description?: string
  environments: {
    stage: EnvironmentStage
    fileName?: string
    rawContent: string
  }[]
  auditReport?: {
    healthScore: number
    driftCount: number
    leakCount: number
    matrixJson: string
  }
}

export interface SaveProjectResponse {
  success: boolean
  project: {
    id: string
    name: string
    slug: string
    updatedAt: string
  }
}

export interface ParseEnvRequest {
  stage: EnvironmentStage
  rawContent: string
}

export interface ParseEnvResponse {
  success: boolean
  stage: EnvironmentStage
  tokens: EnvToken[]
  keyCount: number
  syntaxErrors: EnvSyntaxError[]
}

export interface StageInput {
  stage: EnvironmentStage
  tokens?: EnvToken[]
  rawContent?: string
}

export interface DriftAnalysisRequest {
  stages: StageInput[]
  referenceStage?: EnvironmentStage
}

export interface DriftAnalysisResponse extends DriftAnalysisResult {
  success: boolean
}

export interface ScanSecretsRequest {
  stages: {
    stage: EnvironmentStage
    entries: { key: string; value: string }[]
  }[]
}

export interface ScanSecretsResponse extends ScanSecretsResult {
  success: boolean
}

export interface CompileZodRequest {
  matrix: MatrixRow[]
  clientPrefix?: string
  framework?: 'nextjs' | 'nuxtjs' | 'node'
}

export interface CompileZodResponse {
  success: boolean
  tsCode: string
  serverKeysCount: number
  clientKeysCount: number
}

export interface CompileExampleRequest {
  tokens: EnvToken[]
  customPlaceholders?: Record<string, string>
}

export interface CompileExampleResponse {
  success: boolean
  sanitizedContent: string
  scrubbedCount: number
}

export interface ExportCIRequest {
  projectName: string
  healthScore: number
  metrics: DriftAnalysisResult['metrics']
  driftedKeys: MatrixRow[]
  leaks: SecretLeakAlert[]
  strictFailOnDrift: boolean
}

export interface ExportCIResponse {
  success: boolean
  markdownReport: string
  githubActionYaml: string
}
