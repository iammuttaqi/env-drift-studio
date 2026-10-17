export type DriftClassification =
  | 'IN_SYNC'
  | 'MISSING'
  | 'EMPTY'
  | 'TYPE_MISMATCH'
  | 'ORPHANED'

export type PrimitiveType = 'string' | 'number' | 'boolean' | 'url' | 'email' | 'empty'

export type EnvironmentStage = 'development' | 'staging' | 'production' | 'example'

export interface CellValue {
  stage: EnvironmentStage
  exists: boolean
  value: string
  inferredType: PrimitiveType
  isMasked: boolean
  hash: string
  entropyScore: number
  hasSecretLeak: boolean
}

export interface MatrixRow {
  key: string
  status: DriftClassification
  severity: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  comment?: string
  presence: {
    development: boolean
    staging: boolean
    production: boolean
    example: boolean
  }
  values: Record<string, CellValue>
  driftReasons: string[]
}

export interface DriftMetrics {
  totalUniqueKeys: number
  inSyncCount: number
  missingCount: number
  emptyCount: number
  typeMismatchCount: number
  orphanedCount: number
  leakCount: number
}

export interface DriftAnalysisResult {
  healthScore: number
  metrics: DriftMetrics
  matrix: MatrixRow[]
}
