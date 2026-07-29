/**
 * Psikogram analyzer — converts PAPI Kostick scale scores into Psikogram
 * aspect ratings (R/K/C/B/T). Ported from the legacy gym-membership-fe
 * psikogramAnalyzer.js, adapted to psy-engine's scoring shape: instead of
 * recomputing scale scores from raw answers, it starts from
 * `session.scores.raw` (already computed by server/utils/scoring.js) and
 * derives each scale's max from `testType.questions[].scaleA/scaleB`.
 *
 * Rating scale: R (Rendah) 0-20%, K (Kurang) 21-40%, C (Cukup) 41-60%,
 * B (Baik) 61-80%, T (Tinggi) 81-100%.
 */

// Mapping of each Psikogram aspect to the PAPI scales that feed it.
// weight: contribution weight; inverse: high PAPI score means low aspect rating.
export const PSIKOGRAM_PAPI_MAPPING = {
  kecerdasan: {
    logikaBerpikir: {
      title: 'Logika Berpikir',
      description: 'Kemampuan menggunakan pemikiran yang bersifat taktis untuk memecahkan masalah yang dihadapi.',
      scales: [{ code: 'R', weight: 1.5 }, { code: 'I', weight: 1 }, { code: 'C', weight: 0.5 }],
    },
    kemampuanAnalisa: {
      title: 'Kemampuan Analisa',
      description: 'Kemampuan untuk memahami situasi dengan menguraikannya menjadi bagian-bagian yang lebih kecil.',
      scales: [{ code: 'R', weight: 1.5 }, { code: 'D', weight: 1.5 }, { code: 'C', weight: 0.5 }],
    },
    kemampuanNumerikal: {
      title: 'Kemampuan Numerikal',
      description: 'Kemampuan untuk berpikir praktis dalam memahami konsep angka dan hitungan.',
      scales: [{ code: 'D', weight: 1.5 }, { code: 'C', weight: 1 }, { code: 'N', weight: 0.5 }],
    },
    kemampuanVerbal: {
      title: 'Kemampuan Verbal',
      description: 'Kemampuan untuk memahami konsep dan pola dalam bentuk kata-kata.',
      scales: [{ code: 'S', weight: 1.5 }, { code: 'X', weight: 1 }, { code: 'R', weight: 0.5 }],
    },
  },
  sikapKerja: {
    orientasiHasil: {
      title: 'Orientasi Hasil',
      description: 'Kemampuan untuk mempertahankan komitmen untuk menyelesaikan tugas secara bertanggung jawab.',
      scales: [{ code: 'A', weight: 1.5 }, { code: 'N', weight: 1.5 }, { code: 'G', weight: 1 }],
    },
    fleksibilitas: {
      title: 'Fleksibilitas',
      description: 'Kemampuan untuk menyesuaikan diri dalam menghadapi permasalahan.',
      scales: [{ code: 'Z', weight: 1.5 }, { code: 'E', weight: 1 }, { code: 'W', weight: 0.5, inverse: true }],
    },
    sistematikaKerja: {
      title: 'Sistematika Kerja',
      description: 'Kemampuan untuk merencanakan hingga mengorganisasikan cara kerja.',
      scales: [{ code: 'C', weight: 1.5 }, { code: 'W', weight: 1 }, { code: 'R', weight: 1 }, { code: 'D', weight: 0.5 }],
    },
  },
  kepribadian: {
    motivasiBerprestasi: {
      title: 'Motivasi Berprestasi',
      description: 'Kemampuan untuk menunjukkan prestasi dan mencapai target.',
      scales: [{ code: 'A', weight: 2 }, { code: 'N', weight: 1 }, { code: 'G', weight: 0.5 }],
    },
    kerjasama: {
      title: 'Kerjasama',
      description: 'Kemampuan untuk menjalin, membina dan mengoptimalkan hubungan kerja yang efektif.',
      scales: [{ code: 'B', weight: 1.5 }, { code: 'O', weight: 1 }, { code: 'F', weight: 1 }],
    },
    keterampilanInterpersonal: {
      title: 'Keterampilan Interpersonal',
      description: 'Kemampuan untuk menjalin hubungan sosial dan mampu memahami kebutuhan orang lain.',
      scales: [{ code: 'S', weight: 1.5 }, { code: 'O', weight: 1 }, { code: 'X', weight: 0.5 }],
    },
    stabilitasEmosi: {
      title: 'Stabilitas Emosi',
      description: 'Kemampuan untuk memahami dan mengontrol emosi.',
      scales: [{ code: 'E', weight: 2 }, { code: 'K', weight: 1, inverse: true }],
    },
  },
  kemampuanBelajar: {
    pengembanganDiri: {
      title: 'Pengembangan Diri',
      description: 'Kemampuan untuk meningkatkan pengetahuan dan menyempurnakan keterampilan diri.',
      scales: [{ code: 'Z', weight: 1 }, { code: 'A', weight: 1.5 }, { code: 'R', weight: 0.5 }],
    },
    mengelolaPerubahan: {
      title: 'Mengelola Perubahan',
      description: 'Kemampuan dalam menyesuaikan diri dengan situasi baru.',
      scales: [{ code: 'Z', weight: 1.5 }, { code: 'E', weight: 1 }, { code: 'W', weight: 0.5, inverse: true }],
    },
  },
}

