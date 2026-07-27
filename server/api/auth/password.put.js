import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'
import { validateBody, passwordChangeSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const body = await readBody(event)
  const { currentPassword, newPassword } = validateBody(passwordChangeSchema, body)

  const db = useDB()

  const [user] = await db.select({ passwordHash: users.passwordHash })
    .from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const valid = await comparePassword(currentPassword, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 400, message: 'Current password is incorrect' })
  }

  const passwordHash = await hashPassword(newPassword)
  await db.update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId))

  return { message: 'Password updated successfully' }
})
