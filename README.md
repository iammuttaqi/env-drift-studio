# EnvDrift Studio

> **Autonomous Cross-Environment Configuration Auditor, Secret Leak Detector, and Type-Safe Schema Compiler**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-env--drift--studio.vercel.app-0284c7?style=flat-square&logo=vercel)](https://env-drift-studio.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-iammuttaqi%2Fenv--drift--studio-1e293b?style=flat-square&logo=github)](https://github.com/iammuttaqi/env-drift-studio)
[![Test Suite](https://img.shields.io/badge/Tests-36%2F36%20Passing-10b981?style=flat-square&logo=checkmarx)](https://github.com/iammuttaqi/env-drift-studio)
[![Nuxt 3](https://img.shields.io/badge/Nuxt-3.14-00DC82?style=flat-square&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org)
[![Radix Vue](https://img.shields.io/badge/Radix%20Vue-1.9-161618?style=flat-square&logo=radix-ui&logoColor=white)](https://www.radix-vue.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate?style=flat-square)](LICENSE)

---

## Executive Overview

In modern multi-stage engineering environments (**Development**, **Staging**, **Production**, and reference **`.env.example`**), environment configuration mismatches are a leading cause of broken deployments, silent runtime exceptions, and catastrophic credential leaks. 

Standard text diffing tools fail because `.env` files are not plain text—they possess distinct semantics: key ordering is irrelevant, multiline private keys span lines, and strings like `"false"` evaluate to truthy values in runtime boolean checks.

**EnvDrift Studio** is an open-source, client-first developer platform that audits environment configuration parity, detects leaked credentials with Shannon entropy heuristics, and generates type-safe schemas before code reaches production.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ KEY                      STATUS          DEVELOPMENT     STAGING        PRODUCTION    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PORT                     In Sync         8080            3000           3000          │
│ STRIPE_WEBHOOK_SECRET    Missing         whsec_dev...    whsec_stg...   [Not defined] │
│ ENABLE_MAINTENANCE_MODE  Type Mismatch   false (string)  "false"        0 (numeric)   │
│ JWT_SECRET               In Sync         ••••••••        ••••••••       ••••••••      │
│ CACHE_TTL_SECONDS        In Sync         60              300            3600          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Value Propositions

- **Eliminate Deployment Regressions:** Catch missing variables, empty keys, and stage divergence before triggering deployment pipelines.
- **Prevent The Boolean String Trap:** Surface runtime type coercion risks where `"false"` evaluates to truthy strings in JavaScript and Python runtimes.
- **Zero-Knowledge Screen-Sharing:** Mask variables with client-side Web Crypto SHA-256 fingerprints (`sha256:7f9a...3c21`) for safe pair-programming and incident triage.
- **Mathematical Secret Detection:** Combine known token regex patterns (AWS, Stripe, GitHub, Private Keys, JWT) with Shannon entropy calculations ($H(X) > 4.2$) to catch leaked credentials in public templates.
- **1-Click Contract Compilation:** Compile inferred variables into validated `@t3-oss/env-core` Zod schemas (`env.ts`) and comment-preserving `.env.example` files.
- **CI/CD Enforcement Gate:** Export drop-in GitHub Actions workflows and Markdown Pull Request summaries to enforce parity gates on PR merges.

---

## Architectural Topology

EnvDrift Studio operates on a dual-tier architecture: client-side cryptographic hashing and entropy analysis paired with a serverless SQLite persistence layer.

```mermaid
flowchart TD
    subgraph Client["Client Tier (Nuxt 3 / Vue 3 Composition API)"]
        UI["App Shell & Navigation<br/>(Radix Vue + Tailwind CSS)"]
        
        subgraph Views["Active Workspace Views"]
            MatrixView["Cross-Stage Drift Matrix<br/>(Side-by-Side 4-Stage Inspector)"]
            SecurityView["Entropy & Secret Inspector<br/>(Regex + Shannon H(X) Engine)"]
            CompilerView["Schema & Template Compiler<br/>(Zod / env.ts / .env.example)"]
            ExportView["CI/CD Gatekeeper<br/>(Markdown PR Log + GitHub Actions)"]
        end

        subgraph ClientState["Client Composables & State"]
            useDrift["useEnvDrift()<br/>Central Workspace State Machine"]
            useEntropy["useEntropyScanner()<br/>Client Heuristic Scan"]
            useMasking["useMasking()<br/>Web Crypto SHA-256 Fingerprints"]
        end

        UI --> Views
        Views --> ClientState
    end

    subgraph Server["Server Tier (Nitro Server Engine)"]
        subgraph Endpoints["Nitro REST API (/api/*)"]
            apiParse["/api/audit/parse"]
            apiDrift["/api/audit/drift"]
            apiSecrets["/api/audit/secrets"]
            apiZod["/api/compile/zod"]
            apiExample["/api/compile/example"]
            apiCI["/api/export/ci"]
            apiProjects["/api/projects"]
        end

        subgraph CoreEngine["Server Processing Engine"]
            ASTParser["AST Tokenizer Engine"]
            DriftEngine["Matrix Alignment & Parity Evaluator"]
            ZodCompiler["Zod / TypeScript AST Generator"]
            EntropyEngine["Shannon & Regex Security Evaluator"]
        end

        subgraph Persistence["Persistence & Cold-Start Adapter"]
            DBAdapter["Serverless /tmp SQLite Adapter<br/>(server/utils/db.ts)"]
            StarterDB[("prisma/starter.db<br/>(Bundled Preset)")]
            TmpDB[("file:/tmp/envdrift.db<br/>(Active DB)")]
            PrismaClient["Prisma Client ORM"]
        end

        Endpoints --> CoreEngine
        apiProjects --> PrismaClient
        PrismaClient --> DBAdapter
        DBAdapter --> StarterDB
        DBAdapter --> TmpDB
    end

    ClientState <-->|JSON Payloads| Endpoints
```

---

## Core Capabilities

### 1. Visual Cross-Environment Drift Matrix
- Compares up to 4 environments simultaneously: `Development`, `Staging`, `Production`, and `Example`.
- AST parser preserves comments, quoted values, multiline RSA keys, and variable interpolations.
- Calculates an executive **Parity Health Score (0–100%)** based on deterministic penalties for missing keys, leaks, and type mismatches.
- Dynamic classification taxonomy: **`In Sync`**, **`Missing`**, **`Type Mismatch`**, **`Empty`**, and **`Orphaned`**.

### 2. Zero-Knowledge Cryptographic Masking
- In-browser hashing via `window.crypto.subtle.digest('SHA-256', ...)`.
- Renders truncated SHA-256 fingerprints (`sha256:8f4c...3e1a`) to verify cross-stage value equality without displaying plaintext secrets.
- Individual cell unmask toggles and global privacy modes.
- Zero external secret transmission—plaintext credentials never leave your browser.

### 3. Shannon Entropy & Secret Leak Inspector
- Evaluates information density via Shannon entropy formula:
  $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
- Flags high-entropy strings ($H(X) > 4.2\text{ bits/char}$) and deterministic credential signatures:
  - **AWS Access Key IDs** (`AKIA[0-9A-Z]{16}`)
  - **Stripe Live Secret Keys** (`sk_live_...`, `rk_live_...`)
  - **GitHub Personal Access Tokens** (`ghp_...`, `github_pat_...`)
  - **Slack Bot Tokens & Webhooks** (`xoxb-...`)
  - **RSA / OpenSSH Private Keys** (`-----BEGIN PRIVATE KEY-----`)
  - **JSON Web Tokens** (`ey...`)
- Automated false positive suppression for standard UUIDs, hostnames, and dummy placeholders.
- 1-click **Sanitize to Mock Placeholders** action for live secrets found in `.env.example`.

### 4. Type-Safe Schema Compiler
- Infers primitives (`string`, `number`, `boolean`, `url`, `email`).
- Compiles production-ready `@t3-oss/env-core` Zod schemas (`env.ts`).
- Partitions server-side secrets from client-side public variables (`NEXT_PUBLIC_` or `NUXT_PUBLIC_`).
- Generates sanitized `.env.example` templates while preserving section comments and ordering.

### 5. CI/CD Gatekeeper
- Ready-to-commit GitHub Actions workflow (`.github/workflows/env-drift-check.yml`).
- Configurable strict parity gate to fail pull request builds on configuration drift.
- Executive Markdown audit reports ready for PR descriptions and compliance reviews.

---

## Standards 3.0 Design Manifesto

EnvDrift Studio adheres strictly to **Standards 3.0** design principles:

- **Nuanced Slate & Graphite Dark Theme:** Engineered for visual comfort during extended debugging sessions.
  - Base Canvas: Deep Obsidian Slate (`#0b0f19`)
  - Elevated Cards: Charcoal Graphite (`#111827`)
  - Subdued Surfaces: Dark Slate (`#1e293b`)
  - Structural Dividers: Hairline Zinc (`#1f2937`) & High-Contrast Active (`#374151`)
- **Strictly Zero Emojis in UI:** Headers, buttons, status badges, and notifications use 100% semantic SVG icons from `lucide-vue-next`.
- **Tabular Monospace Discipline:** Key names, SHA-256 hashes, and metric ratings enforce CSS `font-variant-numeric: tabular-nums` in `JetBrains Mono` for precise vertical alignment.
- **Accessible Primitives:** Headless `radix-vue` components provide full WAI-ARIA keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Escape`, `Arrow` keys) and focus trapping.
- **Purposeful Motion:** Smooth 150ms micro-interactions that automatically disable when `prefers-reduced-motion: reduce` is detected.

---

## Quickstart & Local Development

EnvDrift Studio strictly mandates `pnpm` as the package manager.

### Prerequisites
- Node.js LTS (v20.x or v22.x)
- `pnpm` (v9.x or v10.x / v12.x)

```bash
# 1. Clone the repository
git clone https://github.com/iammuttaqi/env-drift-studio.git
cd env-drift-studio

# 2. Install dependencies
pnpm install

# 3. Synchronize database schema & seed presets
pnpm run prisma:push
pnpm run prisma:seed

# 4. Launch local development server
pnpm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Automated Verification Suite

Run the comprehensive 36-test automated verification suite:

```bash
pnpm test
```

### Verified Test Suites (36/36 Passing):
1. **AST Parser:** Grammar rules, multiline tokens, quotes, escapes, comments, interpolation, syntax errors.
2. **Shannon Entropy & Secret Detection:** Entropy calculations, SHA-256 sync hashes, type inference, placeholder suppression, signature matching, value masking.
3. **Drift Matrix Alignment:** Parity scoring, missing keys, boolean traps (`"false"` vs `0`), type mismatches, empty values, orphaned keys, leak penalties.
4. **Zod Compiler & Sanitizer:** T3 schema compilation, client/server key partitioning, secret scrubbing, custom overrides.
5. **Database Integrity:** Prisma models, pre-seeded sample projects, checksum verification, cascade deletions.
6. **Serverless Cold-Start Readiness:** Vercel `/tmp` SQLite replication under `VERCEL=1`.
7. **Anti-AI Slop & Accessibility:** Zero emojis in UI, semantic Lucide SVGs, zero buzzwords, `prefers-reduced-motion` compliance.

---

## Production Build & Docker

### Local Production Build
```bash
# Build the optimized production bundle
pnpm run build

# Start the standalone Nitro server
node .output/server/index.mjs
```

### Docker Deployment
```bash
# Build Docker container
docker build -t env-drift-studio .

# Run Docker container on port 3000
docker run -d -p 3000:3000 --name env-drift-instance env-drift-studio
```

---

## Project Structure

```
env-drift-studio/
├── components/               # Vue 3 UI Components
│   ├── ui/                   # Accessible Radix Vue Primitives (Dialog, Tabs, Popover, etc.)
│   ├── matrix/               # Drift Matrix Table, Rows, Cells, and Header
│   ├── security/             # Secret Audit Panel & Alert Cards
│   ├── compiler/             # Zod Schema Modal & Template Exporter
│   └── export/               # CI/CD Modal & PR Summary Builder
├── composables/              # Reactive Vue State Composables
│   ├── useEnvDrift.ts        # Central Drift Matrix State Machine
│   ├── useEntropyScanner.ts  # Client-side Shannon Entropy Calculator
│   └── useMasking.ts         # Web Crypto SHA-256 Fingerprint Generator
├── pages/                    # File-system Routing
│   ├── index.vue             # Main Drift Matrix Workspace
│   ├── security.vue          # Security & Secret Leak Inspector
│   ├── compiler.vue          # Zod Schema & Example Template Compiler
│   └── export.vue            # CI/CD Gatekeeper & PR Audit Exporter
├── server/                   # Nitro Server Engine
│   ├── api/                  # REST Endpoints (/api/audit, /api/compile, /api/projects)
│   └── utils/                # Server-side AST Parser, Entropy, DB Adapter, & Compilers
├── prisma/                   # SQLite Schema & Pre-Seeded Starter Database
├── tests/                    # Comprehensive 36-Test Verification Suite (verify-all.ts)
├── USER_GUIDE.md             # In-Depth User Manual & Workflows
├── LAUNCH.md                 # Product Hunt, Social, & Show HN Launch Collateral
└── DEPLOYMENT.md             # Operations Manual & Live Verification Tests
```

---

## Documentation Links

- [USER_GUIDE.md](file:///Users/muttaqi/ai-engineering-team/projects/env-drift-studio/USER_GUIDE.md) — Comprehensive user manual, workflow guides, and FAQs.
- [LAUNCH.md](file:///Users/muttaqi/ai-engineering-team/projects/env-drift-studio/LAUNCH.md) — Product Hunt launch pack, Twitter/X thread, Reddit post, and Hacker News Show HN.
- [DEPLOYMENT.md](file:///Users/muttaqi/ai-engineering-team/projects/env-drift-studio/DEPLOYMENT.md) — Production operations manual and serverless smoke test logs.
- [ARCHITECTURE.md](file:///Users/muttaqi/ai-engineering-team/projects/env-drift-studio/ARCHITECTURE.md) — Complete technical specifications and data schemas.

---

## License

EnvDrift Studio is open-source software licensed under the [MIT License](LICENSE).
