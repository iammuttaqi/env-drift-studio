import type { EnvToken, EnvSyntaxError, ParseEnvResult } from '~/types/ast'

/**
 * Robust AST parser for .env configurations that preserves:
 * - Line numbers and original order
 * - Preceding comments and inline comments
 * - Single/double quoted multi-line values (e.g. RSA keys, certificates, JSON)
 * - Variable interpolation detection (${VAR})
 * - Whitespace around equals sign
 * - Empty string assignments
 */
export function parseEnvContent(rawContent: string): ParseEnvResult {
  const tokens: EnvToken[] = []
  const syntaxErrors: EnvSyntaxError[] = []

  if (!rawContent || !rawContent.trim()) {
    return { tokens, keyCount: 0, syntaxErrors }
  }

  const lines = rawContent.split(/\r?\n/)
  let currentCommentBuffer: string[] = []
  let i = 0

  while (i < lines.length) {
    const originalLine = lines[i]
    const trimmedLine = originalLine.trim()
    const lineNumber = i + 1

    // 1. Empty lines reset comment buffer
    if (!trimmedLine) {
      currentCommentBuffer = []
      i++
      continue
    }

    // 2. Pure Comment lines
    if (trimmedLine.startsWith('#')) {
      const cleanComment = trimmedLine.replace(/^#\s?/, '')
      currentCommentBuffer.push(cleanComment)
      i++
      continue
    }

    // 3. Potential KEY=VALUE assignment
    // Optional 'export ' prefix
    let cleanLine = trimmedLine
    if (cleanLine.startsWith('export ') || cleanLine.startsWith('export\t')) {
      cleanLine = cleanLine.substring(7).trim()
    }

    const eqIndex = cleanLine.indexOf('=')
    if (eqIndex === -1) {
      // Line is not a comment and has no '=', syntax warning
      syntaxErrors.push({
        lineNumber,
        message: 'Invalid environment declaration: missing "=" delimiter',
        snippet: originalLine,
      })
      i++
      continue
    }

    const rawKey = cleanLine.slice(0, eqIndex).trim()
    let rawVal = cleanLine.slice(eqIndex + 1).trim()

    // Validate key naming conventions (e.g., must be valid identifier or allow dots/hyphens if common)
    if (!/^[a-zA-Z_][a-zA-Z0-9_.-]*$/.test(rawKey)) {
      syntaxErrors.push({
        lineNumber,
        message: `Invalid variable key identifier: "${rawKey}"`,
        snippet: originalLine,
      })
    }

    let isQuoted = false
    let quoteChar: "'" | '"' | undefined
    let isMultiline = false
    let inlineComment: string | undefined
    let finalValue = ''

    // Detect if value starts with quote
    if (rawVal.startsWith('"') || rawVal.startsWith("'")) {
      quoteChar = rawVal[0] as "'" | '"'
      isQuoted = true

      // Check if closing quote is on the same line
      const closingIndex = findClosingQuote(rawVal, 1, quoteChar)
      if (closingIndex !== -1) {
        // Quoted value on a single line
        finalValue = rawVal.slice(1, closingIndex)
        const restOfLine = rawVal.slice(closingIndex + 1).trim()
        if (restOfLine.startsWith('#')) {
          inlineComment = restOfLine.replace(/^#\s?/, '')
        }
      } else {
        // Multi-line quoted string
        isMultiline = true
        const multilineLines: string[] = [rawVal.slice(1)]
        let foundClosing = false
        i++

        while (i < lines.length) {
          const nextLine = lines[i]
          const closeIdx = findClosingQuote(nextLine, 0, quoteChar)
          if (closeIdx !== -1) {
            multilineLines.push(nextLine.slice(0, closeIdx))
            const trailing = nextLine.slice(closeIdx + 1).trim()
            if (trailing.startsWith('#')) {
              inlineComment = trailing.replace(/^#\s?/, '')
            }
            foundClosing = true
            break
          } else {
            multilineLines.push(nextLine)
            i++
          }
        }

        if (!foundClosing) {
          syntaxErrors.push({
            lineNumber,
            message: `Unterminated quoted multiline string starting with ${quoteChar}`,
            snippet: originalLine,
          })
        }
        finalValue = multilineLines.join('\n')
      }
    } else {
      // Unquoted value: check for inline comment
      const inlineCommentIndex = rawVal.indexOf('#')
      if (inlineCommentIndex !== -1) {
        inlineComment = rawVal.slice(inlineCommentIndex + 1).trim()
        finalValue = rawVal.slice(0, inlineCommentIndex).trim()
      } else {
        finalValue = rawVal
      }
    }

    // Process escapes if double-quoted
    if (quoteChar === '"') {
      finalValue = unescapeDoubleQuotes(finalValue)
    }

    // Detect variable interpolation ${VAR} or $VAR
    const interpolatedKeys: string[] = []
    const interpolationMatches = finalValue.matchAll(/\$\{?([A-Z0-9_]+)(?::-[^}]*)?\}?/g)
    for (const match of interpolationMatches) {
      if (match[1] && !interpolatedKeys.includes(match[1])) {
        interpolatedKeys.push(match[1])
      }
    }

    const commentBefore = currentCommentBuffer.length > 0 ? currentCommentBuffer.join(' ') : undefined
    currentCommentBuffer = []

    tokens.push({
      key: rawKey,
      value: finalValue,
      rawLine: originalLine,
      lineNumber,
      commentBefore,
      inlineComment,
      isQuoted,
      quoteChar,
      isMultiline,
      interpolatedKeys: interpolatedKeys.length > 0 ? interpolatedKeys : undefined,
    })

    i++
  }

  return {
    tokens,
    keyCount: tokens.length,
    syntaxErrors,
  }
}

/**
 * Finds index of unescaped matching quote
 */
function findClosingQuote(str: string, startIndex: number, quoteChar: "'" | '"'): number {
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === quoteChar) {
      // Check if preceded by odd number of backslashes
      let backslashCount = 0
      let j = i - 1
      while (j >= 0 && str[j] === '\\') {
        backslashCount++
        j--
      }
      if (backslashCount % 2 === 0) {
        return i
      }
    }
  }
  return -1
}

/**
 * Unescapes standard escape characters in double-quoted strings
 */
function unescapeDoubleQuotes(val: string): string {
  return val
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}
