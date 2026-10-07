const PRIVATE_HOST_RE = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$/i

export function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGINS || '*'
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export function isOriginAllowed(origin, rules = parseCorsOrigins()) {
  if (!origin) return false
  if (!rules.length || rules.includes('*')) return true

  let hostname = ''
  try {
    hostname = new URL(origin).hostname
  } catch {
    return false
  }

  return rules.some((rule) => {
    if (rule === '*' || rule === origin) return true
    if (rule.startsWith('*.')) {
      const suffix = rule.slice(1)
      return hostname === rule.slice(2) || hostname.endsWith(suffix)
    }
    try {
      return new URL(rule).origin === origin
    } catch {
      return rule === hostname
    }
  })
}

export function isPrivateHost(host = '') {
  return PRIVATE_HOST_RE.test(String(host).split(',')[0].trim())
}
