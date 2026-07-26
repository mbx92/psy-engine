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

const cfitQuestions = loadJSON('../tmp-cfit-questions.json')
const cfitConfig = loadJSON('../tmp-cfit-config.json')
const cfitNorms = loadJSON('../tmp-cfit-norms.json')
const papiQuestions = loadJSON('../tmp-papi-test.json')
const papiNarratives = loadJSON('../tmp-papi-narratives.json')
const eppsExport = loadJSON('../tmp-epps-export.json')

// ============================================================
// Converters
// ============================================================

function convertCFITQuestions(structure) {
  const questions = []
  for (const subtest of structure.subtests) {
    questions.push({
      id: `${subtest.code}_instruction`,
      type: 'instruction',
      subtest: subtest.code,
      subtestId: subtest.id,
      subtestName: subtest.name,
      instruction: subtest.instruction,
      exampleCount: subtest.exampleCount,
      timeLimit: subtest.timeLimit,
      examples: subtest.examples || [],
    })
    for (const q of subtest.questions) {
      questions.push({
        id: `cfit_${subtest.code}_${q.id}`,
        number: q.id,
        subtest: subtest.code,
        subtestId: subtest.id,
        type: 'image_choice',
        imagePath: `/psychology/cfit/subtes${subtest.id}/${q.id}.png`,
        options: ['A', 'B', 'C', 'D', 'E'].map((opt, i) => ({
          id: `${subtest.code}_${q.id}_${String.fromCharCode(65 + i)}`,
          label: opt,
          value: opt,
        })),
        answer: q.answer,
      })
    }
  }
  return questions
}

function convertCFITConfig(config, questionsData) {
  const codeMap = ['series', 'classification', 'matrices', 'topology']
  const subtests = []
  for (let i = 0; i < 4; i++) {
    const key = `subtest${i + 1}`
    const inst = config.instructions?.[key] || {}
    const stData = questionsData.subtests[i]
    subtests.push({
      key: codeMap[i],
      code: codeMap[i],
      label: inst.title || codeMap[i],
      timeLimit: parseInt(inst.timeLimit) || 180,
      questionCount: stData?.questionCount || 0,
      instruction: inst.instruction || '',
      exampleCount: inst.exampleCount || 0,
      icon: inst.icon || '',
    })
  }

  const questionCount = questionsData.subtests.reduce((s, st) => s + st.questionCount, 0)

  // Identity fields - calculate age from birth date
  const identityFields = (config.identityFields || []).map(f => ({
    name: f.name,
    label: f.label,
    type: f.type === 'calculated' ? 'calculatedAge' : f.type,
    options: f.options,
    required: f.required,
    format: f.format,
    calculatedFrom: f.calculatedFrom,
  }))

  return {
    timeLimit: null,
    allowSkip: false,
    allowBack: false,
    randomizeQuestions: false,
    randomizeOptions: false,
    hasSubtests: true,
    subtestTimeLimit: true,
    autoSubmitOnTimeout: true,
    showProgress: true,
    requiresAge: true,
    requiresBirthDate: true,
    totalQuestions: questionCount,
    instructionText: config.instructions?.main?.content || '',
    instructionTitle: config.instructions?.main?.title || '',
    identityFields,
    subtests,
  }
}

function buildCFITScoringConfig(questionsData, normsData) {
  const totalQ = questionsData.subtests.reduce((s, st) => s + st.questionCount, 0)
  return {
    algorithm: 'raw_to_iq',
    maxRawScore: totalQ,
    ageBasedNorms: true,
    defaultAgeGroup: '14-0_14-11',
    dimensions: questionsData.subtests.map(st => ({
      key: st.code,
      label: st.name,
      description: st.description,
      maxScore: st.questionCount,
    })),
    resultFields: [
      { name: 'subtestScores', label: 'Skor Per Subtes', type: 'object', fields: questionsData.subtests.map(st => st.code) },
      { name: 'rawScore', label: 'Total Raw Score', type: 'number' },
      { name: 'iqScore', label: 'IQ Score', type: 'number' },
      { name: 'iqClassification', label: 'Klasifikasi IQ', type: 'string' },
    ],
    classificationRanges: normsData.classificationRanges || [
      { min: 0, max: 69, label: 'Sangat Rendah', description: 'Keterbelakangan Mental' },
      { min: 70, max: 79, label: 'Borderline', description: 'Ambang batas rendah' },
      { min: 80, max: 89, label: 'Rendah', description: 'Di bawah rata-rata' },
      { min: 90, max: 109, label: 'Rata-rata', description: 'Rata-rata' },
      { min: 110, max: 119, label: 'Tinggi', description: 'Di atas rata-rata' },
      { min: 120, max: 129, label: 'Sangat Tinggi', description: 'Sangat cerdas' },
      { min: 130, max: 140, label: 'Superior', description: 'Cerdas sekali' },
      { min: 141, max: 999, label: 'Very Superior', description: 'Sangat cerdas sekali' },
    ],
  }
}

