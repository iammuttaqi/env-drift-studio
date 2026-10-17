# Product Requirements Document (PRD)
# EnvDrift Studio: Cross-Environment Configuration Auditor & Drift Guard

**Document Version:** 1.0.0  
**Target Release:** MVP v1.0  
**Author:** Lead Product Manager  
**Status:** Approved for Engineering Implementation  
**Project Workspace:** `/Users/muttaqi/ai-engineering-team/projects/env-drift-studio`  

---

## 1. Executive Summary & Value Proposition

### 1.1 Executive Summary
In modern distributed web engineering, environment configuration drift is a leading cause of silent deployment failures, runtime crashes, and catastrophic security leaks. Developers frequently add new environment keys to their local `.env` files while neglecting to update `.env.example`, staging environments, or production infrastructure secrets. Conversely, legacy projects accumulate stale, orphaned variables that engineers fear deleting due to a lack of schema visibility.

**EnvDrift Studio** is an autonomous, developer-centric cross-environment configuration auditor, secret leak scanner, and type-safe schema compiler. It bridges the gap between raw `.env` files and production infrastructure by providing an interactive visual drift matrix across up to four environment stages (Development, Staging, Production, Example). Powered by an Abstract Syntax Tree (AST) parser, a zero-knowledge cryptographic masking engine, a Shannon entropy secret scanner, and an automated Zod schema generator, EnvDrift Studio empowers teams to verify complete environment parity in seconds and enforce strict configuration contracts before code merges into main.

### 1.2 Core Value Proposition
- **Eliminate Silent Deployment Failures:** Pinpoint missing keys, empty variables, and type discrepancies across environments before deployment pipelines execute.
- **Zero-Knowledge Security & Safe Screen-Sharing:** Inspect and compare configuration states in pair-programming and incident triage without exposing raw production secrets, using client-side SHA-256 value fingerprints and dense masking.
- **Prevent Credential Commits:** Detect live high-entropy API tokens (AWS, Stripe, GitHub, Private Keys) before they reach public repositories or `.env.example` templates.
- **Automated Type Safety:** Compile runtime configuration contracts into validated, production-grade TypeScript/Zod code (`t3-oss/env-core` style) and pristine `.env.example` templates with a single click.
- **CI/CD Pipeline Ready:** Export structured Markdown audit reports for Pull Request comments and drop-in GitHub Actions workflows to enforce drift-free repository gates.

### 1.3 Target Personas

| Persona | Primary Needs & Pain Points | Key Value Driver in EnvDrift Studio |
| :--- | :--- | :--- |
| **Lead / Staff Engineer** | Enforcing strict architectural standards, preventing runtime type coercion errors (e.g. `"false"` being truthy in JavaScript). | 1-click Zod schema compiler and type inference engine (`env.ts`). |
| **DevOps / SRE Specialist** | Ensuring 100% configuration parity across staging, preview, and production infrastructure; establishing automated CI gates. | Visual cross-environment drift matrix, parity score metrics, and exportable GitHub Actions YAML. |
| **Full-Stack Developer** | Managing multiple API keys (Stripe, OpenAI, Supabase), safely sharing screen during triage without exposing production tokens. | Zero-knowledge SHA-256 comparison mode, file drag-and-drop import, and instant AST parsing. |
| **Security & Compliance Auditor** | Guaranteeing no plaintext secrets, private keys, or high-entropy tokens are checked into `.env.example` or repository files. | Shannon entropy detector (> 4.2 bits/byte) and regex signature leak detection. |

---

## 2. Technical Stack & Architecture

### 2.1 Framework & Core Engine
- **Framework:** Nuxt 3 (v3.13+) with Vue 3 Composition API (`<script setup lang="ts">`).
- **Server Engine:** Nitro server engine providing performant API endpoints and server routes.
- **Styling Engine:** Tailwind CSS (v3.4+) with customized semantic dark-mode tokens and typography plugins.
- **UI Primitives:** `radix-vue` headless primitives customized with bespoke art direction (no unstyled stock widgets).
- **Iconography:** `lucide-vue-next` exclusively. Strictly zero emojis in buttons, badges, headers, or cards.
- **Data Persistence:** Prisma ORM (v5.18+) configured with a serverless SQLite adapter (`file:/tmp/envdrift.db` for serverless runtime, `file:./prisma/dev.db` for local development).
- **Package Manager:** `pnpm` exclusively.

