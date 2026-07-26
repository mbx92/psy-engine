import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const body = await readBody(event)
  const { name, email } = body || {}

  if (!name && !email) {
    throw createError({ statusCode: 400, message: 'Nothing to update' })
  }

  const db = useDB()

  // Check email uniqueness if changing
  if (email) {
    const existing = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, email)).limit(1)
    if (existing.length && existing[0].id !== userId) {
      throw createError({ statusCode: 409, message: 'Email already in use' })
    }
  }

  const updateData: Record<string, any> = {}
  if (name) updateData.name = name
  if (email) updateData.email = email
  updateData.updatedAt = new Date()

  const [updated] = await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role })

  return { user: updated }
})
