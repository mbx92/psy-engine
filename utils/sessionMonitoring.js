export function connectionState(session, now = Date.now()) {
  if (!['pending', 'in_progress'].includes(session.status)) return 'ended'
  const seen = Date.parse(session.monitoring?.receivedAt || '')
  if (!Number.isFinite(seen)) return 'unknown'
  if (now - seen > 45000) return 'stale'
  return session.monitoring.visibility === 'hidden' ? 'hidden' : 'online'
}

export function needsAttention(session, now = Date.now()) {
  return ['pending', 'in_progress'].includes(session.status)
    && (['stale', 'hidden'].includes(connectionState(session, now)) || session.monitoring?.saveState === 'error')
}
