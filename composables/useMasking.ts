/**
 * Client-Side Web Crypto SHA-256 Fingerprinting
 * Allows zero-knowledge verification of cross-stage parity without exposing secrets in DOM.
 */
export function useMasking() {
  async function computeSha256(plaintext: string): Promise<string> {
    if (!plaintext) return ''
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(plaintext)
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      } catch (err) {
        console.warn('WebCrypto digest failed:', err)
      }
    }
    return ''
  }

  function formatTruncatedHash(hash: string): string {
    if (!hash || hash.length < 12) return 'sha256:empty'
    return `sha256:${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  return {
    computeSha256,
    formatTruncatedHash,
  }
}
