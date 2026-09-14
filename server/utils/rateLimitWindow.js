export function consumeRateLimit(buckets, key, policy, now = Date.now()) {
  if (!policy.enabled) return { allowed: true, retryAfter: 0 }
  if (buckets.size > 1000) {
    for (const [id, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(id)
  }
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + policy.windowMinutes * 60000 }
    buckets.set(key, bucket)
  }
  bucket.count++
  return { allowed: bucket.count <= policy.max, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
}
