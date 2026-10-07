import { eq } from 'drizzle-orm'
import { authSessions } from '~~/db/schema/authSessions'
export default defineEventHandler(async event => {
  await useDB().delete(authSessions).where(eq(authSessions.id, event.context.auth.sid))
  clearAuthCookie(event)
  return { success: true }
})
