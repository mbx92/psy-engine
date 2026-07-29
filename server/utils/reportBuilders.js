import { and, count, desc, eq, gte, isNull, lte, ne, or, sql } from 'drizzle-orm'
import { sessions } from '~~/db/schema/sessions'
import { testTypes } from '~~/db/schema/testTypes'
import { psikograms } from '~~/db/schema/psikograms'
import { users } from '~~/db/schema/users'
import { openInvitations } from '~~/db/schema/openInvitations'
import { activityLogs } from '~~/db/schema/activityLogs'

export function parseDateRange(query = {}) {
  const to = query.to ? new Date(String(query.to)) : new Date()
  const from = query.from
    ? new Date(String(query.from))
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw createError({ statusCode: 400, message: 'Invalid date range' })
  }

  // Inclusive end-of-day for `to` when date-only (YYYY-MM-DD)
  const toInclusive = String(query.to || '').length <= 10
    ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)
    : to

  return { from, to: toInclusive }
}

function sessionDateFilter(from, to, testTypeId) {
  const conditions = [
    gte(sessions.createdAt, from),
    lte(sessions.createdAt, to),
  ]
  if (testTypeId) conditions.push(eq(sessions.testTypeId, testTypeId))
  return and(...conditions)
}

export async function buildPeriodSummary(db, { from, to, testTypeId }) {
  const where = sessionDateFilter(from, to, testTypeId)

  const byDay = await db
    .select({
      day: sql`date_trunc('day', ${sessions.createdAt})`.as('day'),
      total: count(),
      completed: sql`count(*) filter (where ${sessions.status} in ('completed', 'verified'))::int`,
      abandoned: sql`count(*) filter (where ${sessions.status} = 'abandoned')::int`,
    })
    .from(sessions)
    .where(where)
    .groupBy(sql`date_trunc('day', ${sessions.createdAt})`)
    .orderBy(sql`date_trunc('day', ${sessions.createdAt})`)

  const byTest = await db
    .select({
      testTypeId: sessions.testTypeId,
      testTypeName: testTypes.name,
      total: count(),
      completed: sql`count(*) filter (where ${sessions.status} in ('completed', 'verified'))::int`,
    })
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .where(where)
    .groupBy(sessions.testTypeId, testTypes.name)
    .orderBy(desc(count()))

  const [totals] = await db
    .select({
      sessions: count(),
      participants: sql`count(distinct ${sessions.participantId})::int`,
      completed: sql`count(*) filter (where ${sessions.status} in ('completed', 'verified'))::int`,
      verified: sql`count(*) filter (where ${sessions.status} = 'verified')::int`,
      abandoned: sql`count(*) filter (where ${sessions.status} = 'abandoned')::int`,
      inProgress: sql`count(*) filter (where ${sessions.status} = 'in_progress')::int`,
      pending: sql`count(*) filter (where ${sessions.status} = 'pending')::int`,
    })
    .from(sessions)
    .where(where)

  const psikogramWhere = and(
    gte(psikograms.createdAt, from),
    lte(psikograms.createdAt, to),
  )
  const [psikoTotals] = await db
    .select({
      total: count(),
      draft: sql`count(*) filter (where ${psikograms.status} = 'draft')::int`,
      final: sql`count(*) filter (where ${psikograms.status} = 'final')::int`,
    })
    .from(psikograms)
    .where(psikogramWhere)

  return {
    totals: {
      ...totals,
      psikograms: psikoTotals?.total || 0,
      psikogramDraft: psikoTotals?.draft || 0,
      psikogramFinal: psikoTotals?.final || 0,
    },
    byDay: byDay.map((r) => ({
      day: r.day,
      total: Number(r.total) || 0,
      completed: Number(r.completed) || 0,
      abandoned: Number(r.abandoned) || 0,
    })),
    byTest: byTest.map((r) => ({
      testTypeId: r.testTypeId,
      testTypeName: r.testTypeName,
      total: Number(r.total) || 0,
      completed: Number(r.completed) || 0,
    })),
  }
}