### 2.2 Architectural Topology
```
┌────────────────────────────────────────────────────────────────────────┐
│                        EnvDrift Studio Client                          │
│                                                                        │
│   ┌─────────────────────┐   ┌──────────────────────────────────────┐   │
│   │   Import Engine     │   │      Cross-Stage Drift Matrix        │   │
│   │ • Paste / Upload    │──>│ • AST Tokenizer & Parser             │   │
│   │ • 4 Stages (Dev/    │   │ • Dynamic Parity & Drift Analysis    │   │
│   │   Staging/Prod/Ex)  │   │ • Zero-Knowledge SHA-256 Masking     │   │
│   └─────────────────────┘   └──────────────────┬───────────────────┘   │
│                                                │                       │
│             ┌──────────────────────────────────┴──────────────────┐    │
│             ▼                                                     ▼    │
│   ┌─────────────────────┐                               ┌─────────────┴────────┐
│   │ Security Inspector  │                               │ Zod Schema Compiler  │
│   │ • Shannon Entropy   │                               │ • Type Inference     │
│   │ • Key Signatures    │                               │ • t3-oss env.ts Gen  │
│   │   (AWS/Stripe/etc)  │                               │ • Sanitized .env.ex  │
│   └─────────────────────┘                               └─────────────┬────────┘
│                                                                       │
└─────────────────────────────────┬─────────────────────────────────────┼┘
                                  │ Nitro REST API                      │
                                  ▼                                     │
┌──────────────────────────────────────────────────────────────────┐    │
│                       Local / Serverless Engine                  │    │
│   ┌─────────────────────┐               ┌────────────────────┐   │    │
│   │  Prisma ORM Client  │               │ Audit & CI Exporter│<──┘    │
│   │  SQLite Persistence │               │ • Markdown PR Log  │        │
│   │  (/tmp/envdrift.db) │               │ • GitHub Action    │        │
│   └─────────────────────┘               └────────────────────┘        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Functional Requirements & User Stories

### Epic 1: Multi-Environment .env Import & AST Parser

#### Feature Description
The application must ingest up to four distinct environment configurations simultaneously:
1. `Development` (`.env.development` or `.env.local`)
2. `Staging` (`.env.staging`)
3. `Production` (`.env.production`)
4. `Example` (`.env.example` or reference template)

The parser must not rely on naive line-splitting (`split('\n')`). It must use a robust Abstract Syntax Tree (AST) tokenizer that preserves:
- Full line indices and original source order.
- Top-level and inline comments (e.g. `# Database Connection`).
- Quoted strings (single `'` and double `"` quotes) with escape characters.
- Multi-line values (e.g., multiline RSA certificates, complex JSON strings).
- Variable interpolation syntax (e.g., `PORT="${APP_PORT:-3000}"`).
- Empty variables, whitespace around `=` operators, and duplicate key declarations.

#### User Story 1.1: Multi-Stage Ingestion via Direct Paste & File Upload
**As a** Full-Stack Developer,  
**I want to** paste raw `.env` text or drop `.env` files into dedicated stage tabs (Dev, Staging, Prod, Example),  
**So that** I can rapidly stage multi-environment files without manual formatting.

```gherkin
Scenario: Importing configuration files via Drag and Drop
  Given the user is on the EnvDrift Studio Import workspace
  When the user drags and drops a ".env.staging" file into the "Staging" target zone
  Then the AST parser should tokenize the file within 50 milliseconds
  And the "Staging" stage tab should display the total parsed key count (e.g., "34 Keys Detected")
  And the matrix view should update automatically to include the Staging column

Scenario: Pasting raw text containing comments and multiline strings
  Given the user opens the "Development" raw text editor modal
  When the user pastes the following content:
    """
    # Application Port
    PORT=8080
    # Private Key
    SERVER_KEY="-----BEGIN RSA PRIVATE KEY-----
    MIIEowIBAAKCAQEA0Y1+...
    -----END RSA PRIVATE KEY-----"
    """
  Then the AST tokenizer should recognize "PORT" with value "8080"
  And the AST tokenizer should recognize "SERVER_KEY" as a single multi-line token
  And the associated comments should be bound to their respective keys for schema generation
```