export const RATING_THRESHOLDS = {
  R: { min: 0, max: 20, label: 'Rendah' },
  K: { min: 21, max: 40, label: 'Kurang' },
  C: { min: 41, max: 60, label: 'Cukup' },
  B: { min: 61, max: 80, label: 'Baik' },
  T: { min: 81, max: 100, label: 'Tinggi' },
}

export function percentToRating(percent) {
  if (percent <= 20) return 'R'
  if (percent <= 40) return 'K'
  if (percent <= 60) return 'C'
  if (percent <= 80) return 'B'
  return 'T'
}

export function getRatingLabel(rating) {
  return RATING_THRESHOLDS[rating]?.label || rating
}

function calculateAspectScore(aspectConfig, papiScores) {
  const { scales } = aspectConfig
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const { code, weight = 1, inverse = false } of scales) {
    const scaleData = papiScores[code]
    if (!scaleData) continue

    let percent = (scaleData.score / (scaleData.max || 9)) * 100
    if (inverse) percent = 100 - percent

    totalWeightedScore += percent * weight
    totalWeight += weight
  }

  const finalPercent = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0
  return { percent: finalPercent, rating: percentToRating(finalPercent) }
}

/**
 * Derive each PAPI scale's max possible score from the test's questions
 * (count of questions assigning that scale to either side of the pair).
 */
export function computeScaleMaxes(questions) {
  const maxes = {}
  for (const q of questions || []) {
    if (q.scaleA) maxes[q.scaleA] = (maxes[q.scaleA] || 0) + 1
    if (q.scaleB) maxes[q.scaleB] = (maxes[q.scaleB] || 0) + 1
  }
  return maxes
}

/**
 * Build the { code: { score, max, percent } } map the analyzer expects,
 * from a session's already-computed raw scale counts and the test's questions.
 */
export function buildPapiScores(rawScores, questions) {
  const raw = rawScores || {}
  const maxes = computeScaleMaxes(questions)
  const codes = new Set([...Object.keys(raw), ...Object.keys(maxes)])

  const papiScores = {}
  for (const code of codes) {
    const score = raw[code] || 0
    const max = maxes[code] || 9
    papiScores[code] = { score, max, percent: Math.round((score / max) * 100) }
  }
  return papiScores
}

/** Analyze PAPI scale scores into Psikogram aspect ratings for all four sections. */
export function analyzePapiScoresToPsikogram(papiScores) {
  const result = {}

  for (const [sectionKey, sectionConfig] of Object.entries(PSIKOGRAM_PAPI_MAPPING)) {
    const items = []
    let sectionTotalPercent = 0

    for (const [itemKey, itemConfig] of Object.entries(sectionConfig)) {
      const analysis = calculateAspectScore(itemConfig, papiScores)
      items.push({
        key: itemKey,
        title: itemConfig.title,
        description: itemConfig.description,
        rating: analysis.rating,
        percent: analysis.percent,
      })
      sectionTotalPercent += analysis.percent
    }

    result[sectionKey] = {
      items,
      overallPercent: items.length ? Math.round(sectionTotalPercent / items.length) : 0,
    }
  }

  const sectionValues = Object.values(result)
  result.overallPercent = sectionValues.length
    ? Math.round(sectionValues.reduce((sum, s) => sum + s.overallPercent, 0) / sectionValues.length)
    : 0
  result.overallRating = percentToRating(result.overallPercent)

  return result
}

/** Build the default (empty-rating) sections structure used for manual entry. */
export function getDefaultSections() {
  const sections = {}
  for (const [sectionKey, sectionConfig] of Object.entries(PSIKOGRAM_PAPI_MAPPING)) {
    sections[sectionKey] = {
      items: Object.values(sectionConfig).map((item) => ({
        title: item.title,
        description: item.description,
        rating: '',
      })),
      conclusion: '',
    }
  }
  return sections
}

/** Merge analysis ratings into the default sections structure (keeps title/description order). */
export function analysisToSections(analysis) {
  const sections = getDefaultSections()
  for (const sectionKey of Object.keys(sections)) {
    const items = analysis[sectionKey]?.items || []
    sections[sectionKey].items = sections[sectionKey].items.map((item, i) => ({
      ...item,
      rating: items[i]?.rating || '',
    }))
  }
  return sections
}
