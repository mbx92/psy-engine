import { sessions } from '~~/db/schema/sessions'
import { testTypes } from '~~/db/schema/testTypes'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { buildPapiScores, analyzePapiScoresToPsikogram, analysisToSections } from '~~/server/utils/psikogramAnalyzer'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.PSIKOGRAMS_READ)

  const sessionId = getRouterParam(event, 'sessionId')
  if (!sessionId || !UUID_PATTERN.test(sessionId)) {
    throw createError({ statusCode: 400, message: 'Valid session ID required' })
  }

  const db = useDB()
  const [row] = await db.select({
    id: sessions.id,
    scores: sessions.scores,
    testTypeSlug: testTypes.slug,
    questions: testTypes.questions,
  })
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  if (row.scores?.status === 'failed' || row.scores?.raw?.error) throw createError({ statusCode: 409, message: 'Scoring must succeed before analysis' })
  if (row.testTypeSlug !== 'papi-kostick') {
    return { analyzed: false, reason: 'Automatic aspect analysis is only available for PAPI Kostick sessions', sections: null }
  }

  const raw = row.scores?.raw || row.scores?.dimensions || {}
  if (!Object.keys(raw).length) {
    return { analyzed: false, reason: 'Session has no computed scores yet', sections: null }
  }

  const papiScores = buildPapiScores(raw, row.questions)
  const analysis = analyzePapiScoresToPsikogram(papiScores)
  const sections = analysisToSections(analysis)

  return {
    analyzed: true,
    overallPercent: analysis.overallPercent,
    overallRating: analysis.overallRating,
    sectionSummary: {
      kecerdasan: analysis.kecerdasan.overallPercent,
      sikapKerja: analysis.sikapKerja.overallPercent,
      kepribadian: analysis.kepribadian.overallPercent,
      kemampuanBelajar: analysis.kemampuanBelajar.overallPercent,
    },
    sections,
  }
})
