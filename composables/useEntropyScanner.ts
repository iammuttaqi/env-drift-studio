import type { PrimitiveType } from '~/types/drift'
import type { SecretMatchedRule, LeakSeverity, SecretLeakAlert } from '~/types/security'

export function useEntropyScanner() {
  function calculateEntropy(str: string): number {
    if (!str || str.length === 0) return 0

    const len = str.length
    const frequencies = new Map<string, number>()

    for (let i = 0; i < len; i++) {
      const char = str[i]
      frequencies.set(char, (frequencies.get(char) || 0) + 1)
    }

    let entropy = 0
    for (const count of frequencies.values()) {
      const p = count / len
      entropy -= p * Math.log2(p)
    }

    return Number(entropy.toFixed(3))
  }

  function checkSecret(key: string, value: string): {
    isSecret: boolean
    rule?: SecretMatchedRule
    reason?: string
    severity?: LeakSeverity
    entropy: number
  } {
    const entropy = calculateEntropy(value)
    const trimmed = value.trim()

    if (trimmed.length < 16) {
      return { isSecret: false, entropy }
    }

    if (
      /^(your[_-]|placeholder|change[_-]me|mock|dummy|xxx|12345|<your|insert)/i.test(trimmed) ||
      /^(your_.*_here|my-.*-token)$/i.test(trimmed)
    ) {
      return { isSecret: false, entropy }
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
      return { isSecret: false, entropy }
    }

    if (/^https?:\/\/[a-zA-Z0-9.-]+(?::\d+)?(\/[^\s]*)?$/.test(trimmed)) {
      return { isSecret: false, entropy }
    }

    if (/^AKIA[0-9A-Z]{16}$/.test(trimmed)) {
      return { isSecret: true, rule: 'AWS_KEY', reason: 'AWS Access Key ID', severity: 'CRITICAL', entropy }
    }

    if (/^(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})$/.test(trimmed)) {
      return { isSecret: true, rule: 'GITHUB_TOKEN', reason: 'GitHub Personal Access Token', severity: 'CRITICAL', entropy }
    }

    if (/^(sk_live|rk_live)_[0-9a-zA-Z]{24,}$/.test(trimmed)) {
      return { isSecret: true, rule: 'STRIPE_SECRET', reason: 'Stripe Live Secret Key', severity: 'CRITICAL', entropy }
    }

    if (/^xoxb-[0-9]{11,}-[0-9]{11,}-[0-9a-zA-Z]{24}$/.test(trimmed)) {
      return { isSecret: true, rule: 'SLACK_TOKEN', reason: 'Slack Bot Integration Token', severity: 'CRITICAL', entropy }
    }

    if (/-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----/.test(trimmed)) {
      return { isSecret: true, rule: 'PRIVATE_KEY', reason: 'Private Cryptographic Key', severity: 'CRITICAL', entropy }
    }

    if (/^ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+$/.test(trimmed)) {
      return { isSecret: true, rule: 'JWT', reason: 'Signed JSON Web Token (JWT)', severity: 'CRITICAL', entropy }
    }

    if (trimmed.length >= 20 && entropy > 4.2) {
      const isExplicitSecretKey = /(SECRET|PASSWORD|TOKEN|KEY|CREDENTIAL|PRIVATE|AUTH)/i.test(key)
      return {
        isSecret: true,
        rule: 'SHANNON_ENTROPY',
        reason: `High Shannon Entropy (${entropy} bits/char)`,
        severity: isExplicitSecretKey ? 'CRITICAL' : 'WARNING',
        entropy,
      }
    }

    return { isSecret: false, entropy }
  }

  return {
    calculateEntropy,
    checkSecret,
  }
}
