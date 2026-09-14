import postgres from 'postgres'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const text = await readFile(new URL('../data/cfit/norms.json', import.meta.url), 'utf8')
const source = JSON.parse(text)
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
for (const group of Object.values(source.ageGroups)) {
  if (!(group.ageMonthsStart <= group.ageMonthsEnd) || !group.norms?.length || group.norms.some(n => !Number.isInteger(n.rawScore) || !Number.isFinite(n.iqScore))) throw new Error('Invalid CFIT norm data')
}
const sql = postgres(process.env.DATABASE_URL, { max: 1 })
try {
  await sql.begin(async tx => {
    const [test] = await tx`SELECT id, scoring_config FROM test_types WHERE slug = 'cfit-scale-2' FOR UPDATE`
    if (!test) { console.log('CFIT test not present; norms skipped'); return }
    const existing = await tx`SELECT id FROM test_type_norms WHERE test_type_id = ${test.id} AND code = 'cfit_iq'`
    if (existing.length) { console.log('CFIT norms already present; preserved'); return }
    const metadata = { source: 'Legacy CFIT norm table', sha256: createHash('sha256').update(text).digest('hex'), population: 'CFIT Scale 2 Form 2A', ageGroupCount: Object.keys(source.ageGroups).length, note: source.note }
    await tx`INSERT INTO test_type_norms (test_type_id, code, label, norm_type, data, metadata) VALUES (${test.id}, 'cfit_iq', 'CFIT legacy age norms', 'raw_to_iq', ${tx.json(source.ageGroups)}, ${tx.json(metadata)})`
    const scoring = { ...test.scoring_config, classificationRanges: test.scoring_config?.classificationRanges?.length ? test.scoring_config.classificationRanges : source.classificationRanges }
    await tx`UPDATE test_types SET scoring_config = ${tx.json(scoring)} WHERE id = ${test.id}`
    console.log('CFIT norms imported: '+Object.keys(source.ageGroups).length+' age groups')
  })
} finally { await sql.end() }
