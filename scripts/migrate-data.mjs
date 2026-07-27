/**
 * Migrate all test data from old system to new psy-engine DB.
 * Uses raw postgres for compatibility.
 *
 * Run: node scripts/migrate-data.js
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const connectionString = process.env.DATABASE_URL || 'postgres://mbx@127.0.0.1:5432/psy_engine'
const sql = postgres(connectionString)

// ============================================================
// Load source data
// ============================================================
function loadJSON(filename) {
  return JSON.parse(readFileSync(join(__dirname, filename), 'utf-8'))
}

const cfitV15 = loadJSON('../tmp-cfit-v1.5.json')
const cfitNorms = loadJSON('../tmp-cfit-norms.json')
const papiQuestions = loadJSON('../tmp-papi-test.json')
const papiNarratives = loadJSON('../tmp-papi-narratives.json')
const eppsExport = loadJSON('../tmp-epps-export.json')

// ============================================================
// Converters (CFIT from latest export CFIT_v1.5)
// ============================================================

function convertCFITFromV15(exportData) {
  const subtestMeta = exportData.scoringConfig?.subtests || {}
  const questions = []

  for (const q of exportData.questions || []) {
    const subtest = q.subtest
    if (q.type === 'instruction') {
      const content = q.content || {}
      questions.push({
        id: q.id,
        type: 'instruction',
        subtestKey: subtest,
        subtest,
        title: q.title || '',
        subtitle: q.subtitle || '',
        text: q.title || subtest,
        instruction: content.intro || '',
        timeLimit: content.timeLimit || subtestMeta[subtest]?.timeLimit || null,
        rules: content.rules || [],
        warnings: content.warnings || [],
        examples: (content.examples || []).map((ex) => ({
          number: ex.number,
          imagePath: ex.imagePath,
          description: ex.description || '',
          answer: ex.answer,
          explanation: ex.explanation || '',
        })),
      })
      continue
    }

    // question
    const opts = Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D', 'E']
    const num = String(q.id).split('_').pop()
    questions.push({
      id: q.id,
      number: Number(num) || num,
      subtestKey: subtest,
      subtest,
      type: 'image_choice',
      text: `Soal ${num}`,
      imagePath: q.imagePath,
      options: opts.map((opt) => {
        const label = typeof opt === 'string' ? opt : (opt.label || opt.value)
        return {
          id: `${q.id}_${label}`,
          label,
          text: label,
          value: label,
        }
      }),
      answer: q.answer,
    })
  }

  const subtests = Object.entries(subtestMeta).map(([code, st]) => ({
    key: code,
    code,
    label: st.name || code,
    timeLimit: st.timeLimit, // seconds
    questionCount: st.questionCount,
    description: st.description || '',
  }))

  const config = {
    timeLimit: null, // global timer off — use per-subtest
    allowSkip: exportData.config?.allowSkip ?? true,
    allowBack: exportData.config?.allowBack ?? false,
    randomize: false,
    randomizeQuestions: false,
    hasSubtests: true,
    subtestTimeLimit: true,
    subtestProtection: exportData.config?.subtestProtection ?? true,
    autoSubmitOnTimeout: exportData.config?.autoSubmitOnTimeout ?? true,
    showProgress: true,
    requiresAge: true,
    requiresBirthDate: true,
    totalQuestions: exportData.scoringConfig?.maxRawScore || 46,
    instructionText: exportData.config?.instructionText || '',
    subtests,
  }

  const scoringConfig = {
    algorithm: 'raw_to_iq',
    maxRawScore: exportData.scoringConfig?.maxRawScore || 46,
    ageBasedNorms: true,
    defaultAgeGroup: '13-9_dewasa',
    dimensions: subtests.map((st) => ({
      key: st.code,
      label: st.label,
      description: st.description,
      maxScore: st.questionCount,
    })),
    classificationRanges: (cfitNorms.classificationRanges || []).map((r) => ({
      min: r.minIQ ?? r.min ?? 0,
      max: r.maxIQ == null ? 999 : r.maxIQ,
      label: r.classification || r.label,
      description: r.description || '',
    })),
  }

  return { questions, config, scoringConfig }
}

function convertPAPIQuestions(questions) {
  return questions.map(q => ({
    id: String(q.id),
    number: q.id,
    type: 'paired_choice',
    text: 'Pilih pernyataan yang paling menggambarkan diri Anda',
    pair: {
      A: { text: q.pair.A, scale: q.scaleA },
      B: { text: q.pair.B, scale: q.scaleB },
    },
    scaleA: q.scaleA,
    scaleB: q.scaleB,
    options: [
      { id: `${q.id}_A`, text: q.pair.A, label: 'A', value: 'A', dimension: q.scaleA, weight: 1, pairWith: `${q.id}_B` },
      { id: `${q.id}_B`, text: q.pair.B, label: 'B', value: 'B', dimension: q.scaleB, weight: 1, pairWith: `${q.id}_A` },
    ],
  }))
}

function buildPAPIScoringConfig(questions, narratives) {
  const scales = [...new Set(questions.flatMap(q => [q.scaleA, q.scaleB]))]
  const scaleConfigs = scales.map(code => {
    const n = narratives?.[code]
    return {
      code,
      name: n?.name || code,
      description: n?.description || '',
      levels: n?.levels || [],
    }
  })
  return {
    algorithm: 'paired_choice',
    scales: scaleConfigs,
    interpretations: narratives || {},
    questionCount: questions.length,
  }
}

function convertEPPSQuestions(questions) {
  return questions.map(q => ({
    id: String(q.id),
    number: q.id,
    type: 'paired_choice',
    text: 'Pilih pernyataan yang paling sesuai dengan diri Anda',
    textA: q.textA,
    textB: q.textB,
    colIdx: q.colIdx,
    rowIdx: q.rowIdx,
    matrixGroup: q.matrixGroup,
    options: [
      { id: `${q.id}_A`, text: q.textA, label: 'A', value: 'A', pairWith: `${q.id}_B` },
      { id: `${q.id}_B`, text: q.textB, label: 'B', value: 'B', pairWith: `${q.id}_A` },
    ],
  }))
}

// ============================================================
// Main migration
// ============================================================
async function migrate() {
  console.log('=== Migrating Psychology Test Data ===\n')

  // ---- CFIT Scale 2 (from CFIT_v1.5) ----
  console.log('--- CFIT Scale 2 (v1.5) ---')
  const { questions: cfitQs, config: cfitCfg, scoringConfig: cfitScoring } = convertCFITFromV15(cfitV15)
  const answerable = cfitQs.filter((q) => q.type !== 'instruction').length
  console.log(`  Version: ${cfitV15.version} · Questions: ${answerable} + ${cfitQs.length - answerable} instructions`)
  console.log(`  Subtest timers (s): ${cfitCfg.subtests.map((s) => `${s.code}=${s.timeLimit}`).join(', ')}`)
  console.log(`  Age groups: ${Object.keys(cfitNorms.ageGroups).length}`)

  const [cfitRow] = await sql`
    UPDATE test_types
    SET questions = ${sql.json(cfitQs)},
        config = ${sql.json(cfitCfg)},
        scoring_config = ${sql.json(cfitScoring)},
        description = 'Culture Fair Intelligence Test — mengukur kemampuan intelektual umum non-verbal (CFIT Scale 2, Form 2A)'
    WHERE slug = 'cfit-scale-2'
    RETURNING id
  `
  console.log('  ✓ CFIT test_type updated')

  // Insert CFIT norms
  await sql`
    DELETE FROM test_type_norms
    WHERE test_type_id = ${cfitRow.id} AND code = 'cfit_iq'
  `
  await sql`
    INSERT INTO test_type_norms (test_type_id, code, label, norm_type, data, metadata)
    VALUES (
      ${cfitRow.id},
      'cfit_iq',
      'CFIT IQ Norms - Raw Score to IQ Conversion',
      'raw_to_iq',
      ${sql.json(cfitNorms.ageGroups)},
      ${sql.json({
        population: 'CFIT Scale 2 Form 2A',
        source: 'Tabel Skala Deviasi I.Q',
        ageGroupCount: Object.keys(cfitNorms.ageGroups).length,
        notes: cfitNorms.note || '',
        comment: cfitNorms.comment || '',
      })}
    )
  `
  console.log('  ✓ CFIT norms inserted')

  // ---- PAPI Kostick ----
  console.log('\n--- PAPI Kostick ---')
  console.log(`  Questions: ${papiQuestions.length}`)

  const papiQs = convertPAPIQuestions(papiQuestions)
  const papiScoring = buildPAPIScoringConfig(papiQuestions, papiNarratives)
  const papiConfig = {
    timeLimit: 30,
    allowSkip: false,
    randomize: true,
    questionsPerPage: 1,
    instructions: [
      'Setiap soal terdiri dari dua pernyataan (A dan B)',
      'Pilih satu pernyataan yang PALING menggambarkan diri Anda',
      'Tidak ada jawaban benar atau salah',
      'Jawablah dengan jujur sesuai diri Anda, bukan yang ideal',
    ],
  }

  await sql`
    UPDATE test_types
    SET questions = ${sql.json(papiQs)},
        scoring_config = ${sql.json(papiScoring)},
        config = ${sql.json(papiConfig)},
        description = 'Perception and Preference Inventory (PAPI Kostick) — mengukur preferensi perilaku di lingkungan kerja melalui 90 pasangan pernyataan'
    WHERE slug = 'papi-kostick'
  `
  console.log('  ✓ PAPI test_type updated')

  // ---- EPPS ----
  console.log('\n--- EPPS ---')
  const eppsQs = eppsExport.questions || []
  console.log(`  Questions: ${eppsQs.length}`)

  const convertedEPPS = convertEPPSQuestions(eppsQs)
  const eppsNeedLabels = {
    ach: 'Achievement', def: 'Deference', ord: 'Order', exh: 'Exhibition', aut: 'Autonomy',
    aff: 'Affiliation', int: 'Intraception', suc: 'Succorance', dom: 'Dominance', aba: 'Abasement',
    nur: 'Nurturance', chg: 'Change', end: 'Endurance', het: 'Heterosexuality', agg: 'Aggression',
  }
  const eppsNeeds = eppsExport.scoringConfig?.needs || Object.keys(eppsNeedLabels)
  const eppsScoring = {
    algorithm: 'epps_matrix',
    needs: eppsNeeds,
    consistency: eppsExport.scoringConfig?.consistency || ['BD', 'BH', 'S'],
    dimensions: eppsNeeds.map((key) => ({
      key,
      label: eppsNeedLabels[key] || key,
      maxScore: 15,
    })),
  }
  const eppsConfig = eppsExport.config || {
    timeLimit: 45,
    allowSkip: true,
    randomize: false,
    questionsPerPage: 1,
    instructions: [
      'Setiap soal terdiri dari dua pernyataan (A dan B)',
      'Pilih satu pernyataan yang PALING sesuai dengan diri Anda',
      'Tidak ada jawaban benar atau salah',
    ],
  }

  await sql`
    UPDATE test_types
    SET questions = ${sql.json(convertedEPPS)},
        scoring_config = ${sql.json(eppsScoring)},
        config = ${sql.json(eppsConfig)},
        description = ${eppsExport.description || 'Edwards Personal Preference Schedule (EPPS) — mengukur 15 kebutuhan dan motivasi personal melalui 225 pasangan pernyataan'}
    WHERE slug = 'epps'
  `
  console.log('  ✓ EPPS test_type updated')

  // ---- Verify ----
  console.log('\n--- Verification ---')
  const tests = await sql`
    SELECT slug, type,
      CASE WHEN jsonb_typeof(questions) = 'array' THEN jsonb_array_length(questions) ELSE 0 END as q_count
    FROM test_types
    ORDER BY slug
  `
  for (const t of tests) {
    console.log(`  ${t.slug} (${t.type}): ${t.q_count} questions`)
  }

  const norms = await sql`SELECT t.slug, tn.code FROM test_type_norms tn JOIN test_types t ON t.id = tn.test_type_id`
  console.log(`  Norms entries: ${norms.length}`)
  for (const n of norms) {
    console.log(`    ${n.slug}: ${n.code}`)
  }

  console.log('\n=== Migration Complete! ===')
  await sql.end()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