function convertPAPIQuestions(questions) {
  return questions.map(q => ({
    id: q.id,
    number: q.id,
    type: 'paired_choice',
    pair: {
      A: { text: q.pair.A, scale: q.scaleA },
      B: { text: q.pair.B, scale: q.scaleB },
    },
    scaleA: q.scaleA,
    scaleB: q.scaleB,
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
    id: q.id,
    number: q.id,
    type: 'paired_choice',
    textA: q.textA,
    textB: q.textB,
    colIdx: q.colIdx,
    rowIdx: q.rowIdx,
    matrixGroup: q.matrixGroup,
  }))
}

// ============================================================
// Main migration
// ============================================================
async function migrate() {
  console.log('=== Migrating Psychology Test Data ===\n')

  // ---- CFIT Scale 2 ----
  console.log('--- CFIT Scale 2 ---')
  const totalQ = cfitQuestions.subtests.reduce((s, st) => s + st.questionCount, 0)
  console.log(`  Questions: ${totalQ} across ${cfitQuestions.subtests.length} subtests`)
  console.log(`  Age groups: ${Object.keys(cfitNorms.ageGroups).length}`)

  const cfitQs = convertCFITQuestions(cfitQuestions)
  const cfitCfg = convertCFITConfig(cfitConfig, cfitQuestions)
  const cfitScoring = buildCFITScoringConfig(cfitQuestions, cfitNorms)

  // Update subtest question counts
  for (const st of cfitCfg.subtests) {
    const stData = cfitQuestions.subtests.find(s => s.code === st.code)
    if (stData) st.questionCount = stData.questionCount
  }

  const [cfitRow] = await sql`
    UPDATE test_types
    SET questions = ${JSON.stringify(cfitQs)}::jsonb,
        config = ${JSON.stringify(cfitCfg)}::jsonb,
        scoring_config = ${JSON.stringify(cfitScoring)}::jsonb,
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
      ${JSON.stringify(cfitNorms.ageGroups)}::jsonb,
      ${JSON.stringify({
        population: 'CFIT Scale 2 Form 2A',
        source: 'Tabel Skala Deviasi I.Q',
        ageGroupCount: Object.keys(cfitNorms.ageGroups).length,
        notes: cfitNorms.note || '',
        comment: cfitNorms.comment || '',
      })}::jsonb
    )
  `
  console.log('  ✓ CFIT norms inserted')

  // ---- PAPI Kostick ----
  console.log('\n--- PAPI Kostick ---')
  console.log(`  Questions: ${papiQuestions.length}`)

  const papiQs = convertPAPIQuestions(papiQuestions)
  const papiScoring = buildPAPIScoringConfig(papiQuestions, papiNarratives)

  const [papiRow] = await sql`
    UPDATE test_types
    SET questions = ${JSON.stringify(papiQs)}::jsonb,
        scoring_config = ${JSON.stringify(papiScoring)}::jsonb,
        config = ${JSON.stringify({
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
        })}::jsonb,
        description = 'Perception and Preference Inventory (PAPI Kostick) — mengukur preferensi perilaku di lingkungan kerja melalui 90 pasangan pernyataan'
    WHERE slug = 'papi-kostick'
    RETURNING id
  `
  console.log('  ✓ PAPI test_type updated')

  // ---- EPPS ----
  console.log('\n--- EPPS ---')
  const eppsQs = eppsExport.questions || []
  console.log(`  Questions: ${eppsQs.length}`)

  const convertedEPPS = convertEPPSQuestions(eppsQs)

  await sql`
    UPDATE test_types
    SET questions = ${JSON.stringify(convertedEPPS)}::jsonb,
        scoring_config = ${JSON.stringify(eppsExport.scoringConfig || {})}::jsonb,
        config = ${JSON.stringify(eppsExport.config || {
          timeLimit: 45,
          allowSkip: true,
          randomize: false,
          questionsPerPage: 1,
        })}::jsonb,
        description = ${eppsExport.description || 'Edwards Personal Preference Schedule (EPPS) — mengukur 15 kebutuhan dan motivasi personal melalui 225 pasangan pernyataan'}
    WHERE slug = 'epps'
  `
  console.log('  ✓ EPPS test_type updated')

  // ---- Verify ----
  console.log('\n--- Verification ---')
  const tests = await sql`SELECT slug, type, jsonb_array_length(questions) as q_count FROM test_types ORDER BY slug`
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