export async function buildCompletionReport(db, { from, to, testTypeId }) {
  const where = sessionDateFilter(from, to, testTypeId)

  const byStatus = await db
    .select({
      status: sessions.status,
      total: count(),
    })
    .from(sessions)
    .where(where)
    .groupBy(sessions.status)

  const durationRows = await db
    .select({
      status: sessions.status,
      avgMinutes: sql`avg(extract(epoch from (${sessions.completedAt} - ${sessions.startedAt})) / 60.0)`,
      medianMinutes: sql`percentile_cont(0.5) within group (order by extract(epoch from (${sessions.completedAt} - ${sessions.startedAt})) / 60.0)`,
    })
    .from(sessions)
    .where(and(
      where,
      sql`${sessions.startedAt} is not null`,
      sql`${sessions.completedAt} is not null`,
    ))
    .groupBy(sessions.status)

  const total = byStatus.reduce((s, r) => s + Number(r.total), 0)
  const completed = byStatus
    .filter((r) => ['completed', 'verified'].includes(r.status))
    .reduce((s, r) => s + Number(r.total), 0)
  const abandoned = byStatus.find((r) => r.status === 'abandoned')?.total || 0

  return {
    total,
    completed,
    abandoned: Number(abandoned) || 0,
    completionRate: total ? Math.round((completed / total) * 1000) / 10 : 0,
    abandonRate: total ? Math.round((Number(abandoned) / total) * 1000) / 10 : 0,
    byStatus: byStatus.map((r) => ({
      status: r.status,
      total: Number(r.total) || 0,
      pct: total ? Math.round((Number(r.total) / total) * 1000) / 10 : 0,
    })),
    durationByStatus: durationRows.map((r) => ({
      status: r.status,
      avgMinutes: r.avgMinutes != null ? Math.round(Number(r.avgMinutes) * 10) / 10 : null,
      medianMinutes: r.medianMinutes != null ? Math.round(Number(r.medianMinutes) * 10) / 10 : null,
    })),
  }
}

export async function buildCorporateReport(db, { from, to }) {
  const rows = await db
    .select({
      corporate: sql`coalesce(nullif(trim(${psikograms.participant}->>'corporate'), ''), 'Tanpa perusahaan')`,
      total: count(),
      recommended: sql`count(*) filter (where ${psikograms.recommendation} = 'recommended')::int`,
      notRecommended: sql`count(*) filter (where ${psikograms.recommendation} = 'not_recommended')::int`,
      final: sql`count(*) filter (where ${psikograms.status} = 'final')::int`,
      draft: sql`count(*) filter (where ${psikograms.status} = 'draft')::int`,
    })
    .from(psikograms)
    .where(and(gte(psikograms.createdAt, from), lte(psikograms.createdAt, to)))
    .groupBy(sql`coalesce(nullif(trim(${psikograms.participant}->>'corporate'), ''), 'Tanpa perusahaan')`)
    .orderBy(desc(count()))

  return {
    rows: rows.map((r) => ({
      corporate: r.corporate,
      total: Number(r.total) || 0,
      recommended: Number(r.recommended) || 0,
      notRecommended: Number(r.notRecommended) || 0,
      final: Number(r.final) || 0,
      draft: Number(r.draft) || 0,
    })),
  }
}

export async function buildPsikogramPipeline(db, { from, to }) {
  const where = and(gte(psikograms.createdAt, from), lte(psikograms.createdAt, to))

  const [totals] = await db
    .select({
      total: count(),
      draft: sql`count(*) filter (where ${psikograms.status} = 'draft')::int`,
      final: sql`count(*) filter (where ${psikograms.status} = 'final')::int`,
      recommended: sql`count(*) filter (where ${psikograms.recommendation} = 'recommended')::int`,
      notRecommended: sql`count(*) filter (where ${psikograms.recommendation} = 'not_recommended')::int`,
      noRecommendation: sql`count(*) filter (where ${psikograms.recommendation} is null or ${psikograms.recommendation} = '')::int`,
      shared: sql`count(*) filter (where ${psikograms.publicToken} is not null)::int`,
    })
    .from(psikograms)
    .where(where)

  const recentDrafts = await db
    .select({
      id: psikograms.id,
      status: psikograms.status,
      recommendation: psikograms.recommendation,
      examDate: psikograms.examDate,
      createdAt: psikograms.createdAt,
      participantName: sql`${psikograms.participant}->>'name'`,
      corporate: sql`${psikograms.participant}->>'corporate'`,
      examinerName: users.name,
    })
    .from(psikograms)
    .innerJoin(users, eq(psikograms.examinerId, users.id))
    .where(and(where, eq(psikograms.status, 'draft')))
    .orderBy(desc(psikograms.createdAt))
    .limit(20)

  return {
    totals: {
      total: Number(totals?.total) || 0,
      draft: Number(totals?.draft) || 0,
      final: Number(totals?.final) || 0,
      recommended: Number(totals?.recommended) || 0,
      notRecommended: Number(totals?.notRecommended) || 0,
      noRecommendation: Number(totals?.noRecommendation) || 0,
      shared: Number(totals?.shared) || 0,
    },
    recentDrafts: recentDrafts.map((r) => ({
      ...r,
      participantName: r.participantName || '—',
      corporate: r.corporate || null,
    })),
  }
}

