import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, userCreateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.USERS_CREATE)

  const body = await readBody(event)
  const { email, password, name, role } = validateBody(userCreateSchema, body)

  const db = useDB()

  // Check email uniqueness
  const existing = await db.select({ id: users.id }).from(users)
    .where(eq(users.email, email)).limit(1)
  if (existing.length) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const passwordHash = await hashPassword(password)

  const [user] = await db.insert(users).values({
    email,
    name,
    passwordHash,
    role: role || 'admin',
  }).returning({ id: users.id, email: users.email, name: users.name, role: users.role, isActive: users.isActive })

  return { user }
})
