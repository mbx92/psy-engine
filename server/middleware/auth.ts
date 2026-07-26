export default defineEventHandler((event) => {
  // Skip auth for non-API routes
  if (!event.path?.startsWith('/api/')) return

  const method = event.method?.toLowerCase() || 'get'
  const path = event.path

  // Public: auth endpoints
  if (['/api/auth/login', '/api/auth/register'].some(p => path === p)) return

  // Public: GET test listing and detail
  if (method === 'get' && path.startsWith('/api/tests')) return

  // Public: POST submit test answers
  if (method === 'post' && path.match(/^\/api\/tests\/[\w-]+\/submit$/)) return

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
  event.context.auth = payload
})
