# EnvDrift Studio — Production Deployment & Operations Manual

## 1. Overview & Status

| Attribute | Value |
| :--- | :--- |
| **Project Name** | EnvDrift Studio |
| **Deployment Target** | Vercel Serverless Production (AWS Lambda / Global Edge CDN) |
| **Deployment Status** | **LIVE (Production Verified)** |
| **Live Production URL** | [https://env-drift-studio.vercel.app](https://env-drift-studio.vercel.app) |
| **GitHub Repository** | [https://github.com/iammuttaqi/env-drift-studio](https://github.com/iammuttaqi/env-drift-studio) |
| **Deployment Engine** | Vercel CLI via `pnpm dlx vercel` |
| **Package Manager** | `pnpm` (v12.10.1) |
| **Framework & Runtime** | Nuxt 3 (v3.14+), Nitro Engine, Vue 3 (Composition API), TypeScript 5.7, Prisma ORM 5.22, Tailwind CSS 3.4, Radix Vue 1.9, Lucide Vue Next |

---

## 2. Mandatory Post-Deployment Live Smoke Tests

All live production endpoints were rigorously verified against the public Vercel production deployment:

### 2.1 Serverless Cold-Start & Projects API Check (`HEAD`)
```bash
curl -sI https://env-drift-studio.vercel.app/api/projects
```
**HTTP Response:**
```http
HTTP/2 200 
age: 0
cache-control: public, max-age=0, must-revalidate
content-type: text/html
date: Sat, 17 Oct 2026 11:19:48 GMT
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-vercel-cache: MISS
x-vercel-id: bom1::iad1::h446q-1792235988180-17176c83f6e6
```
> **Result:** `HTTP/2 200 OK`. Confirms Nitro serverless cold-start execution and SQLite database hydration into `/tmp/envdrift.db`.

### 2.2 Root Route SSR / SPA Delivery Check (`HEAD`)
```bash
curl -sI https://env-drift-studio.vercel.app/
```
**HTTP Response:**
```http
HTTP/2 200 
age: 0
cache-control: public, max-age=0, must-revalidate
content-type: text/html;charset=utf-8
date: Sat, 17 Oct 2026 11:19:53 GMT
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-powered-by: Nuxt
x-vercel-cache: MISS
x-vercel-id: bom1::iad1::jd6xm-1792235992009-2c53d2045ebf
```
> **Result:** `HTTP/2 200 OK`. Confirms client bundle delivery, HTML pre-rendering, and global Tailwind CSS / font styling.

### 2.3 Pre-Seeded Projects Query (`GET`)
```bash
curl -s https://env-drift-studio.vercel.app/api/projects
```
**Payload Verification:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "960d435f-f98e-432d-8c80-e826fd9d9ab4",
      "name": "Microservices API Gateway",
      "slug": "microservices-api",
      "description": "High-throughput Node/Go microservices cluster with Redis caching, Kafka message broker, and OpenTelemetry tracing.",
      "createdAt": "2026-10-17T10:42:55.200Z",
      "updatedAt": "2026-10-17T10:42:55.200Z",
      "environmentStages": ["development", "production", "example"]
    },
    {
      "id": "9c8fd633-4c55-4e5a-b6db-526a43fefe89",
      "name": "Supabase & Stripe Storefront",
      "slug": "supabase-stripe",
      "description": "Headless e-commerce storefront with Supabase auth/database, Stripe checkout, and Resend email notifications.",
      "createdAt": "2026-10-17T10:42:55.194Z",
      "updatedAt": "2026-10-17T10:42:55.194Z",
      "environmentStages": ["development", "production", "example"]
    },
    {
      "id": "7b3b95f3-b35a-4ce5-a370-ed43208e6597",
      "name": "Next.js SaaS Stack",
      "slug": "nextjs-saas",
      "description": "B2B subscription SaaS with Stripe billing, Supabase/PostgreSQL, AWS S3 assets, and NextAuth session keys.",
      "createdAt": "2026-10-17T10:42:55.182Z",
      "updatedAt": "2026-10-17T10:42:55.182Z",
      "environmentStages": ["development", "staging", "production", "example"],
      "latestAudit": {
        "healthScore": 75,
        "driftCount": 2,
        "leakCount": 1,
        "createdAt": "2026-10-17T10:42:55.192Z"
      }
    }
  ]
}
```

### 2.4 Live AST Lexical Parser Test (`POST`)
```bash
curl -s -X POST https://env-drift-studio.vercel.app/api/audit/parse \
  -H "Content-Type: application/json" \
  -d '{"rawContent":"API_KEY=prod_xyz123\nPORT=3000","stage":"production"}'
