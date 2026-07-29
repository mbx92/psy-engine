export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  verified: 'Verified',
  abandoned: 'Abandoned',
}

/** Badge variant names — matches `badgeVariants` in components/ui/badge */
export const STATUS_BADGE_VARIANTS = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  verified: 'verified',
  abandoned: 'abandoned',
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

export function statusVariant(status) {
  return STATUS_BADGE_VARIANTS[status] || 'secondary'
}
