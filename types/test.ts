/**
 * Test Type — Plugin-like test definition
 *
 * Isi `config` field:
 */
export interface TestConfig {
  /** Waktu pengerjaan dalam menit */
  timeLimit: number
  /** Bisa skip soal? */
  allowSkip: boolean
  /** Acak urutan soal? */
  randomize: boolean
  /** Jumlah soal yang tampil per halaman */
  questionsPerPage: number
  /** Ada subtests? (kayak CFIT: ada Scale 2, Scale 3) */
  subtests?: {
    key: string
    label: string
    timeLimit: number
    questionCount: number
  }[]
  /** Petunjuk pengerjaan */
  instructions: string[]
}

/**
 * Scoring config — aturan bagaimana nilai dihitung
 */
export interface ScoringConfig {
  /** Algoritma scoring */
  algorithm: 'dimension_sum' | 'correct_count' | 'paired_choice' | 'likert_average'

  /** Dimensi/trait yang diukur */
  dimensions: {
    key: string
    label: string
    description?: string
  }[]

  /** Interpretasi per rentang skor */
  interpretations?: {
    dimensionKey: string
    ranges: {
      min: number
      max: number
      label: string
      description: string
    }[]
  }[]

  /** Norma/normalisasi (opsional) */
  norms?: Record<string, number>
}

/**
 * Struktur soal
 */
export interface Question {
  id: string
  /** Nomor urut */
  number: number
  /** Teks soal */
  text: string
  /** Subtest key (kalo ada subtest) */
  subtestKey?: string
  /** Opsi jawaban */
  options: QuestionOption[]
}

export interface QuestionOption {
  id: string
  text: string
  /** Dimensi yang diukur oleh opsi ini */
  dimension?: string
  /** Bobot/nilai dari opsi ini */
  weight?: number
  /** Untuk paired_choice: pasangan dengan opsi lain */
  pairWith?: string
}
