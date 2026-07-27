import { eq, inArray } from 'drizzle-orm'
import { openInvitations, resolveInvitationTestTypeIds } from '~~/db/schema/openInvitations'
import { testTypes } from '~~/db/schema/testTypes'

function assertClaimable(invitation) {
  if (!invitation || !invitation.isActive) {
    throw createError({ statusCode: 404, message: 'Link undangan tidak valid atau sudah dinonaktifkan' })
  }
  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    throw createError({ statusCode: 410, message: 'Link undangan sudah kedaluwarsa' })
  }
  if (invitation.maxUses != null && invitation.useCount >= invitation.maxUses) {
    throw createError({ statusCode: 410, message: 'Kuota link undangan sudah penuh' })
  }
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const db = useDB()

  const [invitation] = await db
    .select()
    .from(openInvitations)
    .where(eq(openInvitations.token, token))
    .limit(1)

  assertClaimable(invitation)

  const testTypeIds = resolveInvitationTestTypeIds(invitation)
  const tests = testTypeIds.length
    ? await db.select({
      id: testTypes.id,
      name: testTypes.name,
      description: testTypes.description,
      config: testTypes.config,
      isActive: testTypes.isActive,
    }).from(testTypes).where(inArray(testTypes.id, testTypeIds))
    : []

  if (!tests.length) {
    throw createError({ statusCode: 404, message: 'Jenis tes tidak ditemukan' })
  }
  if (tests.some((t) => !t.isActive)) {
    throw createError({ statusCode: 400, message: 'Satu atau lebih tes sedang tidak aktif' })
  }

  const ordered = testTypeIds.map((id) => tests.find((t) => t.id === id)).filter(Boolean)
  const primary = ordered[0]

  return {
    invitation: {
      token: invitation.token,
      label: invitation.label,
      expiresAt: invitation.expiresAt,
      remainingUses: invitation.maxUses == null ? null : Math.max(0, invitation.maxUses - invitation.useCount),
    },
    testType: {
      id: primary.id,
      name: primary.name,
      description: primary.description,
      timeLimit: primary.config?.timeLimit ?? null,
      instructions: primary.config?.instructions || [],
    },
    testTypes: ordered.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      timeLimit: t.config?.timeLimit ?? null,
    })),
  }
})
