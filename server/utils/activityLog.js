import { activityLogs } from '~~/db/schema/activityLogs'
import { getRequestHeader, getRequestIP, getResponseStatus } from 'h3'

const MUTED_PATH_PATTERNS = [
  /^\/api\/admin\/activity-logs/,
  /^\/api\/public\/app-settings/,
  /^\/api\/sessions\/token\/[^/]+\/answers$/,
  /\/logs\/stream$/,
]

const METHOD_ACTION = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
}

/**
 * Derive a stable category + action from an API path.
 * e.g. POST /api/admin/users → { category: 'users', action: 'users.create' }
 */
export function describeApiActivity(method, path) {
  const clean = String(path || '').split('?')[0]
  const parts = clean.replace(/^\/api\//, '').split('/').filter(Boolean)
  const verb = METHOD_ACTION[String(method || '').toUpperCase()] || String(method || 'request').toLowerCase()

  let category = 'other'
  let resource = parts[0] || 'api'

  if (parts[0] === 'admin' && parts[1]) {
    resource = parts[1]
    category = mapCategory(parts[1])
  } else if (parts[0] === 'auth') {
    category = 'auth'
    resource = 'auth'
  } else if (parts[0] === 'sessions') {
    category = 'sessions'
    resource = parts[1] === 'token' ? 'session_token' : 'sessions'
  } else if (parts[0] === 'open-invitations') {
    category = 'invitations'
    resource = 'open_invitations'
  } else if (parts[0] === 'participants') {
    category = 'participants'
    resource = 'participants'
  } else if (parts[0] === 'tests') {
    category = 'tests'
    resource = 'tests'
  } else if (parts[0] === 'public') {
    category = 'public'
    resource = parts[1] || 'public'
  } else {
    category = mapCategory(parts[0])
  }

  // Prefer last meaningful segment for action when it's a verb-like path
  const tail = parts[parts.length - 1]
  const special = ['login', 'register', 'claim', 'start', 'submit', 'rescore', 'share', 'backup', 'status']
  let actionKey = verb
  if (special.includes(tail)) actionKey = tail
  else if (parts.includes('token') && special.includes(tail)) actionKey = tail

  const action = `${resource.replace(/-/g, '_')}.${actionKey}`
  const resourceId = parts.find((p) => /^\d+$/.test(p) || /^[0-9a-f-]{36}$/i.test(p)) || null

  return {
    category,
    action,
    resourceType: resource.replace(/-/g, '_'),
    resourceId,
    message: `${String(method || '').toUpperCase()} ${clean}`,
  }
}

function mapCategory(segment) {
  const map = {
    users: 'users',
    'test-types': 'tests',
    tests: 'tests',
    participants: 'participants',
    sessions: 'sessions',
    psikograms: 'psikograms',
    'open-invitations': 'invitations',
    'app-settings': 'settings',
    'psychology-settings': 'settings',
    settings: 'settings',
    system: 'system',
    roles: 'rbac',
    permissions: 'rbac',
    rbac: 'rbac',
    'bulk-sessions': 'sessions',
    auth: 'auth',
  }
  return map[segment] || 'other'
}

export function shouldSkipActivityLog(method, path) {
  const m = String(method || '').toUpperCase()
  const p = String(path || '').split('?')[0]

  if (!p.startsWith('/api/')) return true
  if (MUTED_PATH_PATTERNS.some((re) => re.test(p))) return true

  // Skip noisy reads; still log mutating methods
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return true

  return false
}

export async function logActivity(entry = {}) {
  try {
    const db = useDB()
    const [row] = await db.insert(activityLogs).values({
      action: entry.action || 'unknown',
      category: entry.category || 'other',
      level: entry.level || 'info',
      message: entry.message || null,
      method: entry.method || null,
      path: entry.path || null,
      statusCode: entry.statusCode ?? null,
      actorUserId: entry.actorUserId ?? null,
      actorEmail: entry.actorEmail || null,
      actorName: entry.actorName || null,
      actorRole: entry.actorRole || null,
      resourceType: entry.resourceType || null,
      resourceId: entry.resourceId != null ? String(entry.resourceId) : null,
      ip: entry.ip || null,
      userAgent: entry.userAgent || null,
      metadata: entry.metadata || {},
    }).returning({ id: activityLogs.id })
    return row
  } catch (err) {
    // Never break the request because logging failed
    console.error('[activity-log]', err?.message || err)
    return null
  }
}

/** Build a log entry from an H3 event (used by the Nitro plugin). */
export function buildActivityFromEvent(event, { statusCode, errorMessage } = {}) {
  const method = event.method || 'GET'
  const path = event.path || ''
  if (shouldSkipActivityLog(method, path)) return null
  if (event.context?._activityLogged) return null

  const described = describeApiActivity(method, path)
  const auth = event.context?.auth
  const override = event.context?.activityLog || {}
  const code = statusCode ?? getResponseStatus(event) ?? 200

  let level = 'info'
  if (code >= 500) level = 'error'
  else if (code >= 400) level = 'warning'

  return {
    ...described,
    ...override,
    action: override.action || described.action,
    category: override.category || described.category,
    message: override.message || (errorMessage ? `${described.message} — ${errorMessage}` : described.message),
    method: String(method).toUpperCase(),
    path: path.split('?')[0],
    statusCode: code,
    level: override.level || level,
    actorUserId: override.actorUserId ?? auth?.userId ?? null,
    actorEmail: override.actorEmail ?? auth?.email ?? null,
    actorName: override.actorName ?? null,
    actorRole: override.actorRole ?? auth?.role ?? null,
    ip: getRequestIP(event, { xForwardedFor: true }) || null,
    userAgent: getRequestHeader(event, 'user-agent') || null,
    metadata: {
      ...(override.metadata || {}),
      ...(errorMessage ? { error: errorMessage } : {}),
    },
  }
}

export async function logEventActivity(event, extras = {}) {
  const entry = buildActivityFromEvent(event, extras)
  if (!entry) return null
  event.context._activityLogged = true
  return logActivity(entry)
}
