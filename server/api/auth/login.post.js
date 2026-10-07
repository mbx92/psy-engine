import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'
import { getRolePermissionKeys } from '~~/server/utils/permissions'
import { validateBody, loginSchema } from '~~/server/utils/validation'
import { checkRateLimit } from '~~/server/utils/rateLimit'
import { getSystemFlags, isSuperadminRole } from '~~/server/utils/systemFlags'
import { logActivity } from '~~/server/utils/activityLog'
import { getRequestHeader, getRequestIP } from 'h3'

export default defineEventHandler(async (event) => {
  await checkRateLimit(event, 'login')

  const body = await readBody(event)
  const { email, password } = validateBody(loginSchema, body)

  const db = useDB()
  const ip = getRequestIP(event, { xForwardedFor: true }) || null
  const userAgent = getRequestHeader(event, 'user-agent') || null

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user.length) {
    await logActivity({
      action: 'auth.login_failed',
      category: 'auth',
      level: 'warning',
      message: `Failed sign-in attempt for ${email} (user not found)`,
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 401,
      actorEmail: email,
      ip,
      userAgent,
    })
    event.context._activityLogged = true
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const valid = await comparePassword(password, user[0].passwordHash)
  if (!valid) {
    await logActivity({
      action: 'auth.login_failed',
      category: 'auth',
      level: 'warning',
      message: `Failed sign-in attempt for ${email} (invalid password)`,
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 401,
      actorUserId: user[0].id,
      actorEmail: user[0].email,
      actorName: user[0].name,
      actorRole: user[0].role,
      ip,
      userAgent,
    })
    event.context._activityLogged = true
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  if (!user[0].isActive) {
    await logActivity({
      action: 'auth.login_failed',
      category: 'auth',
      level: 'warning',
      message: `Failed sign-in attempt for ${email} (account deactivated)`,
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 403,
      actorUserId: user[0].id,
      actorEmail: user[0].email,
      actorName: user[0].name,
      actorRole: user[0].role,
      ip,
      userAgent,
    })
    event.context._activityLogged = true
    throw createError({ statusCode: 403, message: 'Account is deactivated' })
  }

  const flags = await getSystemFlags()
  const isGod = isSuperadminRole(user[0].role)

  if (flags.systemLocked && !isGod) {
    await logActivity({
      action: 'auth.login_blocked',
      category: 'auth',
      level: 'warning',
      message: `Sign-in blocked for ${email} (system locked)`,
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 503,
      actorUserId: user[0].id,
      actorEmail: user[0].email,
      actorName: user[0].name,
      actorRole: user[0].role,
      ip,
      userAgent,
      metadata: { code: 'SYSTEM_LOCKED' },
    })
    event.context._activityLogged = true
    throw createError({
      statusCode: 503,
      message: 'System access is currently locked. Please contact the administrator.',
      data: { code: 'SYSTEM_LOCKED' },
    })
  }

  if (flags.maintenanceMode && !isGod) {
    await logActivity({
      action: 'auth.login_blocked',
      category: 'auth',
      level: 'warning',
      message: `Sign-in blocked for ${email} (maintenance mode)`,
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 503,
      actorUserId: user[0].id,
      actorEmail: user[0].email,
      actorName: user[0].name,
      actorRole: user[0].role,
      ip,
      userAgent,
      metadata: { code: 'MAINTENANCE_MODE' },
    })
    event.context._activityLogged = true
    throw createError({
      statusCode: 503,
      message: flags.maintenanceMessage || 'System is under maintenance. Please try again later.',
      data: { code: 'MAINTENANCE_MODE' },
    })
  }

  await createAuthSession(event, user[0])

  const permissions = await getRolePermissionKeys(user[0].role)

  await logActivity({
    action: 'auth.login',
    category: 'auth',
    level: 'info',
    message: `${user[0].name} signed in`,
    method: 'POST',
    path: '/api/auth/login',
    statusCode: 200,
    actorUserId: user[0].id,
    actorEmail: user[0].email,
    actorName: user[0].name,
    actorRole: user[0].role,
    ip,
    userAgent,
  })
  event.context._activityLogged = true

  return {
    user: {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      role: user[0].role,
      permissions,
    },
  }
})