export async function buildScoreDistribution(db, { from, to, testTypeId }) {
  const where = and(
    sessionDateFilter(from, to, testTypeId),
    sql`${sessions.status} in ('completed', 'verified')`,
    sql`${sessions.scores} is not null`,
  )

  const rows = await db
    .select({
      testTypeId: sessions.testTypeId,
      testTypeName: testTypes.name,
      scores: sessions.scores,
    })
    .from(sessions)
    .innerJoin(testTypes, eq(sessions.testTypeId, testTypes.id))
    .where(where)

  const byTest = new Map()

  for (const row of rows) {
    const dims = row.scores?.dimensions || {}
    if (!Object.keys(dims).length) continue
    if (!byTest.has(row.testTypeId)) {
      byTest.set(row.testTypeId, {
        testTypeId: row.testTypeId,
        testTypeName: row.testTypeName,
        sampleSize: 0,
        dimensions: {},
      })
    }
    const bucket = byTest.get(row.testTypeId)
    bucket.sampleSize += 1
    for (const [key, raw] of Object.entries(dims)) {
      const value = typeof raw === 'number' ? raw : Number(raw?.score ?? raw?.value ?? raw)
      if (!Number.isFinite(value)) continue
      if (!bucket.dimensions[key]) bucket.dimensions[key] = []
      bucket.dimensions[key].push(value)
    }
  }

  function stats(values) {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    const sum = sorted.reduce((s, v) => s + v, 0)
    const mid = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
    return {
      count: sorted.length,
      avg: Math.round((sum / sorted.length) * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    }
  }

  return {
    tests: [...byTest.values()].map((t) => ({
      testTypeId: t.testTypeId,
      testTypeName: t.testTypeName,
      sampleSize: t.sampleSize,
      dimensions: Object.fromEntries(
        Object.entries(t.dimensions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, values]) => [k, stats(values)]),
      ),
    })),
  }
}

export async function buildPeriodCompare(db, rangeA, rangeB, testTypeId) {
  const [a, b] = await Promise.all([
    buildPeriodSummary(db, { ...rangeA, testTypeId }),
    buildPeriodSummary(db, { ...rangeB, testTypeId }),
  ])
  const [ca, cb] = await Promise.all([
    buildCompletionReport(db, { ...rangeA, testTypeId }),
    buildCompletionReport(db, { ...rangeB, testTypeId }),
  ])

  function delta(curr, prev) {
    if (prev == null || prev === 0) return curr ? 100 : 0
    return Math.round(((curr - prev) / prev) * 1000) / 10
  }

  const metrics = [
    { key: 'sessions', label: 'Sesi', a: a.totals.sessions, b: b.totals.sessions },
    { key: 'participants', label: 'Peserta unik', a: a.totals.participants, b: b.totals.participants },
    { key: 'completed', label: 'Selesai', a: a.totals.completed, b: b.totals.completed },
    { key: 'abandoned', label: 'Abandoned', a: a.totals.abandoned, b: b.totals.abandoned },
    { key: 'completionRate', label: 'Completion rate %', a: ca.completionRate, b: cb.completionRate },
    { key: 'psikograms', label: 'Psikogram', a: a.totals.psikograms, b: b.totals.psikograms },
  ].map((m) => ({
    ...m,
    deltaPct: delta(Number(m.a) || 0, Number(m.b) || 0),
  }))

  return {
    periodA: { ...rangeA, summary: a.totals, completion: ca },
    periodB: { ...rangeB, summary: b.totals, completion: cb },
    metrics,
  }
}

