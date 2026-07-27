/**
 * Simple in-memory fixed-window rate limiter, keyed by client IP + a caller-supplied
 * key namespace. Good enough for a single Nitro process; if this app ever runs
 * behind multiple instances, this needs to move to a shared store (Redis etc).
 */

const buckets = new Map()

function pruneExpired(now) {
  for (const [k, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(k)
  }
}

/**
 * Throws a 429 if the caller has exceeded `max` requests within `windowMs`
 * for the given `key` namespace. Call once near the top of a handler.
 */
export function checkRateLimit(event, { key, max, windowMs }) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const bucketKey = `${key}:${ip}`
  const now = Date.now()

  if (buckets.size > 1000) pruneExpired(now)

  let bucket = buckets.get(bucketKey)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(bucketKey, bucket)
  }

  bucket.count++
  if (bucket.count > max) {
    throw createError({ statusCode: 429, message: 'Too many attempts, please try again later' })
  }
}
