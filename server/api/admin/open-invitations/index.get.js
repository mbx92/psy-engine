import { desc, eq, inArray } from 'drizzle-orm'
import { openInvitations, resolveInvitationTestTypeIds } from '~~/db/schema/openInvitations'
import { testTypes } from '~~/db/schema/testTypes'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SESSIONS_READ)

  const db = useDB()
  const rows = await db
    .select({
      id: openInvitations.id,
      testTypeId: openInvitations.testTypeId,
      testTypeIds: openInvitations.testTypeIds,
      testTypeName: testTypes.name,
      token: openInvitations.token,
      label: openInvitations.label,
      isActive: openInvitations.isActive,
      maxUses: openInvitations.maxUses,
      useCount: openInvitations.useCount,
      expiresAt: openInvitations.expiresAt,
      createdAt: openInvitations.createdAt,
    })
    .from(openInvitations)
    .innerJoin(testTypes, eq(openInvitations.testTypeId, testTypes.id))
    .orderBy(desc(openInvitations.createdAt))

  const allIds = [...new Set(rows.flatMap((r) => resolveInvitationTestTypeIds(r)))]
  const nameMap = new Map()
  if (allIds.length) {
    const tests = await db.select({ id: testTypes.id, name: testTypes.name })
      .from(testTypes)
      .where(inArray(testTypes.id, allIds))
    for (const t of tests) nameMap.set(t.id, t.name)
  }

  return {
    invitations: rows.map((row) => {
      const ids = resolveInvitationTestTypeIds(row)
      const names = ids.map((id) => nameMap.get(id)).filter(Boolean)
      return {
        ...row,
        testTypeNames: names,
        testTypeName: names.join(', ') || row.testTypeName,
        testCount: ids.length,
        invitationPath: `/join/${row.token}`,
      }
    }),
  }
})
