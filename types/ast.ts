export interface EnvToken {
  key: string
  value: string
  rawLine: string
  lineNumber: number
  commentBefore?: string
  inlineComment?: string
  isQuoted: boolean
  quoteChar?: "'" | '"'
  isMultiline: boolean
  interpolatedKeys?: string[]
}

export interface EnvSyntaxError {
  lineNumber: number
  message: string
  snippet: string
}

export interface ParseEnvResult {
  tokens: EnvToken[]
  keyCount: number
  syntaxErrors: EnvSyntaxError[]
}
