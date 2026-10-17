# EnvDrift Studio: Cross-Environment Configuration Auditor & Drift Guard

An autonomous, developer-centric cross-environment configuration auditor, secret leak scanner, and type-safe schema compiler.

## Core Capabilities

- **Cross-Environment Parity Matrix:** Side-by-side comparison across Development, Staging, Production, and Example environments.
- **Zero-Knowledge Privacy Masking:** Client-side Web Crypto SHA-256 fingerprinting for safe pairing and screen-sharing without plaintext exposure.
- **Shannon Entropy & Secret Leak Detector:** Automated heuristic scanner flagging high-entropy tokens (> 4.2 bits/byte) and live credential signatures (AWS, Stripe, GitHub, Private Keys, Slack, JWT).
- **Type-Safe Schema Compiler:** One-click Zod / `@t3-oss/env-core` code generator with boolean string trap detection and primitive inference.
- **Sanitized Template Generator:** Comment-preserving `.env.example` generator replacing production secrets with mock placeholders.
- **CI/CD Gatekeeper:** Ready-to-use GitHub Actions workflow YAML and Markdown Pull Request audit summaries.
- **Serverless Cold-Start Resilient:** Ephemeral `/tmp/envdrift.db` SQLite database with bundled `prisma/starter.db` seed fallback.

## Design System (Standards 3.0)

- **Canvas Base:** `#0b0f19` (Obsidian Slate)
- **Surface Cards:** `#111827` (Charcoal Graphite)
- **Subdued Surface:** `#1e293b`
- **Borders:** `#1f2937` (Hairline) & `#374151` (Active)
- **Accents:** Emerald `#10b981` (Healthy), Rose `#ef4444` (Drift), Amber `#f59e0b` (Warning), Sky `#38bdf8` (Accent)
- **Strictly Zero Emojis:** Exclusively Lucide SVG icons (`lucide-vue-next`).
- **Typography:** Inter UI and JetBrains Mono code font with tabular numerals (`tabular-nums`).

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Synchronize database and seed presets
pnpm run prisma:push
pnpm run prisma:seed

# 3. Start local development server
pnpm run dev

# 4. Production build
pnpm run build
```
