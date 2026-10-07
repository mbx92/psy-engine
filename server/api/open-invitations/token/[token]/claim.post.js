import { randomUUID } from 'node:crypto'
import { eq, sql, inArray } from 'drizzle-orm'
import { openInvitations, resolveInvitationTestTypeIds } from '~~/db/schema/openInvitations'
import { testTypes } from '~~/db/schema/testTypes'
import { participants } from '~~/db/schema/participants'
import { sessions } from '~~/db/schema/sessions'
import { logSessionEvent } from '~~/server/utils/sessionLifecycle'
import { checkRateLimit } from '~~/server/utils/rateLimit'
import { validateBody, openInvitationClaimSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await checkRateLimit(event, 'invitationClaim')

  const token = getRouterParam(event, 'token')
  const body = await readBody(event)
  const biodata = validateBody(openInvitationClaimSchema, body)

  return useDB().transaction(async (db) => {

  const [invitation] = await db
    .select()
    .from(openInvitations)
    .where(eq(openInvitations.token, token))
    .limit(1).for('update')

  if (!invitation || !invitation.isActive) {
    throw createError({ statusCode: 404, message: 'Link undangan tidak valid atau sudah dinonaktifkan' })
  }
  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    throw createError({ statusCode: 410, message: 'Link undangan sudah kedaluwarsa' })
  }
  if (invitation.maxUses != null && invitation.useCount >= invitation.maxUses) {
    throw createError({ statusCode: 410, message: 'Kuota link undangan sudah penuh' })
  }

  const testTypeIds = resolveInvitationTestTypeIds(invitation)
  if (!testTypeIds.length) {
    throw createError({ statusCode: 400, message: 'Undangan tidak memiliki jenis tes' })
  }

  const tests = await db.select({ id: testTypes.id, name: testTypes.name, isActive: testTypes.isActive })
    .from(testTypes)
    .where(inArray(testTypes.id, testTypeIds))

  if (tests.length !== testTypeIds.length) {
    throw createError({ statusCode: 404, message: 'Satu atau lebih jenis tes tidak ditemukan' })
  }
  if (tests.some((t) => !t.isActive)) {
    throw createError({ statusCode: 400, message: 'Satu atau lebih tes sedang tidak aktif' })
  }

  const orderedTests = testTypeIds.map((id) => tests.find((t) => t.id === id)).filter(Boolean)

  const [participant] = await db.insert(participants).values({
    name: biodata.name,
    birthDate: biodata.birthDate,
    gender: biodata.gender,
    phone: biodata.phone || null,
    email: biodata.email || null,
    nik: biodata.nik || null,
  }).returning()

  const batteryId = randomUUID()
  const sessionTokens = orderedTests.map(() => randomUUID())

  const createdSessions = []
  for (let i = 0; i < orderedTests.length; i++) {
    const test = orderedTests[i]
    const sessionToken = sessionTokens[i]
    const [session] = await db.insert(sessions).values({
      testTypeId: test.id,
      participantId: participant.id,
      token: sessionToken,
      status: 'pending',
      metadata: {
        source: 'open_invitation',
        openInvitationId: invitation.id,
        openInvitationToken: invitation.token,
        batteryId,
        batteryIndex: i,
        batteryTotal: orderedTests.length,
        batteryTokens: sessionTokens,
      },
    }).returning()

    createdSessions.push(session)
    await logSessionEvent(
      db,
      session.id,
      'session_created',
      orderedTests.length > 1
        ? `Session ${i + 1}/${orderedTests.length} claimed via public invitation (${test.name})`
        : 'Session claimed via public invitation link',
      { openInvitationId: invitation.id, participantId: participant.id, batteryId, batteryIndex: i },
    )
  }

  await db.update(openInvitations)
    .set({
      useCount: sql`${openInvitations.useCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(openInvitations.id, invitation.id))

  const first = createdSessions[0]
  return {
    sessionId: first.id,
    participantId: participant.id,
    invitationPath: `/take/${first.token}`,
    battery: {
      id: batteryId,
      total: orderedTests.length,
      tests: orderedTests.map((t, i) => ({
        name: t.name,
        takePath: `/take/${sessionTokens[i]}`,
        index: i,
      })),
    },
  }
  })
})
