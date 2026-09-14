export default defineEventHandler(async (event) => {
  // Skip auth for non-API routes
  if (!event.path?.startsWith('/api/')) return

  const method = event.method?.toLowerCase() || 'get'
  const path = event.path.split('?')[0]

  // Public: auth endpoints
  if (['/api/auth/login', '/api/auth/register'].some(p => path === p)) return

  // Public: health / readiness (Coolify, Docker, load balancers)
  if (method === 'get' && (path === '/api/health' || path.startsWith('/api/health?'))) return

  // Test definitions are staff-only; participants use their session link.

  // Public: token-based test-taking flow (participant is not a logged-in user)
  if (path.startsWith('/api/sessions/token/')) return

  // Public: open invitation claim flow (biodata → mint session)
  if (path.startsWith('/api/open-invitations/token/')) return

  // Public: psikogram share links (no login)
  if (method === 'get' && path.startsWith('/api/public/psikograms/')) return

  // Public: app branding (login page / favicon chrome)
  if (method === 'get' && (path === '/api/public/app-settings' || path.startsWith('/api/public/app-settings?'))) return

  // Protected: everything else needs auth
  const token = getTokenFromEvent(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }

  // Attach user info to event context
  const auth = await resolveAuthSession(payload)
  if (!auth) throw createError({ statusCode: 401, message: 'Session expired or revoked' })
  event.context.auth = auth
})
