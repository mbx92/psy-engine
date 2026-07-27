import { users } from '~~/db/schema/users'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, name } = body || {}

  if (!email || !password || !name) {
    throw createError({ statusCode: 400, message: 'Email, password, and name are required' })
  }

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

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
})
