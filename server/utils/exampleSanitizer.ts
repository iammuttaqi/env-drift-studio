import type { EnvToken } from '~/types/ast'
import { isCandidateSecret, inferPrimitiveType } from './entropy'

export function sanitizeToExample(
  tokens: EnvToken[],
  customPlaceholders: Record<string, string> = {}
): { sanitizedContent: string; scrubbedCount: number } {
  let scrubbedCount = 0
  const lines: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    // Preceding comment block
    if (token.commentBefore) {
      if (i > 0) lines.push('')
      const commentLines = token.commentBefore.split('\n')
      for (const cl of commentLines) {
        lines.push(`# ${cl}`)
      }
    }

    let finalVal = token.value
    let wasScrubbed = false

    if (customPlaceholders[token.key]) {
      finalVal = customPlaceholders[token.key]
      wasScrubbed = true
    } else {
      const secretCheck = isCandidateSecret(token.key, token.value)
      const inferred = inferPrimitiveType(token.value)

      if (secretCheck.isSecret || /(SECRET|PASSWORD|TOKEN|PRIVATE_KEY|API_KEY|AUTH)/i.test(token.key)) {
        wasScrubbed = true
        if (/STRIPE.*SECRET/i.test(token.key)) {
          finalVal = 'sk_test_your_stripe_secret_key_here'
        } else if (/STRIPE.*WEBHOOK/i.test(token.key)) {
          finalVal = 'whsec_your_stripe_webhook_secret_here'
        } else if (/AWS_ACCESS_KEY/i.test(token.key)) {
          finalVal = 'AKIA_YOUR_AWS_ACCESS_KEY_ID'
        } else if (/AWS_SECRET/i.test(token.key)) {
          finalVal = 'your_aws_secret_access_key_here'
        } else if (/PRIVATE_KEY/i.test(token.key)) {
          finalVal = '"-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----"'
        } else if (/JWT|AUTH|TOKEN/i.test(token.key)) {
          finalVal = 'your_secure_secret_token_min_32_chars'
        } else {
          finalVal = 'your_placeholder_secret_here'
        }
      } else if (/DATABASE_URL/i.test(token.key)) {
        wasScrubbed = true
        finalVal = '"postgresql://user:password@localhost:5432/dbname"'
      } else if (inferred === 'url' && (token.value.includes('@') || token.value.includes(':'))) {
        // Scrub URL credentials if any
        try {
          const parsedUrl = new URL(token.value)
          if (parsedUrl.username || parsedUrl.password) {
            parsedUrl.username = 'user'
            parsedUrl.password = 'password'
            finalVal = `"${parsedUrl.toString()}"`
            wasScrubbed = true
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    if (wasScrubbed) {
      scrubbedCount++
    }

    let line = `${token.key}=${finalVal}`
    if (token.inlineComment) {
      line += ` # ${token.inlineComment}`
    }

    lines.push(line)
  }

  return {
    sanitizedContent: lines.join('\n') + '\n',
    scrubbedCount,
  }
}
