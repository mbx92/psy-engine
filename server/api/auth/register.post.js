import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'
import { getRolePermissionKeys } from '~~/server/utils/permissions'
import { validateBody, registerSchema } from '~~/server/utils/validation'
import { checkRateLimit } from '~~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { key: 'register', max: 5, windowMs: 60 * 60 * 1000 })

  const body = await readBody(event)
  const { email, password, name } = validateBody(registerSchema, body)

  const db = useDB()

  // Check if email already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const passwordHash = await hashPassword(password)

  const [user] = await db.insert(users).values({
    email,
    name,
    passwordHash,
    role: 'admin',
  }).returning()

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  const permissions = await getRolePermissionKeys(user.role)

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
    },
  }
})
