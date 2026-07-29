import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { buildAllReports, toCsv } from '~~/server/utils/reportBuilders'

function sendCsv(event, filename, headers, rows) {
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return toCsv(headers, rows)
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.REPORTS_READ)

  const db = useDB()
  const query = getQuery(event)
  const type = String(query.type || 'period').toLowerCase()
  const data = await buildAllReports(db, query)
  const stamp = new Date().toISOString().slice(0, 10)

  if (type === 'period' || type === 'period_summary') {
    return sendCsv(event, `report-period-${stamp}.csv`, ['day', 'total', 'completed', 'abandoned'], data.periodSummary.byDay.map((r) => ({
      day: r.day ? new Date(r.day).toISOString().slice(0, 10) : '',
      total: r.total,
      completed: r.completed,
      abandoned: r.abandoned,
    })))
  }

  if (type === 'completion') {
    return sendCsv(event, `report-completion-${stamp}.csv`, ['status', 'total', 'pct'], data.completion.byStatus)
  }

  if (type === 'corporate') {
    return sendCsv(
      event,
      `report-corporate-${stamp}.csv`,
      ['corporate', 'total', 'recommended', 'notRecommended', 'final', 'draft'],
      data.corporate.rows,
    )
  }

  if (type === 'psikogram' || type === 'psikogram_pipeline') {
    return sendCsv(
      event,
      `report-psikogram-${stamp}.csv`,
      ['id', 'participantName', 'corporate', 'status', 'recommendation', 'examDate', 'examinerName', 'createdAt'],
      data.psikogramPipeline.recentDrafts.map((r) => ({
        id: r.id,
        participantName: r.participantName,
        corporate: r.corporate || '',
        status: r.status,
        recommendation: r.recommendation || '',
        examDate: r.examDate || '',
        examinerName: r.examinerName || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
      })),
    )
  }

  if (type === 'scores' || type === 'score_distribution') {
    const rows = []
    for (const test of data.scoreDistribution.tests) {
      for (const [dim, stats] of Object.entries(test.dimensions || {})) {
        rows.push({
          testTypeName: test.testTypeName,
          sampleSize: test.sampleSize,
          dimension: dim,
          count: stats.count,
          avg: stats.avg,
          median: stats.median,
          min: stats.min,
          max: stats.max,
        })
      }
    }
    return sendCsv(
      event,
      `report-scores-${stamp}.csv`,
      ['testTypeName', 'sampleSize', 'dimension', 'count', 'avg', 'median', 'min', 'max'],
      rows,
    )
  }

  if (type === 'compare' || type === 'period_compare') {
    return sendCsv(
      event,
      `report-compare-${stamp}.csv`,
      ['metric', 'periodA', 'periodB', 'deltaPct'],
      data.periodCompare.metrics.map((m) => ({
        metric: m.label,
        periodA: m.a,
        periodB: m.b,
        deltaPct: m.deltaPct,
      })),
    )
  }

  if (type === 'invites' || type === 'public_links') {
    return sendCsv(
      event,
      `report-public-links-${stamp}.csv`,
      ['label', 'testTypeName', 'isActive', 'useCount', 'maxUses', 'remainingUses', 'createdAt', 'expiresAt'],
      data.publicLinks.links.map((l) => ({
        label: l.label || '',
        testTypeName: l.testTypeName,
        isActive: l.isActive,
        useCount: l.useCount,
        maxUses: l.maxUses ?? '',
        remainingUses: l.remainingUses ?? '',
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : '',
        expiresAt: l.expiresAt ? new Date(l.expiresAt).toISOString() : '',
      })),
    )
  }

  if (type === 'activity' || type === 'admin_activity') {
    return sendCsv(
      event,
      `report-activity-${stamp}.csv`,
      ['category', 'total', 'warnings', 'errors'],
      data.adminActivity.byCategory,
    )
  }

  if (type === 'workload' || type === 'examiner_workload') {
    return sendCsv(
      event,
      `report-workload-${stamp}.csv`,
      ['examinerName', 'examinerEmail', 'total', 'draft', 'final', 'recommended'],
      data.examinerWorkload.examiners,
    )
  }

  throw createError({ statusCode: 400, message: `Unknown export type: ${type}` })
})
