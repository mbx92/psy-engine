import { eq, inArray } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { testTypes } from '~~/db/schema/testTypes'

/**
 * Resolve multi-test battery progress from a session's metadata.
 * Returns null if session is not part of a battery.
 */
export async function getBatteryProgress(db, session) {
  const meta = session?.metadata || {}
  const tokens = Array.isArray(meta.batteryTokens) ? meta.batteryTokens.filter(Boolean) : []
  if (!tokens.length) return null

  const rows = await db
    .select({
      id: sessions.id,
      token: sessions.token,
      status: sessions.status,
      testTypeName: testTypes.name,
      testTypeSlug: testTypes.slug,
    })
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .where(inArray(sessions.token, tokens))

  const byToken = new Map(rows.map((r) => [r.token, r]))
  const items = tokens.map((token, index) => {
    const row = byToken.get(token)
    return {
      index,
      token,
      status: row?.status || 'pending',
      testTypeName: row?.testTypeName || `Tes ${index + 1}`,
      testTypeSlug: row?.testTypeSlug || null,
      takePath: `/take/${token}`,
    }
  })

  const currentIndex = items.findIndex((i) => i.token === session.token)
  const next = items.find((i) => ['pending', 'in_progress'].includes(i.status))
  const completedCount = items.filter((i) => ['completed', 'verified'].includes(i.status)).length
  const allDone = items.every((i) => ['completed', 'verified', 'abandoned'].includes(i.status))
  const packageComplete = items.every((i) => ['completed', 'verified'].includes(i.status))

  return {
    batteryId: meta.batteryId || null,
    openInvitationToken: meta.openInvitationToken || null,
    joinPath: meta.openInvitationToken ? `/join/${meta.openInvitationToken}` : null,
    currentIndex: currentIndex >= 0 ? currentIndex : (meta.batteryIndex ?? 0),
    total: items.length,
    completedCount,
    allDone,
    packageComplete,
    nextTakePath: next && next.token !== session.token ? next.takePath : null,
    nextTestName: next && next.token !== session.token ? next.testTypeName : null,
    items,
  }
}
