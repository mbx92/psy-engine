import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema/index.js'

// Use the same connection as the app
const connectionString = process.env.DATABASE_URL || 'postgres://mbx@127.0.0.1:5432/psy_engine'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function seed() {
  console.log('Seeding test types...')

  // Clear existing
  await db.delete(schema.testTypes)

  // ── CFIT Scale 2 (Aptitude) ──────────────────────────────────
  const cfitQuestions = [
    // Series (Seri) - 12 questions
    { id: 's1', number: 1, text: 'What comes next in the series?', subtestKey: 'series', options: [
      { id: 's1a', text: 'Option A', weight: 0 },
      { id: 's1b', text: 'Option B', weight: 1 },
      { id: 's1c', text: 'Option C', weight: 0 },
      { id: 's1d', text: 'Option D', weight: 0 },
    ]},
    { id: 's2', number: 2, text: 'What comes next in the series?', subtestKey: 'series', options: [
      { id: 's2a', text: 'Option A', weight: 0 },
      { id: 's2b', text: 'Option B', weight: 0 },
      { id: 's2c', text: 'Option C', weight: 1 },
      { id: 's2d', text: 'Option D', weight: 0 },
    ]},
    { id: 's3', number: 3, text: 'What comes next in the series?', subtestKey: 'series', options: [
      { id: 's3a', text: 'Option A', weight: 0 },
      { id: 's3b', text: 'Option B', weight: 0 },
      { id: 's3c', text: 'Option C', weight: 0 },
      { id: 's3d', text: 'Option D', weight: 1 },
    ]},
    // Classifications (Klasifikasi) - 12 questions
    { id: 'c1', number: 4, text: 'Which figure does NOT belong?', subtestKey: 'classification', options: [
      { id: 'c1a', text: 'Option A', weight: 0 },
      { id: 'c1b', text: 'Option B', weight: 1 },
      { id: 'c1c', text: 'Option C', weight: 0 },
      { id: 'c1d', text: 'Option D', weight: 0 },
    ]},
    { id: 'c2', number: 5, text: 'Which figure does NOT belong?', subtestKey: 'classification', options: [
      { id: 'c2a', text: 'Option A', weight: 0 },
      { id: 'c2b', text: 'Option B', weight: 0 },
      { id: 'c2c', text: 'Option C', weight: 1 },
      { id: 'c2d', text: 'Option D', weight: 0 },
    ]},
    { id: 'c3', number: 6, text: 'Which figure does NOT belong?', subtestKey: 'classification', options: [
      { id: 'c3a', text: 'Option A', weight: 0 },
      { id: 'c3b', text: 'Option B', weight: 0 },
      { id: 'c3c', text: 'Option C', weight: 0 },
      { id: 'c3d', text: 'Option D', weight: 1 },
    ]},
    // Matrices (Matriks) - 12 questions
    { id: 'm1', number: 7, text: 'Which figure completes the matrix?', subtestKey: 'matrices', options: [
      { id: 'm1a', text: 'Option A', weight: 1 },
      { id: 'm1b', text: 'Option B', weight: 0 },
      { id: 'm1c', text: 'Option C', weight: 0 },
      { id: 'm1d', text: 'Option D', weight: 0 },
    ]},
    { id: 'm2', number: 8, text: 'Which figure completes the matrix?', subtestKey: 'matrices', options: [
      { id: 'm2a', text: 'Option A', weight: 0 },
      { id: 'm2b', text: 'Option B', weight: 1 },
      { id: 'm2c', text: 'Option C', weight: 0 },
      { id: 'm2d', text: 'Option D', weight: 0 },
    ]},
    { id: 'm3', number: 9, text: 'Which figure completes the matrix?', subtestKey: 'matrices', options: [
      { id: 'm3a', text: 'Option A', weight: 0 },
      { id: 'm3b', text: 'Option B', weight: 0 },
      { id: 'm3c', text: 'Option C', weight: 1 },
      { id: 'm3d', text: 'Option D', weight: 0 },
    ]},
    // Topology (Topologi) - 12 questions
    { id: 't1', number: 10, text: 'Which figure matches the condition?', subtestKey: 'topology', options: [
      { id: 't1a', text: 'Option A', weight: 0 },
      { id: 't1b', text: 'Option B', weight: 0 },
      { id: 't1c', text: 'Option C', weight: 1 },
      { id: 't1d', text: 'Option D', weight: 0 },
    ]},
    { id: 't2', number: 11, text: 'Which figure matches the condition?', subtestKey: 'topology', options: [
      { id: 't2a', text: 'Option A', weight: 0 },
      { id: 't2b', text: 'Option B', weight: 0 },
      { id: 't2c', text: 'Option C', weight: 0 },
      { id: 't2d', text: 'Option D', weight: 1 },
    ]},
    { id: 't3', number: 12, text: 'Which figure matches the condition?', subtestKey: 'topology', options: [
      { id: 't3a', text: 'Option A', weight: 1 },
      { id: 't3b', text: 'Option B', weight: 0 },
      { id: 't3c', text: 'Option C', weight: 0 },
      { id: 't3d', text: 'Option D', weight: 0 },
    ]},
  ]

  // ── PAPI Kostick (Paired Choice) ────────────────────────────
  const papiDimensions = [
    { key: 'ldr', label: 'Leadership' },
    { key: 'dec', label: 'Decision Making' },
    { key: 'org', label: 'Organization' },
    { key: 'agg', label: 'Aggressiveness' },
    { key: 'act', label: 'Activity' },
  ]
  const papiQuestions = [
    { id: 'p1', number: 1, text: 'Which describes you better?', subtestKey: null, options: [
      { id: 'p1a', text: 'I prefer to lead groups', dimension: 'ldr', weight: 1, pairWith: 'p1b' },
      { id: 'p1b', text: 'I prefer to follow instructions', dimension: 'act', weight: 1, pairWith: 'p1a' },
    ]},
    { id: 'p2', number: 2, text: 'Which describes you better?', options: [
      { id: 'p2a', text: 'I make decisions quickly', dimension: 'dec', weight: 1, pairWith: 'p2b' },
      { id: 'p2b', text: 'I analyze all options carefully', dimension: 'org', weight: 1, pairWith: 'p2a' },
    ]},
    { id: 'p3', number: 3, text: 'Which describes you better?', options: [
      { id: 'p3a', text: 'I enjoy competing', dimension: 'agg', weight: 1, pairWith: 'p3b' },
      { id: 'p3b', text: 'I prefer cooperation', dimension: 'ldr', weight: 1, pairWith: 'p3a' },
    ]},
    { id: 'p4', number: 4, text: 'Which describes you better?', options: [
      { id: 'p4a', text: 'I keep everything organized', dimension: 'org', weight: 1, pairWith: 'p4b' },
      { id: 'p4b', text: 'I adapt to whatever comes', dimension: 'dec', weight: 1, pairWith: 'p4a' },
    ]},
    { id: 'p5', number: 5, text: 'Which describes you better?', options: [
      { id: 'p5a', text: 'I am always on the move', dimension: 'act', weight: 1, pairWith: 'p5b' },
      { id: 'p5b', text: 'I work steadily at my pace', dimension: 'agg', weight: 1, pairWith: 'p5a' },
    ]},
    { id: 'p6', number: 6, text: 'Which describes you better?', options: [
      { id: 'p6a', text: 'I take charge in groups', dimension: 'ldr', weight: 1, pairWith: 'p6b' },
      { id: 'p6b', text: 'I plan everything in detail', dimension: 'org', weight: 1, pairWith: 'p6a' },
    ]},
    { id: 'p7', number: 7, text: 'Which describes you better?', options: [
      { id: 'p7a', text: 'I act first, think later', dimension: 'dec', weight: 1, pairWith: 'p7b' },
      { id: 'p7b', text: 'I think first, act later', dimension: 'act', weight: 1, pairWith: 'p7a' },
    ]},
    { id: 'p8', number: 8, text: 'Which describes you better?', options: [
      { id: 'p8a', text: 'I am assertive with others', dimension: 'agg', weight: 1, pairWith: 'p8b' },
      { id: 'p8b', text: 'I am diplomatic with others', dimension: 'ldr', weight: 1, pairWith: 'p8a' },
    ]},
    { id: 'p9', number: 9, text: 'Which describes you better?', options: [
      { id: 'p9a', text: 'I work best with structure', dimension: 'org', weight: 1, pairWith: 'p9b' },
      { id: 'p9b', text: 'I work best with freedom', dimension: 'dec', weight: 1, pairWith: 'p9a' },
    ]},
    { id: 'p10', number: 10, text: 'Which describes you better?', options: [
      { id: 'p10a', text: 'I pursue goals vigorously', dimension: 'act', weight: 1, pairWith: 'p10b' },
      { id: 'p10b', text: 'I pursue goals methodically', dimension: 'agg', weight: 1, pairWith: 'p10a' },
    ]},
  ]

  // ── EPPS (Dimension Sum) ────────────────────────────────────
  const eppsDimensions = [
    { key: 'ach', label: 'Achievement' },
    { key: 'ord', label: 'Order' },
    { key: 'aut', label: 'Autonomy' },
    { key: 'aff', label: 'Affiliation' },
    { key: 'dom', label: 'Dominance' },
  ]
  const eppsQuestions = [
    { id: 'e1', number: 1, text: 'I like to accomplish tasks that require effort', options: [
      { id: 'e1a', text: 'Yes', dimension: 'ach', weight: 1 },
      { id: 'e1b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e2', number: 2, text: 'I like to have my work organized and planned', options: [
      { id: 'e2a', text: 'Yes', dimension: 'ord', weight: 1 },
      { id: 'e2b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e3', number: 3, text: 'I like to be able to come and go as I please', options: [
      { id: 'e3a', text: 'Yes', dimension: 'aut', weight: 1 },
      { id: 'e3b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e4', number: 4, text: 'I like to form new friendships', options: [
      { id: 'e4a', text: 'Yes', dimension: 'aff', weight: 1 },
      { id: 'e4b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e5', number: 5, text: 'I like to be the leader in groups', options: [
      { id: 'e5a', text: 'Yes', dimension: 'dom', weight: 1 },
      { id: 'e5b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e6', number: 6, text: 'I like to do my best in everything I undertake', options: [
      { id: 'e6a', text: 'Yes', dimension: 'ach', weight: 1 },
      { id: 'e6b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e7', number: 7, text: 'I like to have things in neat order', options: [
      { id: 'e7a', text: 'Yes', dimension: 'ord', weight: 1 },
      { id: 'e7b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e8', number: 8, text: 'I like to feel free to do what I want', options: [
      { id: 'e8a', text: 'Yes', dimension: 'aut', weight: 1 },
      { id: 'e8b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e9', number: 9, text: 'I like to share things with friends', options: [
      { id: 'e9a', text: 'Yes', dimension: 'aff', weight: 1 },
      { id: 'e9b', text: 'No', dimension: null, weight: 0 },
    ]},
    { id: 'e10', number: 10, text: 'I like to tell others how to do things', options: [
      { id: 'e10a', text: 'Yes', dimension: 'dom', weight: 1 },
      { id: 'e10b', text: 'No', dimension: null, weight: 0 },
    ]},
  ]

  // Insert CFIT
  await db.insert(schema.testTypes).values({
    name: 'CFIT Scale 2',
    slug: 'cfit-scale-2',
    type: 'aptitude',
    description: 'Culture Fair Intelligence Test — mengukur kemampuan intelektual umum non-verbal',
    config: {
      timeLimit: 30,
      allowSkip: true,
      randomize: true,
      questionsPerPage: 1,
      instructions: [
        'Tes ini terdiri dari 4 subtes',
        'Setiap subtes memiliki batas waktu sendiri',
        'Baca petunjuk setiap subtes dengan teliti',
        'Tidak ada pengurangan nilai untuk jawaban salah',
      ],
      subtests: [
        { key: 'series', label: 'Series (Seri)', timeLimit: 4, questionCount: 3 },
        { key: 'classification', label: 'Classifications (Klasifikasi)', timeLimit: 4, questionCount: 3 },
        { key: 'matrices', label: 'Matrices (Matriks)', timeLimit: 4, questionCount: 3 },
        { key: 'topology', label: 'Topology (Topologi)', timeLimit: 4, questionCount: 3 },
      ],
    },
    questions: cfitQuestions,
    scoringConfig: {
      algorithm: 'correct_count',
      dimensions: [{ key: 'aptitude', label: 'General Aptitude', description: 'Kemampuan intelektual umum' }],
      interpretations: {
        aptitude: {
          ranges: [
            { min: 0, max: 3, label: 'Low', description: 'Perlu pengembangan lebih lanjut' },
            { min: 4, max: 6, label: 'Average', description: 'Kemampuan rata-rata' },
            { min: 7, max: 9, label: 'High', description: 'Kemampuan di atas rata-rata' },
            { min: 10, max: 12, label: 'Very High', description: 'Kemampuan sangat baik' },
          ],
        },
      },
    },
    isActive: true,
  })
  console.log('  ✓ CFIT Scale 2')

  // Insert PAPI
  await db.insert(schema.testTypes).values({
    name: 'PAPI Kostick',
    slug: 'papi-kostick',
    type: 'personality',
    description: 'Perception and Preference Inventory — mengukur preferensi perilaku di lingkungan kerja',
    config: {
      timeLimit: 20,
      allowSkip: false,
      randomize: true,
      questionsPerPage: 1,
      instructions: [
        'Setiap soal terdiri dari dua pernyataan (A dan B)',
        'Pilih satu pernyataan yang PALING menggambarkan diri Anda',
        'Tidak ada jawaban benar atau salah',
        'Jawablah dengan jujur sesuai diri Anda, bukan yang ideal',
      ],
    },
    questions: papiQuestions,
    scoringConfig: {
      algorithm: 'paired_choice',
      dimensions: papiDimensions,
      interpretations: {
        ldr: { ranges: [
          { min: 0, max: 2, label: 'Low', description: 'Cenderung mengikuti' },
          { min: 3, max: 5, label: 'Medium', description: 'Seimbang memimpin/mengikuti' },
          { min: 6, max: 8, label: 'High', description: 'Cenderung memimpin' },
        ]},
        dec: { ranges: [
          { min: 0, max: 2, label: 'Low', description: 'Cenderung hati-hati' },
          { min: 3, max: 5, label: 'Medium', description: 'Seimbang' },
          { min: 6, max: 8, label: 'High', description: 'Pengambil keputusan cepat' },
        ]},
        org: { ranges: [
          { min: 0, max: 2, label: 'Low', description: 'Cenderung fleksibel' },
          { min: 3, max: 5, label: 'Medium', description: 'Seimbang' },
          { min: 6, max: 8, label: 'High', description: 'Sangat terorganisir' },
        ]},
      },
    },
    isActive: true,
  })
  console.log('  ✓ PAPI Kostick')

  // Insert EPPS
  await db.insert(schema.testTypes).values({
    name: 'EPPS',
    slug: 'epps',
    type: 'personality',
    description: 'Edwards Personal Preference Schedule — mengukur kebutuhan dan motivasi personal',
    config: {
      timeLimit: 15,
      allowSkip: true,
      randomize: true,
      questionsPerPage: 5,
      instructions: [
        'Baca setiap pernyataan dengan teliti',
        'Pilih Ya atau Tidak untuk setiap pernyataan',
        'Jawab dengan jujur sesuai diri Anda',
      ],
    },
    questions: eppsQuestions,
    scoringConfig: {
      algorithm: 'dimension_sum',
      dimensions: eppsDimensions,
      interpretations: {
        ach: { ranges: [
          { min: 0, max: 40, label: 'Low', description: 'Kurang termotivasi oleh prestasi' },
          { min: 41, max: 70, label: 'Medium', description: 'Motivasi prestasi cukup' },
          { min: 71, max: 100, label: 'High', description: 'Sangat termotivasi oleh prestasi' },
        ]},
        ord: { ranges: [
          { min: 0, max: 40, label: 'Low', description: 'Cenderung kurang teratur' },
          { min: 41, max: 70, label: 'Medium', description: 'Cukup teratur' },
          { min: 71, max: 100, label: 'High', description: 'Sangat membutuhkan keteraturan' },
        ]},
      },
    },
    isActive: true,
  })
  console.log('  ✓ EPPS')

  console.log('\nSeed complete! 3 test types inserted.')
  await client.end()
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
