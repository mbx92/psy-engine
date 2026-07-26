import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const db = useDB()

  const [user] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return { user }
})