#### User Story 1.2: One-Click Quick-Start Sample Environments
**As a** DevOps Engineer evaluating EnvDrift Studio,  
**I want to** load pre-configured sample environments (e.g., Modern SaaS Stack, Supabase + Stripe Stack),  
**So that** I can test drift detection, entropy warnings, and schema export without finding local `.env` files.

```gherkin
Scenario: Loading a pre-built sample environment
  Given the workspace has empty environment slots
  When the user clicks "Load Next.js SaaS Preset" in the quick-start drawer
  Then all four environment stages (Development, Staging, Production, Example) should be populated with sample data
  And the drift matrix should immediately display simulated drift, type mismatches, and a secret leak
```

---

### Epic 2: Visual Cross-Environment Drift Matrix

#### Feature Description
The core user interface is an interactive, high-density matrix comparing all populated environments side-by-side. Every unique environment key identified across all active stages is synthesized into a unified tabular view.

#### Key Classification Taxonomy:
1. **`In Sync` (Healthy):** Key exists across all compared stages with valid populated values.
2. **`Missing` (Critical Drift):** Key is required (present in Example/Production) but absent in Development/Staging.
3. **`Empty / Null` (Warning Drift):** Key exists but contains no value (`KEY=` or `KEY=""`).
4. **`Type Mismatch` (Drift):** Key values evaluate to incompatible runtime primitives (e.g. `FEATURE_FLAG="true"` vs `FEATURE_FLAG="1"` vs `FEATURE_FLAG="enabled"`).
5. **`Orphaned / Stale` (Warning):** Key is defined in an environment stage but omitted entirely from `.env.example` and the reference schema.

#### User Story 2.1: Cross-Environment Drift Detection
**As a** Release Manager,  
**I want to** see a clear visual indicator for any key missing in Staging or Production that exists in Development or Example,  
**So that** I can block deployments that would crash at runtime.

```gherkin
Scenario: Identifying a missing production secret
  Given the user has loaded Development and Production environments
  And Development contains "STRIPE_WEBHOOK_SECRET=whsec_abc123"
  And Production does not contain "STRIPE_WEBHOOK_SECRET"
  When the Cross-Environment Drift Matrix renders
  Then the row for "STRIPE_WEBHOOK_SECRET" should display a "Missing in Production" Rose badge
  And the overall Environment Parity Score should decrease proportionally
  And filtering the matrix by "Status: Drift Only" should keep this row visible
```

#### User Story 2.2: Zero-Knowledge Privacy Masking & SHA-256 Divergence Detection
**As a** Developer presenting during a live screen-share or team pairing session,  
**I want to** verify whether variable values differ across environments without revealing the plaintext credentials on screen,  
**So that** I maintain complete credential security while diagnosing drift.

```gherkin
Scenario: Comparing environment values using SHA-256 fingerprints
  Given the user has enabled "Zero-Knowledge Masking Mode"
  When the matrix renders values for "DATABASE_PASSWORD"
  Then the raw text of the password must never be rendered in the DOM
  And each environment cell should display a truncated SHA-256 hash (e.g., "sha256:8f4c...3e1a")
  And if the hash of Development matches the hash of Staging, an "Identical Value" indicator is shown
  And if the hash of Staging differs from Production, a "Diverged Value" indicator is shown
  And clicking the "Reveal Value" eye icon for a cell reveals plaintext only for that single cell after deliberate user click
```

#### User Story 2.3: Type Discrepancy & Boolean Trap Detection
**As a** Backend Engineer,  
**I want to** be alerted when boolean or numeric variables are declared in conflicting formats,  
**So that** runtime type coercion bugs are caught before execution.

```gherkin
Scenario: Detecting boolean string traps
  Given Development defines "ENABLE_MAINTENANCE_MODE=false"
  And Production defines "ENABLE_MAINTENANCE_MODE=0"
  When the drift analyzer evaluates "ENABLE_MAINTENANCE_MODE"
  Then the matrix should flag the key with a "Type Discrepancy" Amber badge
  And the cell inspection popover should warn: "Value in Dev evaluates to string ('false') which is truthy in JavaScript runtimes"
```

