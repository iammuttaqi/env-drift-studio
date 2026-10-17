import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    },
  },
})

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

const presets = [
  {
    name: 'Next.js SaaS Stack',
    slug: 'nextjs-saas',
    description: 'B2B subscription SaaS with Stripe billing, Supabase/PostgreSQL, AWS S3 assets, and NextAuth session keys.',
    environments: [
      {
        stage: 'development',
        fileName: '.env.development',
        rawContent: `# Application Server
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
`,
      },
      {
        stage: 'staging',
        fileName: '.env.staging',
        rawContent: `# Application Server
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
`,
      },
      {
        stage: 'production',
        fileName: '.env.production',
        rawContent: `# Application Server
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
`,
      },
      {
        stage: 'example',
        fileName: '.env.example',
        rawContent: `# Application Server
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
`,
      },
    ],
  },
  {
    name: 'Supabase & Stripe Storefront',
    slug: 'supabase-stripe',
    description: 'Headless e-commerce storefront with Supabase auth/database, Stripe checkout, and Resend email notifications.',
    environments: [
      {
        stage: 'development',
        fileName: '.env.local',
        rawContent: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dev_anon_token_12345
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dev_service_role_token_67890
STRIPE_SECRET_KEY=sk_test_51SupabaseTestKey123
RESEND_API_KEY=re_dev_test_token_887766
PORT=3000
`,
      },
      {
        stage: 'production',
        fileName: '.env.production',
        rawContent: `NEXT_PUBLIC_SUPABASE_URL=https://xyzproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_anon_token_real
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_service_role_key_real
STRIPE_SECRET_KEY=sk_live_51SupabaseLiveKeyReal99
RESEND_API_KEY=re_live_real_resend_api_token_4433
PORT=3000
`,
      },
      {
        stage: 'example',
        fileName: '.env.example',
        rawContent: `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_SECRET_KEY=sk_test_placeholder_key
RESEND_API_KEY=re_placeholder_token
PORT=3000
`,
      },
    ],
  },
  {
    name: 'Microservices API Gateway',
    slug: 'microservices-api',
    description: 'High-throughput Node/Go microservices cluster with Redis caching, Kafka message broker, and OpenTelemetry tracing.',
    environments: [
      {
        stage: 'development',
        fileName: '.env.development',
        rawContent: `GATEWAY_PORT=4000
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
RATE_LIMIT_MAX_REQUESTS=1000
SERVICE_API_SECRET=dev_shared_gateway_secret_key_7788
`,
      },
      {
        stage: 'production',
        fileName: '.env.production',
        rawContent: `GATEWAY_PORT=4000
REDIS_HOST=redis-master.internal.cluster
REDIS_PORT=6379
KAFKA_BROKERS=kafka-1.internal:9092,kafka-2.internal:9092
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.collector.prod:4318
RATE_LIMIT_MAX_REQUESTS=50000
SERVICE_API_SECRET=9a4f210cb8e34125dcae981274635241bcae
`,
      },
      {
        stage: 'example',
        fileName: '.env.example',
        rawContent: `GATEWAY_PORT=4000
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
RATE_LIMIT_MAX_REQUESTS=1000
SERVICE_API_SECRET=your_service_api_shared_secret
`,
      },
    ],
  },
]

async function main() {
  console.log('[Seed] Seeding initial database presets...')

  for (const preset of presets) {
    const existing = await prisma.project.findUnique({
      where: { slug: preset.slug },
    })

    const project = existing
      ? await prisma.project.update({
          where: { slug: preset.slug },
          data: {
            name: preset.name,
            description: preset.description,
          },
        })
      : await prisma.project.create({
          data: {
            name: preset.name,
            slug: preset.slug,
            description: preset.description,
          },
        })

    console.log(`[Seed] Processing project: ${project.name} (${project.slug})`)

    for (const env of preset.environments) {
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
          fileName: env.fileName,
          rawContent: env.rawContent,
          parsedJson: JSON.stringify([]),
          hash: sha256(env.rawContent),
        },
        update: {
          fileName: env.fileName,
          rawContent: env.rawContent,
          hash: sha256(env.rawContent),
        },
      })
    }

    // Pre-create initial AuditReport for Next.js SaaS preset
    if (preset.slug === 'nextjs-saas') {
      await prisma.auditReport.create({
        data: {
          projectId: project.id,
          healthScore: 75,
          driftCount: 2,
          leakCount: 1,
          matrixJson: JSON.stringify({}),
        },
      })
    }
  }

  console.log('[Seed] Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()

    // Bundle starter database to prisma/starter.db and public/starter.db for serverless cold start
    const devDbPath = path.resolve(process.cwd(), 'prisma/dev.db')
    const starterDbPath = path.resolve(process.cwd(), 'prisma/starter.db')
    const publicStarterDbPath = path.resolve(process.cwd(), 'public/starter.db')

    if (fs.existsSync(devDbPath)) {
      try {
        fs.copyFileSync(devDbPath, starterDbPath)
        console.log(`[Seed] Copied dev.db to ${starterDbPath}`)

        const publicDir = path.resolve(process.cwd(), 'public')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }
        fs.copyFileSync(devDbPath, publicStarterDbPath)
        console.log(`[Seed] Copied dev.db to ${publicStarterDbPath}`)
      } catch (err) {
        console.warn('[Seed] Could not copy starter.db:', err)
      }
    }
  })
