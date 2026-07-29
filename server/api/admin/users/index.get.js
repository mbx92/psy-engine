import { users } from '~~/db/schema/users'
import { ne } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.USERS_READ)
  const db = useDB()

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users)
    .where(ne(users.role, 'superadmin'))
    .orderBy(users.createdAt)

  return { users: allUsers }
})
