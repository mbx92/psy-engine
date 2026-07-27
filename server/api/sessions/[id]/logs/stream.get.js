import { eq, asc, and, gt } from 'drizzle-orm'
import { createEventStream } from 'h3'
import { sessionLogs } from '~~/db/schema/sessionLogs'
import { sessions } from '~~/db/schema/sessions'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { subscribeSessionEvents } from '~~/server/utils/sessionLogBus'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)

  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const after = typeof query.after === 'string' && query.after ? new Date(query.after) : null
  const db = useDB()

  const [session] = await db.select({
    id: sessions.id,
    status: sessions.status,
    answers: sessions.answers,
    lastActivity: sessions.lastActivity,
  }).from(sessions).where(eq(sessions.id, id)).limit(1)

  if (!session) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  const conditions = [eq(sessionLogs.sessionId, id)]
  if (after && !Number.isNaN(after.getTime())) {
    conditions.push(gt(sessionLogs.createdAt, after))
  }

  const logs = await db.select().from(sessionLogs)
    .where(and(...conditions))
    .orderBy(asc(sessionLogs.createdAt))

  const snapshot = {
    logs,
    status: session.status,
    answeredCount: Object.keys(session.answers || {}).length,
    lastActivity: session.lastActivity,
    answers: session.answers || {},
  }

  const stream = createEventStream(event)

  let closed = false
  let heartbeat = null
  let unsub = () => {}

  async function push(eventName, data) {
    if (closed) return
    try {
      await stream.push({
        event: eventName,
        data: JSON.stringify(data),
      })
    } catch {
      cleanup()
    }
  }

  function cleanup() {
    if (closed) return
    closed = true
    unsub()
    if (heartbeat) clearInterval(heartbeat)
  }

  unsub = subscribeSessionEvents(id, (payload) => {
    if (payload.type === 'log') push('log', payload.log)
    else if (payload.type === 'progress') push('progress', payload)
    else push('event', payload)
  })

  heartbeat = setInterval(() => {
    push('ping', { t: Date.now() })
  }, 15000)

  stream.onClosed(() => cleanup())

  // Must not await push() before send() — TransformStream blocks without a reader
  setTimeout(() => {
    push('snapshot', snapshot)
  }, 0)

  return stream.send()
})
