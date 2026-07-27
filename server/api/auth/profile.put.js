import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'
import { getRolePermissionKeys } from '~~/server/utils/permissions'
import { validateBody, profileUpdateSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const body = await readBody(event)
  const { name, email } = validateBody(profileUpdateSchema, body)

  const db = useDB()

  // Check email uniqueness if changing
  if (email) {
    const existing = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, email)).limit(1)
    if (existing.length && existing[0].id !== userId) {
      throw createError({ statusCode: 409, message: 'Email already in use' })
    }
  }

  const updateData = {}
  if (name) updateData.name = name
  if (email) updateData.email = email
  updateData.updatedAt = new Date()

  const [updated] = await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role })

  const permissions = await getRolePermissionKeys(updated.role)

  return { user: { ...updated, permissions } }
})