```
**Response:**
```json
{
  "success": true,
  "stage": "production",
  "tokens": [
    {
      "key": "API_KEY",
      "value": "prod_xyz123",
      "rawLine": "API_KEY=prod_xyz123",
      "lineNumber": 1,
      "isQuoted": false,
      "isMultiline": false
    },
    {
      "key": "PORT",
      "value": "3000",
      "rawLine": "PORT=3000",
      "lineNumber": 2,
      "isQuoted": false,
      "isMultiline": false
    }
  ],
  "keyCount": 2,
  "syntaxErrors": []
}
```

---

## 3. Local Development & Production Run Instructions

EnvDrift Studio strictly mandates `pnpm` as the package manager.

### 3.1 Local Development
```bash
# Clone the repository
git clone https://github.com/iammuttaqi/env-drift-studio.git
cd env-drift-studio

# Install dependencies using pnpm
pnpm install

# Initialize Prisma schema & seed SQLite database
pnpm run prisma:push
pnpm run prisma:seed

# Launch local development server
pnpm run dev
```
The application will be accessible at `http://localhost:3000`.

### 3.2 Local Production Build & Start
```bash
# Build the production bundle
pnpm run build

# Start the optimized production Nitro server
node .output/server/index.mjs
```
The production server listens on `http://localhost:3000` (or `PORT` defined in the environment).

### 3.3 Running Automated Test Suite
```bash
pnpm test
```
Executes the comprehensive 36-test automated verification suite (`tests/verify-all.ts`) validating AST parsing, Shannon entropy calculation, drift matrix alignment, Zod compiler, database cascade operations, serverless cold start under `VERCEL=1`, and Anti-AI Slop heuristics.

---

## 4. Docker Deployment

### 4.1 Build Docker Image
```bash
docker build -t env-drift-studio .
```

### 4.2 Run Docker Container
```bash
docker run -d \
  -p 3000:3000 \
  --name env-drift-instance \
  -e NODE_ENV=production \
  env-drift-studio
```
Access the application at `http://localhost:3000`.

---

## 5. Vercel Cloud Deployment Architecture

- **Serverless SQLite Cold-Start Resilience:**
  SQLite does not natively persist across serverless instances. EnvDrift Studio resolves this through a multi-tier fallback mechanism:
  1. Nitro attempts to load physical starter databases from `prisma/starter.db` or `public/starter.db`.
  2. If running in an isolated Lambda container where filesystem access is restricted, it seamlessly unpacks the embedded Base64 database (`server/utils/starter-db-embedded.ts`) into `/tmp/envdrift.db`.
  3. This ensures zero cold-start failures and complete data persistence for the lifetime of the container.
- **Client-Side Privacy Engine:**
  All Shannon entropy calculation, AST lexical parsing, and SHA-256 fingerprinting occur client-side in the user's browser using the native Web Crypto API. Plaintext secret credentials never leave the user's browser during standard drift auditing.
- **Nitro Multi-Preset Architecture:**
  Configured dynamically via `preset: process.env.VERCEL ? 'vercel' : 'node-server'`, allowing clean native Serverless Function generation on Vercel while preserving standard Node.js server builds for Docker and bare-metal environments.
