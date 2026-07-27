import eppsNarratives from '~~/data/epps/narratives.json'
import {
  EPPS_NEED_CODES,
  EPPS_NEED_LABELS,
  EPPS_NEEDS,
  buildEppsAnswerBlocks,
} from '~~/utils/eppsConstants'

/**
 * Normalize session scores for UI (CFIT / PAPI / EPPS / generic).
 */
export function buildScoreView(session) {
  const algorithm = session?.testType?.scoringConfig?.algorithm
  const slug = session?.testType?.slug || ''
  const scores = session?.scores || {}
  const dims = scores.dimensions || {}
  const raw = scores.raw || {}
  const interpretation = session?.interpretation || scores.interpretation || {}
  const catalog = session?.testType?.scoringConfig?.dimensions || []
  const scales = session?.testType?.scoringConfig?.scales || []

  if (algorithm === 'raw_to_iq' || slug.includes('cfit')) {
    return buildCfitView(session, dims, raw, interpretation, catalog)
  }

  if (algorithm === 'epps_matrix' || slug === 'epps') {
    return buildEppsView(session, dims, raw, interpretation)
  }

  if (algorithm === 'paired_choice' && (scales.length || slug.includes('papi'))) {
    return buildPapiView(session, dims, interpretation, scales)
  }

  return buildGenericView(dims, interpretation, catalog)
}

function buildCfitView(session, dims, raw, interpretation, catalog) {
  const subtestKeys = catalog.map((d) => d.key).filter(Boolean)
  const fallbackKeys = ['series', 'classification', 'matrices', 'topology']
  const keys = subtestKeys.length ? subtestKeys : fallbackKeys

  return {
    kind: 'cfit',
    iqScore: dims.iqScore ?? null,
    classification: interpretation.iq?.label || '—',
    classificationDescription: interpretation.iq?.description || '',
    rawScore: dims.rawScore ?? raw.rawScore ?? null,
    maxRawScore: raw.maxRawScore ?? session?.testType?.scoringConfig?.maxRawScore ?? 46,
    ageGroup: raw.ageGroup || null,
    subtests: keys.map((key) => {
      const meta = catalog.find((c) => c.key === key)
      return {
        key,
        label: meta?.label || key,
        value: dims[key] ?? 0,
        max: meta?.maxScore ?? null,
      }
    }),
  }
}

function buildPapiView(session, dims, interpretation, scales) {
  const scaleList = scales.length
    ? scales
    : Object.keys(dims).map((code) => ({ code, name: code }))

  return {
    kind: 'papi',
    dimensions: scaleList.map((s) => {
      const key = s.code || s.key
      const value = dims[key] ?? 0
      const interp = interpretation[key] || {}
      const levels = s.levels || {}
      const levelKey = interp.level || (value <= 3 ? 'low' : value <= 6 ? 'medium' : 'high')
      return {
        key,
        label: String(key || '').toUpperCase(),
        name: s.name || s.label || key,
        description: s.description || '',
        value,
        max: 9,
        interpretationLabel: interp.label || levelKey,
        interpretationDescription: interp.description || levels[levelKey] || levels.medium || '',
      }
    }).filter((d) => d.key !== 'iqScore' && d.key !== 'rawScore'),
  }
}

function buildEppsView(session, dims, raw, interpretation) {
  const matrixRows = raw.matrix || []
  const consistency = raw.consistency || {}
  const profile = scoresProfile(session)

  const needs = EPPS_NEEDS.map((key) => {
    const row = matrixRows.find((r) => r.key === key)
    const narrative = eppsNarratives[key] || {}
    const interp = interpretation[key] || {}
    const level = interp.level || row?.level || 'medium'
    return {
      key,
      code: EPPS_NEED_CODES[key] || key.toUpperCase(),
      label: narrative.name || EPPS_NEED_LABELS[key] || key,
      description: narrative.description || '',
      bb: row?.bb ?? 0,
      bj: row?.bj ?? 0,
      bd: row?.bd ?? 0,
      bh: row?.bh ?? 0,
      s: row?.s ?? dims[key] ?? 0,
      raw: row?.raw ?? raw.needs?.[key] ?? 0,
      category: row?.category || interp.label || '—',
      interpretationDescription: narrative.levels?.[level] || '',
    }
  })

  const sorted = [...needs].sort((a, b) => b.s - a.s)

  return {
    kind: 'epps',
    needs,
    consistency,
    answerBlocks: buildEppsAnswerBlocks(session),
    top5: profile.top5 || sorted.slice(0, 5).map((n) => n.key),
    low5: profile.low5 || sorted.slice(-5).reverse().map((n) => n.key),
    participantGender: session?.participant?.gender,
  }
}

function scoresProfile(session) {
  return session?.scores?.profile || {}
}

function buildGenericView(dims, interpretation, catalog) {
  return {
    kind: 'generic',
    dimensions: Object.entries(dims)
      .filter(([key]) => !['iqScore', 'rawScore'].includes(key))
      .map(([key, value]) => {
        const meta = catalog.find((c) => c.key === key)
        return {
          key,
          label: meta?.label || key,
          value,
          interpretationLabel: interpretation[key]?.label,
          interpretationDescription: interpretation[key]?.description,
        }
      }),
  }
}

export function chartDimensionsFromView(view) {
  if (!view) return []
  if (view.kind === 'cfit') {
    return view.subtests.map((st) => ({ label: st.label, value: st.value, max: st.max || 14 }))
  }
  if (view.kind === 'epps') {
    return view.needs.map((n) => ({
      label: n.code || EPPS_NEED_CODES[n.key] || n.key.toUpperCase(),
      value: n.s,
      max: 15,
    }))
  }
  if (view.kind === 'papi') {
    return view.dimensions.map((d) => ({
      label: (d.key || d.label).toUpperCase(),
      value: d.value,
      max: d.max || 9,
    }))
  }
  return (view.dimensions || []).map((d) => ({ label: d.label, value: d.value, max: 100 }))
}

export function interpretationClass(label) {
  if (!label) return 'text-muted-foreground font-medium'
  if (/HIGH|SUPERIOR|GENIUS|\+ \+ \+|\+ \+|\+/.test(String(label)) && !/^\+?$/.test(String(label).trim())) {
    return 'text-emerald-600 font-medium'
  }
  if (/LOW|DEFICIT|BORDERLINE|\- \- \-|\- \-|\-/.test(String(label))) {
    return 'text-destructive font-medium'
  }
  return 'text-muted-foreground font-medium'
}
