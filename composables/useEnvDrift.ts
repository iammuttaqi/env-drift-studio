import { ref, computed } from 'vue'
import type {
  EnvironmentStage,
  MatrixRow,
  DriftMetrics,
  DriftAnalysisResponse,
} from '~/types/drift'
import type { EnvToken, EnvSyntaxError } from '~/types/ast'
import type { SecretLeakAlert, ScanSecretsResponse } from '~/types/security'
import type {
  ProjectSummary,
  GetProjectsResponse,
  ParseEnvResponse,
  CompileZodResponse,
  CompileExampleResponse,
  ExportCIResponse,
} from '~/types/api'

export interface StageState {
  rawContent: string
  tokens: EnvToken[]
  fileName: string
  syntaxErrors: EnvSyntaxError[]
}

// Global singleton state so navigation across pages retains active audit session
const projectId = ref<string>('nextjs-saas')
const projectName = ref<string>('Next.js SaaS Stack')
const projectSlug = ref<string>('nextjs-saas')

const stages = ref<Record<EnvironmentStage, StageState>>({
  development: { rawContent: '', tokens: [], fileName: '.env.development', syntaxErrors: [] },
  staging: { rawContent: '', tokens: [], fileName: '.env.staging', syntaxErrors: [] },
  production: { rawContent: '', tokens: [], fileName: '.env.production', syntaxErrors: [] },
  example: { rawContent: '', tokens: [], fileName: '.env.example', syntaxErrors: [] },
})

const isZeroKnowledgeMasked = ref<boolean>(true)
const searchQuery = ref<string>('')
const filterStatus = ref<string>('ALL')
const activeStageTab = ref<EnvironmentStage>('development')

const matrix = ref<MatrixRow[]>([])
const healthScore = ref<number>(100)
const metrics = ref<DriftMetrics>({
  totalUniqueKeys: 0,
  inSyncCount: 0,
  missingCount: 0,
  emptyCount: 0,
  typeMismatchCount: 0,
  orphanedCount: 0,
  leakCount: 0,
})
const leakAlerts = ref<SecretLeakAlert[]>([])
const isAnalyzing = ref<boolean>(false)

const projectsList = ref<ProjectSummary[]>([])
const strictFailOnDrift = ref<boolean>(true)

const generatedZodCode = ref<string>('')
const generatedExampleCode = ref<string>('')
const serverKeysCount = ref<number>(0)
const clientKeysCount = ref<number>(0)
const scrubbedCount = ref<number>(0)

const generatedMarkdownReport = ref<string>('')
const generatedGithubActionYaml = ref<string>('')

let isInitialized = false

