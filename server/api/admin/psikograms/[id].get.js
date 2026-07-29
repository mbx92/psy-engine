import { psikograms } from '~~/db/schema/psikograms'
import { participants } from '~~/db/schema/participants'
import { users } from '~~/db/schema/users'
import { sessions } from '~~/db/schema/sessions'
import { testTypes } from '~~/db/schema/testTypes'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PSIKOGRAMS_READ)

  const id = getRouterParam(event, 'id')
  if (!id || !UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid psikogram ID required' })
  }

  const db = useDB()

  const [row] = await db.select({
    id: psikograms.id,
    participantId: psikograms.participantId,
    sessionId: psikograms.sessionId,
    examDate: psikograms.examDate,
    participant: psikograms.participant,
    sections: psikograms.sections,
    recommendation: psikograms.recommendation,
    status: psikograms.status,
    notes: psikograms.notes,
    publicToken: psikograms.publicToken,
    publicTokenExpiry: psikograms.publicTokenExpiry,
    createdAt: psikograms.createdAt,
    updatedAt: psikograms.updatedAt,
    examinerId: users.id,
    examinerName: users.name,
    examinerEmail: users.email,
    currentParticipantName: participants.name,
    currentParticipantEmail: participants.email,
    currentParticipantPhone: participants.phone,
    currentParticipantBirthDate: participants.birthDate,
    currentParticipantGender: participants.gender,
  })
    .from(psikograms)
    .innerJoin(users, eq(psikograms.examinerId, users.id))
    .innerJoin(participants, eq(psikograms.participantId, participants.id))
    .where(eq(psikograms.id, id))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, message: 'Psikogram not found' })
  }

  let session = null
  if (row.sessionId) {
    const [s] = await db.select({
      id: sessions.id,
      status: sessions.status,
      completedAt: sessions.completedAt,
      verifiedAt: sessions.verifiedAt,
      testTypeId: testTypes.id,
      testTypeName: testTypes.name,
      testTypeSlug: testTypes.slug,
    })
      .from(sessions)
      .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
      .where(eq(sessions.id, row.sessionId))
      .limit(1)
    session = s || null
  }

  return {
    psikogram: {
      id: row.id,
      participantId: row.participantId,
      sessionId: row.sessionId,
      examDate: row.examDate,
      // Merge current participant data over the stored snapshot so edits to
      // the participant record (e.g. corrected phone) show up here too.
      participant: {
        ...row.participant,
        name: row.currentParticipantName,
        email: row.currentParticipantEmail,
        phone: row.currentParticipantPhone,
        birthDate: row.currentParticipantBirthDate,
        gender: row.currentParticipantGender,
      },
      sections: row.sections,
      recommendation: row.recommendation,
      status: row.status,
      notes: row.notes,
      publicToken: row.publicToken,
      publicTokenExpiry: row.publicTokenExpiry,
      examiner: { id: row.examinerId, name: row.examinerName, email: row.examinerEmail },
      session,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  }
})
