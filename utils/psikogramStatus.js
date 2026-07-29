export function psikogramStatusVariant(status) {
  if (status === 'final') return 'final'
  if (status === 'draft') return 'draft'
  return 'secondary'
}

export function psikogramStatusLabel(status) {
  if (status === 'final') return 'Final'
  if (status === 'draft') return 'Draft'
  return status || '—'
}

export function psikogramRecommendationVariant(recommendation) {
  if (recommendation === 'recommended') return 'recommended'
  if (recommendation === 'not_recommended') return 'not_recommended'
  return 'secondary'
}

export function psikogramRecommendationLabel(recommendation) {
  if (recommendation === 'recommended') return 'Disarankan'
  if (recommendation === 'not_recommended') return 'Tidak Disarankan'
  return recommendation || '—'
}

export function psikogramRatingVariant(rating) {
  const key = `rating_${rating}`
  if (['rating_R', 'rating_K', 'rating_C', 'rating_B', 'rating_T'].includes(key)) return key
  return 'outline'
}
