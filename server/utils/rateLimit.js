import { createError, getRequestIP, setHeader } from 'h3'
import { getRateLimitSettings } from './rateLimitSettings'
import { consumeRateLimit } from './rateLimitWindow.js'

// Counters are per Nitro process. Multiple replicas need a shared counter store.
const buckets = new Map()
export async function checkRateLimit(event, key) {
  const { settings, revision } = await getRateLimitSettings()
  const policy = settings[key]
  if (!policy) throw new Error('Unknown rate limit policy')
  if (!policy.enabled) return
  const ip = getRequestIP(event, { xForwardedFor: process.env.TRUST_PROXY === 'true' }) || 'unknown'
  const result = consumeRateLimit(buckets, `${revision}:${key}:${ip}`, policy)
  if (!result.allowed) {
    setHeader(event, 'Retry-After', String(result.retryAfter))
    throw createError({ statusCode: 429, message: `Terlalu banyak percobaan. Coba lagi dalam ${result.retryAfter} detik.`, data: { retryAfter: result.retryAfter } })
  }
}
