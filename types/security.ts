export type SecretMatchedRule =
  | 'SHANNON_ENTROPY'
  | 'AWS_KEY'
  | 'GITHUB_TOKEN'
  | 'STRIPE_SECRET'
  | 'SLACK_TOKEN'
  | 'PRIVATE_KEY'
  | 'JWT'

export type LeakSeverity = 'CRITICAL' | 'WARNING'

export interface SecretLeakAlert {
  stage: string
  key: string
  valueMasked: string
  entropy: number
  matchedRule: SecretMatchedRule
  severity: LeakSeverity
  isPublicExposure: boolean
  remediation: string
}

export interface ScanSecretsResult {
  totalAlerts: number
  criticalCount: number
  warningCount: number
  alerts: SecretLeakAlert[]
}