---

### Epic 3: High-Entropy Secret Leak & Pattern Detector

#### Feature Description
A dual-layer security inspection engine executing client-side:
1. **Deterministic Pattern Matchers:** Specific regex heuristics for widely used credentials:
   - AWS Access Key ID (`AKIA[0-9A-Z]{16}`) and Secret Access Key
   - GitHub Personal Access Tokens (`ghp_[0-9a-zA-Z]{36}`, `github_pat_[0-9a-zA-Z_]{82}`)
   - Stripe Secret & Restricted API Keys (`sk_live_[0-9a-zA-Z]{24,}`, `rk_live_[0-9a-zA-Z]{24,}`)
   - Slack Bot Tokens (`xoxb-[0-9]{11,}-[0-9]{11,}-[0-9a-zA-Z]{24}`) & Webhook URLs
   - RSA & OpenSSH Private Keys (`-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----`)
   - JSON Web Tokens (`ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+`)
2. **Shannon Entropy Heuristic:**
   - Calculation formula:  
     $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
   - Strings with length $\ge 20$ characters and Shannon entropy $H(X) > 4.2\text{ bits/char}$ are flagged as likely raw secrets.
   - Known false-positive suppression (UUIDs, structured URLs, common hashes).

#### User Story 3.1: Live Production Secret in `.env.example` or Public Template
**As a** Security Compliance Auditor,  
**I want to** be immediately alerted with a critical banner if a live API key or private key is found in `.env.example`,  
**So that** credentials are never committed to public version control.

```gherkin
Scenario: Detecting a live Stripe secret key in .env.example
  Given the user has imported ".env.example"
  And ".env.example" contains the line "STRIPE_SECRET_KEY=sk_live_51NzQ8eL2kPq9XyZaBcDeFg"
  When the Security Inspector runs its heuristic scan
  Then a "Critical Security Alert" dialog and card must appear
  And the alert must state: "Live Stripe Secret Key detected in public example template"
  And the matrix badge for that key must display "Secret Leak" with an urgent pulse animation
  And a "Sanitize to Mock Placeholder" action button must be provided
```

#### User Story 3.2: High Shannon Entropy Detection
**As a** Lead Developer,  
**I want to** detect unclassified random tokens or passwords that lack a known prefix,  
**So that** high-entropy database passwords or symmetric encryption keys are surfaced.

```gherkin
Scenario: Flagging high-entropy unclassified secret
  Given a variable "AUTH_SECRET=9f82b7c61e4d3a05928471625349018274635241bcae"
  When the entropy calculation evaluates the string value
  Then the calculated entropy score should be approximately 4.82 bits/byte
  And the variable should be classified under "High Entropy Warning" (> 4.2 threshold)
  And the detail inspector should display the character set distribution and calculated entropy
```

---

### Epic 4: Type-Safe Schema & Zod Compiler

#### Feature Description
EnvDrift Studio infers data types from observed variable values across all imported stages and automatically generates:
1. **Validated `env.ts` / `env.mjs`:** Fully compliant with `@t3-oss/env-core` and Zod, distinguishing between server-side secrets and client-side variables (`NEXT_PUBLIC_` or `NUXT_PUBLIC_`).
2. **Sanitized `.env.example`:** Clean template retaining all original comments, section dividers, and variable names, while replacing sensitive values with meaningful type placeholders (e.g. `https://your-domain.com`, `user:pass@localhost:5432/db`).

#### User Story 4.1: Compiling Type-Safe Zod Schema
**As a** TypeScript Architect,  
**I want to** generate a production-ready `env.ts` schema file from my active environment matrix,  
**So that** my application validates environment variables at build and boot time with zero manual boilerplate.

```gherkin
Scenario: Compiling a validated Zod schema
  Given the user has verified a 4-environment matrix with PORT (8080), DATABASE_URL, and NEXT_PUBLIC_API_URL
  When the user navigates to the "Schema Compiler" tab
  And clicks "Generate Zod Contract"
  Then the generated code must import `z` from 'zod' and create an `env` validation schema
  And "PORT" must be compiled as `z.coerce.number().default(8080)`
  And "DATABASE_URL" must be compiled as `z.string().url()`
  And "NEXT_PUBLIC_API_URL" must be categorized under client-side variables
  And the user can click "Copy Schema" or "Download env.ts"
```