export function useEnvDrift() {
  const activeStages = computed<EnvironmentStage[]>(() => {
    const list: EnvironmentStage[] = ['development', 'staging', 'production', 'example']
    // Return all 4 stages by default for 4-stage matrix comparison
    return list
  })

  const stageCounts = computed(() => ({
    development: stages.value.development.tokens.length,
    staging: stages.value.staging.tokens.length,
    production: stages.value.production.tokens.length,
    example: stages.value.example.tokens.length,
  }))

  const rawContents = computed(() => ({
    development: stages.value.development.rawContent,
    staging: stages.value.staging.rawContent,
    production: stages.value.production.rawContent,
    example: stages.value.example.rawContent,
  }))

  const syntaxErrors = computed(() => ({
    development: stages.value.development.syntaxErrors,
    staging: stages.value.staging.syntaxErrors,
    production: stages.value.production.syntaxErrors,
    example: stages.value.example.syntaxErrors,
  }))

  async function fetchProjects() {
    try {
      const res = await $fetch<GetProjectsResponse>('/api/projects')
      if (res.success && res.projects) {
        projectsList.value = res.projects
      }
    } catch (err) {
      console.warn('Failed to fetch projects list:', err)
    }
  }

  async function updateStageContent(stage: EnvironmentStage, rawContent: string) {
    stages.value[stage].rawContent = rawContent

    // Parse tokens via server AST endpoint
    try {
      const res = await $fetch<ParseEnvResponse>('/api/audit/parse', {
        method: 'POST',
        body: { stage, rawContent },
      })
      if (res.success) {
        stages.value[stage].tokens = res.tokens
        stages.value[stage].syntaxErrors = res.syntaxErrors
      }
    } catch (err) {
      console.warn(`Failed to parse stage ${stage}:`, err)
    }

    await computeDrift()
  }

  function clearStage(stage: EnvironmentStage) {
    stages.value[stage].rawContent = ''
    stages.value[stage].tokens = []
    stages.value[stage].syntaxErrors = []
    computeDrift()
  }

  async function computeDrift() {
    isAnalyzing.value = true
    try {
      const stagePayload = Object.entries(stages.value).map(([stg, state]) => ({
        stage: stg as EnvironmentStage,
        tokens: state.tokens,
        rawContent: state.rawContent,
      }))

      // Call Drift Matrix Alignment Endpoint
      const driftRes = await $fetch<DriftAnalysisResponse>('/api/audit/drift', {
        method: 'POST',
        body: {
          stages: stagePayload,
          referenceStage: 'example',
        },
      })

      if (driftRes.success) {
        matrix.value = driftRes.matrix
        healthScore.value = driftRes.healthScore
        metrics.value = driftRes.metrics
      }

      // Call Secret Leak Heuristic Endpoint
      const secretPayload = Object.entries(stages.value).map(([stg, state]) => ({
        stage: stg as EnvironmentStage,
        entries: state.tokens.map((t) => ({ key: t.key, value: t.value })),
      }))

      const secretRes = await $fetch<ScanSecretsResponse>('/api/audit/secrets', {
        method: 'POST',
        body: { stages: secretPayload },
      })

      if (secretRes.success) {
        leakAlerts.value = secretRes.alerts
      }

      // Compile initial Zod and Example
      await compileZodSchema()
      await compileExample()
      await generateCIExports()
    } catch (err) {
      console.error('Drift computation failed:', err)
    } finally {
      isAnalyzing.value = false
    }
  }

  async function compileZodSchema(framework: 'nextjs' | 'nuxtjs' | 'node' = 'nextjs', clientPrefix: string = 'NEXT_PUBLIC_') {
    if (matrix.value.length === 0) return
    try {
      const res = await $fetch<CompileZodResponse>('/api/compile/zod', {
        method: 'POST',
        body: {
          matrix: matrix.value,
          framework,
          clientPrefix,
        },
      })
      if (res.success) {
        generatedZodCode.value = res.tsCode
        serverKeysCount.value = res.serverKeysCount
        clientKeysCount.value = res.clientKeysCount
      }
    } catch (err) {
      console.warn('Failed to compile Zod schema:', err)
    }
  }

  async function compileExample(customPlaceholders?: Record<string, string>) {
    // Prefer tokens from example stage if present, otherwise development stage
    const candidateTokens =
      stages.value.example.tokens.length > 0
        ? stages.value.example.tokens
        : stages.value.development.tokens

    if (candidateTokens.length === 0) return

    try {
      const res = await $fetch<CompileExampleResponse>('/api/compile/example', {
        method: 'POST',
        body: {
          tokens: candidateTokens,
          customPlaceholders,
        },
      })
      if (res.success) {
        generatedExampleCode.value = res.sanitizedContent
        scrubbedCount.value = res.scrubbedCount
      }
    } catch (err) {
      console.warn('Failed to compile example template:', err)
    }
  }

  async function generateCIExports() {
    try {
      const driftedKeys = matrix.value.filter((r) => r.status !== 'IN_SYNC')
      const res = await $fetch<ExportCIResponse>('/api/export/ci', {
        method: 'POST',
        body: {
          projectName: projectName.value,
          healthScore: healthScore.value,
          metrics: metrics.value,
          driftedKeys,
          leaks: leakAlerts.value,
          strictFailOnDrift: strictFailOnDrift.value,
        },
      })
      if (res.success) {
        generatedMarkdownReport.value = res.markdownReport
        generatedGithubActionYaml.value = res.githubActionYaml
      }
    } catch (err) {
      console.warn('Failed to export CI reports:', err)
    }
  }

  function toggleMasking() {
    isZeroKnowledgeMasked.value = !isZeroKnowledgeMasked.value
  }

  function sanitizeExampleSecret(key: string) {
    const raw = stages.value.example.rawContent
    // Replace the real secret line with safe placeholder
    const lines = raw.split(/\r?\n/)
    const updatedLines = lines.map((line) => {
      if (line.trim().startsWith(`${key}=`)) {
        return `${key}=sk_test_mock_placeholder_key_do_not_commit`
      }
      return line
    })
    updateStageContent('example', updatedLines.join('\n'))
  }

  async function loadPreset(slug: string) {
    isAnalyzing.value = true
    try {
      // Find preset in projectsList or fetch from DB
      await fetchProjects()
      const found = projectsList.value.find((p) => p.slug === slug)
      if (found) {
        projectId.value = found.id
        projectName.value = found.name
        projectSlug.value = found.slug
      }

      // Hardcoded preset fallback contents matching seed.ts
      if (slug === 'nextjs-saas') {
        projectName.value = 'Next.js SaaS Stack'
        projectSlug.value = 'nextjs-saas'
        await updateStageContent(
          'development',
          `# Application Server
PORT=8080
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_dev?schema=public"

# Authentication & Security
JWT_SECRET=super_secret_local_jwt_key_32bytes_long!!
AUTH_TRUST_HOST=true

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_51Mz92DevTestKeyXYZ12345
STRIPE_WEBHOOK_SECRET=whsec_dev_local_test_key_abc123
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Mz92DevPublishableKey

# AWS S3 Storage
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7DEVTEST
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYDEVKEY12345
AWS_REGION=us-east-1
AWS_S3_BUCKET=dev-uploads-bucket

# Maintenance & Flags
ENABLE_MAINTENANCE_MODE=false
DEBUG_LOGS=true
ORPHANED_FEATURE_FLAG=experimental_v2
CACHE_TTL_SECONDS=60
`
        )
        await updateStageContent(
          'staging',
          `# Application Server
PORT=3000
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.saasapp.io
NEXT_PUBLIC_API_URL=https://staging.saasapp.io/api

# Database Configuration
DATABASE_URL="postgresql://pguser:stg_pass99281@staging-db.rds.amazonaws.com:5432/saas_stg?schema=public"

# Authentication & Security
JWT_SECRET=9f82b7c61e4d3a05928471625349018274635241bcae9812
AUTH_TRUST_HOST=true

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_51Mz92StagingKey98765432
STRIPE_WEBHOOK_SECRET=whsec_staging_test_key_xyz890
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Mz92StagingPublishableKey

# AWS S3 Storage
AWS_ACCESS_KEY_ID=AKIASTAGINGKEY998877
AWS_SECRET_ACCESS_KEY=vKa7xP/K7MDENGbPxRfiCYSTAGINGSECRETKEY45
AWS_REGION=us-east-1
AWS_S3_BUCKET=stg-uploads-bucket

# Maintenance & Flags
ENABLE_MAINTENANCE_MODE="false"
DEBUG_LOGS=true
ORPHANED_FEATURE_FLAG=experimental_v2
CACHE_TTL_SECONDS=300
`
        )
        await updateStageContent(
          'production',
          `# Application Server
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://saasapp.io
NEXT_PUBLIC_API_URL=https://saasapp.io/api

# Database Configuration
DATABASE_URL="postgresql://saas_prod_admin:pr0d_S3cure_P@ssw0rd_98!@prod-cluster.rds.amazonaws.com:5432/saas_prod?sslmode=require"

# Authentication & Security
JWT_SECRET=e7b41c0942e61a293bf63c6218d960f583e712a394d508c90184
AUTH_TRUST_HOST=true

# Stripe Payments (Critical Drift: STRIPE_WEBHOOK_SECRET is missing!)
STRIPE_SECRET_KEY=sk_live_51Msz92kd01Pq9XyZaBcDeFgH78901234
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Msz92kd01Pq9XyPublishable

# AWS S3 Storage
AWS_ACCESS_KEY_ID=AKIAPRODKEY11223344
AWS_SECRET_ACCESS_KEY=pLk983hGtf71mQW92xZv18kLms91209384nsa812
AWS_REGION=us-east-1
AWS_S3_BUCKET=prod-customer-assets

# Maintenance & Flags (Type Discrepancy: boolean integer 0 vs string "false")
ENABLE_MAINTENANCE_MODE=0
CACHE_TTL_SECONDS=3600
`
        )
        await updateStageContent(
          'example',
          `# Application Server
PORT=3000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Authentication & Security
JWT_SECRET=your_jwt_secret_min_32_chars_here
AUTH_TRUST_HOST=true

# Stripe Payments (Critical Leak: Live Stripe secret in public template!)
STRIPE_SECRET_KEY=sk_live_51NzQ8eL2kPq9XyZaBcDeFg
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# AWS S3 Storage
AWS_ACCESS_KEY_ID=AKIA_YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_placeholder
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Maintenance & Flags
ENABLE_MAINTENANCE_MODE=false
DEBUG_LOGS=false
CACHE_TTL_SECONDS=60
`
        )
      } else if (slug === 'supabase-stripe') {
        projectName.value = 'Supabase & Stripe Storefront'
        projectSlug.value = 'supabase-stripe'
        await updateStageContent(
          'development',
          `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dev_anon_token_12345
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dev_service_role_token_67890
STRIPE_SECRET_KEY=sk_test_51SupabaseTestKey123
RESEND_API_KEY=re_dev_test_token_887766
PORT=3000
`
        )
        await updateStageContent(
          'production',
          `NEXT_PUBLIC_SUPABASE_URL=https://xyzproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_anon_token_real
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_service_role_key_real
STRIPE_SECRET_KEY=sk_live_51SupabaseLiveKeyReal99
RESEND_API_KEY=re_live_real_resend_api_token_4433
PORT=3000
`
        )
        await updateStageContent(
          'example',
          `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_SECRET_KEY=sk_test_placeholder_key
RESEND_API_KEY=re_placeholder_token
PORT=3000
`
        )
      } else if (slug === 'microservices-api') {
        projectName.value = 'Microservices API Gateway'
        projectSlug.value = 'microservices-api'
        await updateStageContent(
          'development',
          `GATEWAY_PORT=4000
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
RATE_LIMIT_MAX_REQUESTS=1000
SERVICE_API_SECRET=dev_shared_gateway_secret_key_7788
`
        )
        await updateStageContent(
          'production',
          `GATEWAY_PORT=4000
REDIS_HOST=redis-master.internal.cluster
REDIS_PORT=6379
KAFKA_BROKERS=kafka-1.internal:9092,kafka-2.internal:9092
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.collector.prod:4318
RATE_LIMIT_MAX_REQUESTS=50000
SERVICE_API_SECRET=9a4f210cb8e34125dcae981274635241bcae
`
        )
        await updateStageContent(
          'example',
          `GATEWAY_PORT=4000
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
RATE_LIMIT_MAX_REQUESTS=1000
SERVICE_API_SECRET=your_service_api_shared_secret
`
        )
      }
    } catch (err) {
      console.error('Failed to load preset:', err)
    } finally {
      isAnalyzing.value = false
    }
  }

  async function init() {
    if (isInitialized) return
    isInitialized = true
    await fetchProjects()
    // Auto-load Next.js SaaS preset on initial mount if empty
    if (stages.value.development.tokens.length === 0) {
      await loadPreset('nextjs-saas')
    }
  }

  return {
    projectId,
    projectName,
    projectSlug,
    stages,
    activeStages,
    stageCounts,
    rawContents,
    syntaxErrors,
    isZeroKnowledgeMasked,
    searchQuery,
    filterStatus,
    activeStageTab,
    matrix,
    healthScore,
    metrics,
    leakAlerts,
    isAnalyzing,
    projectsList,
    strictFailOnDrift,
    generatedZodCode,
    generatedExampleCode,
    serverKeysCount,
    clientKeysCount,
    scrubbedCount,
    generatedMarkdownReport,
    generatedGithubActionYaml,
    init,
    fetchProjects,
    loadPreset,
    updateStageContent,
    clearStage,
    computeDrift,
    toggleMasking,
    compileZodSchema,
    compileExample,
    generateCIExports,
    sanitizeExampleSecret,
  }
}
