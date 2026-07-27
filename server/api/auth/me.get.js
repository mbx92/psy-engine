import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'
import { getRolePermissionKeys } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useDB()
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, auth.userId)).limit(1)

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const permissions = await getRolePermissionKeys(user.role)

  return { user: { ...user, permissions } }
})