#### User Story 4.2: Exporting Sanitized `.env.example`
**As a** Open Source Maintainer,  
**I want to** export a clean `.env.example` that scrubs all production secrets while keeping inline documentation,  
**So that** contributors have an exact setup guide without security risks.

```gherkin
Scenario: Generating sanitized example template
  Given the active matrix contains real secrets and comments across multiple sections
  When the user clicks "Export Sanitized .env.example"
  Then all secret values matching sensitive patterns or high entropy must be replaced with dummy placeholders
  And all original comment blocks and grouping headers must be preserved in place
  And the resulting file must be downloadable with filename ".env.example"
```

---

### Epic 5: CI/CD Audit Report & GitHub Actions Workflow Generator

#### Feature Description
To make configuration audits actionable across developer workflows, EnvDrift Studio generates:
1. **Markdown Pull Request Audit Summary:** Ready to paste into GitHub/GitLab PR descriptions or comments.
2. **Machine-Readable JSON Audit Schema:** Detailed breakdown of parity scores, drifted keys, missing environments, and entropy alerts.
3. **GitHub Actions Workflow YAML:** A ready-to-commit CI workflow (`.github/workflows/env-drift-check.yml`) that runs in pipelines to enforce drift thresholds.

#### User Story 5.1: Markdown PR Audit Export
**As a** DevOps Engineer,  
**I want to** export a Markdown summary of the drift audit,  
**So that** I can document configuration changes in Pull Request reviews.

```gherkin
Scenario: Generating Markdown audit summary
  Given the user completes an audit resulting in 92% parity and 2 missing keys
  When the user clicks "Export Audit Report" -> "Markdown"
  Then a formatted Markdown document should be generated containing:
    - Executive Parity Score summary table
    - Missing keys breakdown with environment tags
    - Security scan summary (0 Leaks / 1 Warning)
    - Timestamp and generated-by metadata
  And clicking "Copy Markdown" copies the raw markdown to the system clipboard
```

#### User Story 5.2: GitHub Actions Workflow Generation
**As a** Platform Engineer,  
**I want to** generate a GitHub Actions workflow file that checks `.env.example` against schema definitions on every PR,  
**So that** our repository blocks merges if a developer introduces an undocumented environment variable.

```gherkin
Scenario: Generating a GitHub Actions CI workflow
  Given the user is on the "CI/CD Gatekeeper" tab
  When the user selects "Fail pipeline on missing .env.example keys"
  And clicks "Generate Workflow YAML"
  Then the system renders a valid GitHub Actions workflow YAML targeting `pull_request` on `main`
  And the workflow includes steps for checking uncommitted secrets and schema drift
  And a "Download .github/workflows/env-drift-check.yml" button is available
```

---

## 4. Standards 3.0 Design & Quality Specifications

### 4.1 Design Philosophy: Purpose-Built Dark Theme
EnvDrift Studio deliberately employs a tailored **Nuanced Slate & Graphite Dark Theme** specifically engineered for infrastructure, security, and systems developers. Configuration and security audits demand prolonged focus, high visual density, and immediate legibility of subtle alphanumeric differences. Bright saturated canvases cause eye fatigue and distract from critical drift indicators.

### 4.2 Exact Color Tokens & Surfaces

| Design Token | Hex Code | Purpose & Application |
| :--- | :--- | :--- |
| **`canvas-base`** | `#0b0f19` | Primary viewport background (Deep Obsidian Slate). Never pure black `#000000`. |
| **`surface-card`** | `#111827` | Elevated card surfaces, panel containers, and modal dialogs. |
| **`surface-subdued`**| `#1e293b` | Inactive tabs, hover states, and input field backgrounds. |
| **`border-hairline`**| `#1f2937` | Subtle structural dividing lines, table grid lines, and card borders. |
| **`border-active`**  | `#374151` | Focused inputs, hovered cards, and active navigation items. |
| **`text-primary`**   | `#f9fafb` | Primary headers, key names, and high-contrast numerical figures. |
| **`text-secondary`** | `#9ca3af` | Descriptive labels, secondary metadata, and inline comments. |
| **`text-muted`**     | `#6b7280` | Tertiary instructions, disabled states, and subtle timestamps. |

