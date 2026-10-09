import { asc, eq, inArray } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { testTypes } from '~~/db/schema/testTypes'

const OPEN = new Set(['pending', 'in_progress'])
const DONE = new Set(['completed', 'verified'])
const ENDED = new Set(['completed', 'verified', 'abandoned'])

function itemFromRow(row, index) {
  return {
    index,
    token: row.token,
    status: row.status || 'pending',
    testTypeName: row.testTypeName || `Tes ${index + 1}`,
    testTypeSlug: row.testTypeSlug || null,
    takePath: `/take/${row.token}`,
  }
}

function pickBestByTest(rows) {
  const rank = (status) => {
    if (status === 'in_progress') return 0
    if (status === 'pending') return 1
    if (DONE.has(status)) return 2
    return 3
  }
  const byTest = new Map()
  for (const row of rows) {
    const key = row.testTypeId || row.testTypeSlug || row.token
    const prev = byTest.get(key)
    if (!prev || rank(row.status) < rank(prev.status) || (rank(row.status) === rank(prev.status) && new Date(row.createdAt || 0) > new Date(prev.createdAt || 0))) {
      byTest.set(key, row)
    }
  }
  return [...byTest.values()]
}

/**
 * Resolve multi-test battery progress from a session's metadata,
 * or from other sessions belonging to the same participant.
 */
export async function getBatteryProgress(db, session) {
  if (!session) return null
  const meta = session.metadata || {}
  const tokens = Array.isArray(meta.batteryTokens) ? meta.batteryTokens.filter(Boolean) : []

  const rows = await db
    .select({
      id: sessions.id,
      token: sessions.token,
      status: sessions.status,
      createdAt: sessions.createdAt,
      participantId: sessions.participantId,
      testTypeId: sessions.testTypeId,
      testTypeName: testTypes.name,
      testTypeSlug: testTypes.slug,
      metadata: sessions.metadata,
    })
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .where(
      session.participantId
        ? eq(sessions.participantId, session.participantId)
        : tokens.length
          ? inArray(sessions.token, tokens)
          : eq(sessions.id, session.id),
    )
    .orderBy(asc(sessions.createdAt))

  if (!rows.length) return null

  const batteryId = meta.batteryId || null
  const scoped = batteryId
    ? rows.filter((r) => r.metadata?.batteryId === batteryId || r.token === session.token)
    : rows

  const best = pickBestByTest(scoped)
  const bestByTest = new Map(best.map((row) => [row.testTypeId, row]))
  const ordered = []
  const seenTests = new Set()

  for (const token of tokens) {
    const original = scoped.find((row) => row.token === token)
    const chosen = original ? bestByTest.get(original.testTypeId) : null
    if (!chosen || seenTests.has(chosen.testTypeId)) continue
    seenTests.add(chosen.testTypeId)
    ordered.push(chosen)
  }

  for (const row of best) {
    if (seenTests.has(row.testTypeId)) continue
    seenTests.add(row.testTypeId)
    ordered.push(row)
  }

  if (!ordered.length) return null

  const items = ordered.map((row, index) => itemFromRow(row, index))
  const currentIndex = items.findIndex((i) => i.token === session.token)
  let next = items.find((i) => OPEN.has(i.status) && i.token !== session.token)

  if (!next && session.participantId) {
    const openRows = rows.filter((r) => OPEN.has(r.status) && r.token !== session.token)
    if (openRows[0]) next = itemFromRow(openRows[0], items.length)
  }

  const completedCount = items.filter((i) => DONE.has(i.status)).length
  const allDone = items.every((i) => ENDED.has(i.status)) && !next
  const packageComplete = items.every((i) => DONE.has(i.status)) && !next

  if (items.length < 2 && !next) return null

  return {
    batteryId,
    openInvitationToken: meta.openInvitationToken || null,
    joinPath: meta.openInvitationToken ? `/join/${meta.openInvitationToken}` : null,
    currentIndex: currentIndex >= 0 ? currentIndex : (meta.batteryIndex ?? 0),
    total: Math.max(items.length, next && !items.some((i) => i.token === next.token) ? items.length + 1 : items.length),
    completedCount,
    allDone,
    packageComplete,
    nextTakePath: next ? next.takePath : null,
    nextTestName: next ? next.testTypeName : null,
    items: next && !items.some((i) => i.token === next.token) ? [...items, next] : items,
  }
}