export async function buildPublicLinksReport(db, { from, to }) {
  const links = await db
    .select({
      id: openInvitations.id,
      label: openInvitations.label,
      isActive: openInvitations.isActive,
      useCount: openInvitations.useCount,
      maxUses: openInvitations.maxUses,
      expiresAt: openInvitations.expiresAt,
      createdAt: openInvitations.createdAt,
      testTypeName: testTypes.name,
    })
    .from(openInvitations)
    .innerJoin(testTypes, eq(openInvitations.testTypeId, testTypes.id))
    .orderBy(desc(openInvitations.createdAt))

  // Sessions claimed via open invitation in range
  const claimed = await db
    .select({
      total: count(),
      completed: sql`count(*) filter (where ${sessions.status} in ('completed', 'verified'))::int`,
      abandoned: sql`count(*) filter (where ${sessions.status} = 'abandoned')::int`,
    })
    .from(sessions)
    .where(and(
      gte(sessions.createdAt, from),
      lte(sessions.createdAt, to),
      sql`${sessions.metadata}->>'source' = 'open_invitation'`,
    ))

  const claimRow = claimed[0] || { total: 0, completed: 0, abandoned: 0 }
  const claimTotal = Number(claimRow.total) || 0

  return {
    summary: {
      totalLinks: links.length,
      activeLinks: links.filter((l) => l.isActive).length,
      inactiveLinks: links.filter((l) => !l.isActive).length,
      totalUses: links.reduce((s, l) => s + (l.useCount || 0), 0),
      claimedInPeriod: claimTotal,
      completedFromClaim: Number(claimRow.completed) || 0,
      abandonedFromClaim: Number(claimRow.abandoned) || 0,
      claimCompletionRate: claimTotal
        ? Math.round((Number(claimRow.completed) / claimTotal) * 1000) / 10
        : 0,
    },
    links: links.map((l) => ({
      ...l,
      remainingUses: l.maxUses == null ? null : Math.max(0, l.maxUses - (l.useCount || 0)),
    })),
  }
}

export async function buildAdminActivityReport(db, { from, to }) {
  const where = and(
    gte(activityLogs.createdAt, from),
    lte(activityLogs.createdAt, to),
    or(isNull(activityLogs.actorRole), ne(activityLogs.actorRole, 'superadmin')),
    or(
      isNull(activityLogs.actorEmail),
      sql`lower(${activityLogs.actorEmail}) <> 'god@psy.test'`,
    ),
  )

  const byCategory = await db
    .select({
      category: activityLogs.category,
      total: count(),
      warnings: sql`count(*) filter (where ${activityLogs.level} = 'warning')::int`,
      errors: sql`count(*) filter (where ${activityLogs.level} = 'error')::int`,
    })
    .from(activityLogs)
    .where(where)
    .groupBy(activityLogs.category)
    .orderBy(desc(count()))

  const byActor = await db
    .select({
      actorEmail: activityLogs.actorEmail,
      actorName: activityLogs.actorName,
      actorRole: activityLogs.actorRole,
      total: count(),
    })
    .from(activityLogs)
    .where(and(where, sql`${activityLogs.actorEmail} is not null`))
    .groupBy(activityLogs.actorEmail, activityLogs.actorName, activityLogs.actorRole)
    .orderBy(desc(count()))
    .limit(20)

  const [totals] = await db
    .select({
      total: count(),
      warnings: sql`count(*) filter (where ${activityLogs.level} = 'warning')::int`,
      errors: sql`count(*) filter (where ${activityLogs.level} = 'error')::int`,
    })
    .from(activityLogs)
    .where(where)

  return {
    totals: {
      total: Number(totals?.total) || 0,
      warnings: Number(totals?.warnings) || 0,
      errors: Number(totals?.errors) || 0,
    },
    byCategory: byCategory.map((r) => ({
      category: r.category,
      total: Number(r.total) || 0,
      warnings: Number(r.warnings) || 0,
      errors: Number(r.errors) || 0,
    })),
    byActor: byActor.map((r) => ({
      actorEmail: r.actorEmail,
      actorName: r.actorName || r.actorEmail,
      actorRole: r.actorRole,
      total: Number(r.total) || 0,
    })),
  }
}

