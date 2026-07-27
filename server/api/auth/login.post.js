import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body || {}

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  const db = useDB()

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user.length) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const valid = await comparePassword(password, user[0].passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  if (!user[0].isActive) {
    throw createError({ statusCode: 403, message: 'Account is deactivated' })
  }

  const token = signToken({
    userId: user[0].id,
    email: user[0].email,
    role: user[0].role,
  })

  return {
    token,
    user: {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      role: user[0].role,
    },
  }
})
