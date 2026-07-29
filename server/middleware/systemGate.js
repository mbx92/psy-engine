import { getSystemFlags, isSuperadminRole } from '~~/server/utils/systemFlags'

/**
 * Enforce maintenance / lock after auth middleware.
 * Only superadmin may use the API while locked or in maintenance.
 * Exceptions: login/register (handler checks role) and public app-settings (banner/branding).
 */
export default defineEventHandler(async (event) => {
  if (!event.path?.startsWith('/api/')) return

  const path = event.path
  const method = (event.method || 'GET').toLowerCase()

  // Login handler enforces lock/maintenance per role (superadmin may still sign in)
  if (path === '/api/auth/login' || path === '/api/auth/register') return

  // Public branding + status flags for login / take / join pages
  if (method === 'get' && path.startsWith('/api/public/app-settings')) return

  const auth = event.context.auth
  if (auth && isSuperadminRole(auth.role)) return

  const flags = await getSystemFlags()

  if (!flags.systemLocked && !flags.maintenanceMode) return

  // Allow profile read so a mid-session staff UI can still detect the state / logout
  if (method === 'get' && path === '/api/auth/me') return

  if (flags.systemLocked) {
    throw createError({
      statusCode: 503,
      message: 'System access is currently locked. Please contact the administrator.',
      data: { code: 'SYSTEM_LOCKED' },
    })
  }

  throw createError({
    statusCode: 503,
    message: flags.maintenanceMessage || 'System is under maintenance. Please try again later.',
    data: { code: 'MAINTENANCE_MODE' },
  })
})