export async function buildExaminerWorkload(db, { from, to }) {
  const where = and(gte(psikograms.createdAt, from), lte(psikograms.createdAt, to))

  const byExaminer = await db
    .select({
      examinerId: psikograms.examinerId,
      examinerName: users.name,
      examinerEmail: users.email,
      total: count(),
      draft: sql`count(*) filter (where ${psikograms.status} = 'draft')::int`,
      final: sql`count(*) filter (where ${psikograms.status} = 'final')::int`,
      recommended: sql`count(*) filter (where ${psikograms.recommendation} = 'recommended')::int`,
    })
    .from(psikograms)
    .innerJoin(users, eq(psikograms.examinerId, users.id))
    .where(where)
    .groupBy(psikograms.examinerId, users.name, users.email)
    .orderBy(desc(count()))

  const verifications = await db
    .select({
      userId: sessions.verifiedBy,
      userName: users.name,
      userEmail: users.email,
      total: count(),
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.verifiedBy, users.id))
    .where(and(
      gte(sessions.verifiedAt, from),
      lte(sessions.verifiedAt, to),
      sql`${sessions.verifiedBy} is not null`,
    ))
    .groupBy(sessions.verifiedBy, users.name, users.email)
    .orderBy(desc(count()))

  return {
    examiners: byExaminer.map((r) => ({
      examinerId: r.examinerId,
      examinerName: r.examinerName,
      examinerEmail: r.examinerEmail,
      total: Number(r.total) || 0,
      draft: Number(r.draft) || 0,
      final: Number(r.final) || 0,
      recommended: Number(r.recommended) || 0,
    })),
    verifiers: verifications.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      total: Number(r.total) || 0,
    })),
  }
}

export async function buildAllReports(db, query) {
  const range = parseDateRange(query)
  const testTypeId = query.testTypeId ? String(query.testTypeId) : null

  const compareTo = query.compareTo ? new Date(String(query.compareTo)) : new Date(range.from.getTime() - 1)
  const compareFrom = query.compareFrom
    ? new Date(String(query.compareFrom))
    : new Date(compareTo.getTime() - (range.to.getTime() - range.from.getTime()))

  const rangeB = {
    from: Number.isNaN(compareFrom.getTime()) ? new Date(range.from.getTime() - 30 * 86400000) : compareFrom,
    to: Number.isNaN(compareTo.getTime()) ? new Date(range.from.getTime() - 1) : (
      String(query.compareTo || '').length <= 10
        ? new Date(compareTo.getFullYear(), compareTo.getMonth(), compareTo.getDate(), 23, 59, 59, 999)
        : compareTo
    ),
  }

  const [
    periodSummary,
    completion,
    corporate,
    psikogramPipeline,
    scoreDistribution,
    periodCompare,
    publicLinks,
    adminActivity,
    examinerWorkload,
  ] = await Promise.all([
    buildPeriodSummary(db, { ...range, testTypeId }),
    buildCompletionReport(db, { ...range, testTypeId }),
    buildCorporateReport(db, range),
    buildPsikogramPipeline(db, range),
    buildScoreDistribution(db, { ...range, testTypeId }),
    buildPeriodCompare(db, range, rangeB, testTypeId),
    buildPublicLinksReport(db, range),
    buildAdminActivityReport(db, range),
    buildExaminerWorkload(db, range),
  ])

  return {
    range,
    compareRange: rangeB,
    testTypeId,
    periodSummary,
    completion,
    corporate,
    psikogramPipeline,
    scoreDistribution,
    periodCompare,
    publicLinks,
    adminActivity,
    examinerWorkload,
  }
}

export function toCsv(headers, rows) {
  const escape = (value) => {
    const str = value == null ? '' : String(value)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }
  return lines.join('\n')
}
