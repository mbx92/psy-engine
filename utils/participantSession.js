const FLOW_KEY = 'psy-participant-flow'

/** Persist join→take flow so we can clear it after finish. */
export function saveParticipantFlow(payload) {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({
      ...payload,
      savedAt: Date.now(),
    }))
  } catch {
    // private mode / quota
  }
}

export function readParticipantFlow() {
  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(FLOW_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Clear participant take-flow cache after a test finishes.
 * Does NOT clear admin auth cookies (psy-token / psy-user).
 */
export function clearParticipantClientState() {
  if (!import.meta.client) return
  try {
    sessionStorage.removeItem(FLOW_KEY)
    const keys = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && (k.startsWith('psy-take-') || k.startsWith('psy-participant-'))) keys.push(k)
    }
    keys.forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // ignore
  }
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('psy-take-') || k.startsWith('psy-participant-'))) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