#### Semantic Status Tokens (Zero Neon Gradients)
- **Synced / Healthy:**
  - Foreground: `#10b981` (Muted Emerald)
  - Container Background: `#064e3b` (Subtle dark emerald)
  - Border: `#065f46`
- **Missing / Drift Alert:**
  - Foreground: `#f43f5e` (Crisp Rose)
  - Container Background: `#4c0519` (Subtle dark rose)
  - Border: `#9f1239`
- **Secret Warning / High Entropy:**
  - Foreground: `#f59e0b` (Focused Amber)
  - Container Background: `#451a03` (Subtle dark amber)
  - Border: `#92400e`
- **Informational / Metadata:**
  - Foreground: `#06b6d4` (Technical Cyan)
  - Container Background: `#164e63` (Subtle dark cyan)
  - Border: `#0e7490`

### 4.3 Strict Iconography & Visual Cleanliness
- **Strictly ZERO Emojis:** No emojis (`🔥`, `⚠️`, `✅`, `🚀`, `🔒`) may appear anywhere in headers, buttons, status badges, matrix cells, or notifications.
- **Lucide SVG Icons Exclusively:** All visual iconography is rendered using `lucide-vue-next` icons at a consistent stroke width (1.5px or 1.75px) and sizing (14px, 16px, or 20px).
- **Core Icon Mapping:**
  - Audit / Security: `ShieldAlert`, `ShieldCheck`, `KeyRound`, `Lock`, `Unlock`
  - Drift & Diffing: `FileDiff`, `Layers`, `GitCompare`, `Split`
  - Status Indicators: `CheckCircle2`, `AlertTriangle`, `AlertOctagon`, `Info`
  - Actions: `Copy`, `Download`, `Terminal`, `FileCode`, `RefreshCw`, `SlidersHorizontal`
  - Privacy: `Eye`, `EyeOff`, `Fingerprint`, `Hash`

### 4.4 Typography & Tabular Discipline
- **Interface Typography:** `Inter` or `Geist Sans` for clean, crisp user interface navigation, button text, and documentation.
- **Code & Hash Typography:** `JetBrains Mono` or `Geist Mono` for all environment key names, variable values, SHA-256 fingerprints, and entropy scores.
- **Tabular Numbers:** All numeric columns, line numbers, entropy ratings, and percentage badges must enforce CSS `font-variant-numeric: tabular-nums` to guarantee vertical column alignment across rows.

### 4.5 Purposeful Motion & Animation Specifications
All animations must be subtle, functional, and respect user accessibility preferences:
- **Accordion & Drawer Expands:** Smooth 150ms-200ms cubic-bezier transition (`transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1)`).
- **Masking Transitions:** Instant 100ms fade transition between masked bullets (`••••••••`) and SHA-256 hashes or unmasked text.
- **Status Pulse:** Critical secret leaks use a controlled, slow opacity pulse (2-second cycle, 100% to 75% opacity) to attract attention without jarring flashes.
- **Reduced Motion:** If `prefers-reduced-motion: reduce` is active, all transitions and animations are set to `none` via Tailwind's `motion-reduce:transition-none` and `motion-reduce:animate-none`.

### 4.6 Component Primitives & States
- **Primitives:** Built on `radix-vue` (Dialog, Popover, Tooltip, DropdownMenu, Tabs, Accordion, Toggle, ScrollArea) to ensure complete WAI-ARIA keyboard navigation and focus management.
- **Loading Skeletons:** Animated graphite shimmer (`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900`) for table rows and schema blocks during import and generation.
- **Empty States:** Highly functional empty states featuring one-click "Quick-Start Sample Presets" (Next.js SaaS, Supabase + Stripe, Microservices API) and drag-and-drop zones.
- **Error Boundaries:** Granular AST syntax error banners specifying exact line number, column offset, and unexpected characters (e.g. unescaped quotes or invalid variable names).
- **Copy Tone:** Professional, developer-native, and concise. No conversational fluff or AI hype words ("magic", "revolutionize", "unleash", "supercharge").

