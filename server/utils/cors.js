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

function hostnameOf(value = '') {
  const raw = String(value).split(',')[0].trim()
  if (!raw) return ''
  try {
    return new URL(raw.includes('://') ? raw : `http://${raw}`).hostname.toLowerCase()
  } catch {
    return raw.split(':')[0].toLowerCase()
  }
}

/**
 * CSRF-style origin check that still works behind Cloudflare Tunnel
 * (public https Origin vs http://LAN_IP:port Host).
 */
export function isTrustedBrowserOrigin(event, origin) {
  if (!origin) return true

  let originHost = ''
  try {
    originHost = new URL(origin).hostname.toLowerCase()
  } catch {
    return false
  }

  const appOrigin = process.env.APP_ORIGIN?.replace(/\/$/, '')
  if (appOrigin && origin === appOrigin) return true
  if (appOrigin && hostnameOf(appOrigin) === originHost) return true

  const rules = parseCorsOrigins().filter((rule) => rule !== '*')
  if (rules.length && isOriginAllowed(origin, rules)) return true

  const hosts = [
    getHeader(event, 'host'),
    getHeader(event, 'x-forwarded-host'),
  ].map(hostnameOf).filter(Boolean)

  return hosts.includes(originHost)
}