---

## 5. Data Model & Storage Specifications

### 5.1 Prisma Schema Definition
The local persistence layer utilizes SQLite with Prisma ORM to store project audit sessions, environment snapshots, and validation schemas.

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // Defaults to "file:/tmp/envdrift.db" or "file:./prisma/dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Project {
  id          String                @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
  snapshots   EnvironmentSnapshot[]
  auditLogs   AuditLog[]
}

model EnvironmentSnapshot {
  id             String   @id @default(uuid())
  projectId      String
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  stage          String   // "development" | "staging" | "production" | "example"
  fileName       String?  // e.g., ".env.local"
  rawContent     String   // Raw .env content
  parsedKeyCount Int      @default(0)
  updatedAt      DateTime @updatedAt

  @@unique([projectId, stage])
}

model AuditLog {
  id                String   @id @default(uuid())
  projectId         String
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parityScore       Int      // 0 to 100 percentage
  totalKeys         Int
  syncedKeys        Int
  driftedKeys       Int
  secretAlertsCount Int      @default(0)
  reportMarkdown    String
  reportJson        String
  createdAt         DateTime @default(now())
}
```

### 5.2 Client-Side Session State (Pinia / Vue Composables)
- `useEnvMatrix`: Manages active parsed stages, unified keys list, active filters (Search, Status: All / Drift / Synced / Leaks), and masking state.
- `useEntropyScanner`: Performs real-time regex matching and Shannon entropy computations per cell.
- `useSchemaCompiler`: Orchestrates type inference and AST-to-Zod / AST-to-Example generation.

---

## 6. Non-Functional Requirements (NFRs)

### 6.1 Performance & Latency
- **AST Parsing Speed:** A `.env` file containing 200 variables must tokenize in under 50ms on standard hardware.
- **Matrix Rendering:** The matrix must render at 60 FPS with zero noticeable frame drops when scrolling up to 500 rows. Virtualized or DOM-optimized table rendering must be used if key counts exceed 250.
- **Cryptographic Hashing:** SHA-256 fingerprint generation must utilize the browser's native Web Crypto API (`window.crypto.subtle.digest`) asynchronously, avoiding UI thread freezing.

### 6.2 Security & Zero-Knowledge Architecture
- **Zero External Secret Transmission:** Plaintext environment secrets must never be transmitted to external servers, cloud telemetry, or third-party analytical trackers.
- **Local SQLite Storage:** Project files and snapshots are saved strictly to the local or serverless `/tmp` SQLite database.
- **XSS Prevention:** All parsed comments and variable values must be sanitized before rendering into the DOM, preventing script injection from crafted `.env` files.

### 6.3 Accessibility (WCAG 2.1 AA)
- **Contrast Ratios:** All text elements must achieve a minimum contrast ratio of 4.5:1 against their corresponding backgrounds; active borders and interactive elements must achieve at least 3:1.
- **Keyboard Navigation:** Full keyboard operability across all tabs, matrix filters, masking toggles, and modal dialogues using standard `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape` keys.
- **Focus Rings:** Distinct, high-contrast cyan/slate focus rings (`focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:outline-none`).
- **Screen Reader Support:** Semantic HTML tables with appropriate `scope="col"`, `scope="row"`, and `aria-label` attributes for masked cells and status badges.

### 6.4 Browser & Environment Compatibility
- Fully compatible with modern Evergreen browsers (Google Chrome 115+, Mozilla Firefox 115+, Apple Safari 16.4+, Microsoft Edge 115+).
- Node.js LTS (v20.x or v22.x) compatible for server-side Nitro and Prisma routines.

---

## 7. Explicit MVP Scope Boundaries

To guarantee rapid delivery, extreme quality, and laser focus, the product boundaries are strictly defined below:

### 7.1 Strictly In-Scope (MVP v1.0)
1. **Multi-Stage Ingestion:** Up to 4 stages (`Development`, `Staging`, `Production`, `Example`) supported concurrently.
2. **Flexible Input Modes:** Direct text copy-pasting, `.env` file drag-and-drop, and pre-built sample demo presets.
3. **AST Tokenizer:** Accurate parsing of comments, quotes, multi-line values, and whitespace preservation.
4. **Visual Drift Matrix:** Side-by-side comparison table with status taxonomy (`In Sync`, `Missing`, `Empty`, `Type Mismatch`, `Orphaned`).
5. **Zero-Knowledge Privacy Mode:** Cryptographic SHA-256 value fingerprints and single-click value masking/unmasking.
6. **Security & Entropy Inspector:** Deterministic regex scans (AWS, Stripe, GitHub, Private Keys, Slack, JWT) plus Shannon entropy calculation (> 4.2 bits/byte).
7. **Type-Safe Schema Compiler:** 1-click Zod / `t3-oss/env-core` code generation (`env.ts`) with primitive inference and boolean string trap protection.
8. **Sanitized `.env.example` Generator:** 1-click export scrubbing sensitive values while preserving structure and comments.
9. **Audit Exporter:** Formatted Markdown PR summaries, structured JSON export, and GitHub Actions CI workflow generator.
10. **Design System:** Standards 3.0 slate/graphite dark UI with 100% Lucide SVG icons (zero emojis).
11. **Persistence:** Local SQLite storage via Prisma ORM for saving audit projects and snapshots.

### 7.2 Explicitly Out-of-Scope (Deferred to v1.1+ / v2.0 Roadmap)
1. **Live Cloud Secret Manager Synchronization:** Direct bi-directional API integrations with Doppler, Infisical, AWS Secrets Manager, HashiCorp Vault, or Vercel API. *(Users import via text/file export in MVP).*
2. **Multi-User Collaboration & RBAC:** Multi-tenant team accounts, user authentication, role-based access control, and organization workspaces.
3. **Automated GitHub App / PR Bot:** A hosted GitHub App that automatically posts comments on incoming pull requests via webhooks. *(In MVP, users copy the generated Markdown or use the exported GitHub Actions workflow).*
4. **Encrypted Remote Cloud Backup:** Synchronizing `.env` files to cloud storage buckets (e.g. AWS S3, Cloudflare R2).
5. **Native Desktop Binary:** Packaging the application as a standalone Electron or Tauri desktop application.
6. **Automatic Secret Rotation:** Executing automated rotation of compromised AWS or Stripe credentials in third-party services.

---

## 8. Implementation Roadmap & Milestones

```mermaid
flowchart LR
    M1["Milestone 1: Core Engine<br/>• Nuxt 3 Setup<br/>• AST Parser & Tokenizer<br/>• Prisma SQLite Models"] --> M2["Milestone 2: Drift Matrix<br/>• 4-Stage Importer<br/>• Matrix Table & Badges<br/>• SHA-256 Privacy Masking"]
    M2 --> M3["Milestone 3: Security & Schema<br/>• Shannon Entropy Engine<br/>• Key Regex Heuristics<br/>• Zod Schema Compiler"]
    M3 --> M4["Milestone 4: Polish & Export<br/>• Markdown & CI Exporter<br/>• Standards 3.0 Dark Theme<br/>• Sample Presets & Testing"]
```

- **Phase 1: Foundation & AST Engine**
  - Project scaffolding with Nuxt 3, Tailwind CSS, `radix-vue`, and `lucide-vue-next`.
  - Prisma SQLite configuration and database migration.
  - Development of the AST tokenizer handling multi-line strings, quotes, and comments.
- **Phase 2: Visual Drift Matrix & Privacy Masking**
  - Multi-stage upload and paste interface.
  - Unified matrix computation and dynamic key classification (`In Sync`, `Missing`, `Empty`, `Type Mismatch`).
  - Web Crypto SHA-256 fingerprinting and unmasking interactions.
- **Phase 3: Security Scanner & Zod Compiler**
  - Mathematical Shannon entropy calculation and credential regex suite.
  - Critical leak alert banners and remediation suggestions.
  - Zod type inference and sanitized `.env.example` exporter.
- **Phase 4: CI/CD Export, UI Polish & Final Validation**
  - Markdown PR audit report builder and GitHub Actions YAML generator.
  - Standards 3.0 Slate/Graphite theme verification, zero-emoji audit, and accessibility check.
  - End-to-end user story verification against all Gherkin acceptance criteria.
