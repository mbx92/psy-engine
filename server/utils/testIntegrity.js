import { createError } from 'h3'
import { questionOptions } from './participantTest.js'
export const subtestsFor = test => (test.config?.hasSubtests || test.config?.subtestTimeLimit) ? (test.config?.subtests || []) : []
export const subtestKey = q => q.subtestKey || q.subtest
export function validateAnswers(test, answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw createError({ statusCode: 400, message: 'answers must be an object' })
  const questions = new Map((test.questions || []).filter(q => q.type !== 'instruction').map(q => [String(q.id), q]))
  for (const [key, value] of Object.entries(answers)) {
    const q = questions.get(key)
    if (!q || !questionOptions(q).some(o => o.id === value)) throw createError({ statusCode: 400, message: 'Unknown question or invalid answer option' })
  }
  return answers
}
export function initialTiming(test, now = Date.now()) {
  const minutes = Number(test.config?.timeLimit) || 0
  return { deadlineAt: !subtestsFor(test).length && minutes > 0 ? new Date(now + minutes * 60000).toISOString() : null, subtests: {}, activeSubtest: null }
}
export function advanceSubtest(test, timing, code, now = Date.now()) {
  const list = subtestsFor(test)
  const keys = list.map(s => s.key || s.code)
  const index = keys.indexOf(code)
  if (index < 0) throw createError({ statusCode: 400, message: 'Unknown subtest' })
  const next = structuredClone(timing)
  if (next.activeSubtest === code && !next.subtests[code]?.closedAt) return next
  if (next.subtests[code] || index !== keys.indexOf(next.activeSubtest) + 1) throw createError({ statusCode: 409, message: 'Subtests must be started in order and cannot be reopened' })
  if (next.activeSubtest) next.subtests[next.activeSubtest].closedAt = new Date(now).toISOString()
  const seconds = Number(list[index].timeLimit)
  if (!(seconds > 0)) throw createError({ statusCode: 422, message: 'Subtest time limit is not configured' })
  next.subtests[code] = { startedAt: new Date(now).toISOString(), deadlineAt: new Date(now + seconds * 1000).toISOString() }
  next.activeSubtest = code
  return next
}
export function mergeTimedAnswers(test, session, incoming, { now = Date.now(), finalize = false } = {}) {
  validateAnswers(test, incoming)
  const previous = session.answers || {}
  const timing = session.metadata?.timing || initialTiming(test, new Date(session.startedAt).getTime())
  const questions = new Map(test.questions.map(q => [String(q.id), q]))
  const merged = { ...previous }
  const discarded = []
  for (const [id, value] of Object.entries(incoming)) {
    if (previous[id] === value) continue
    const sub = subtestKey(questions.get(id))
    const clock = subtestsFor(test).length ? timing.subtests?.[sub] : timing
    const expired = !clock || clock.closedAt || (clock.deadlineAt && now >= Date.parse(clock.deadlineAt))
    if (expired) { discarded.push(id); continue }
    merged[id] = value
  }
  if (discarded.length && !finalize) throw createError({ statusCode: 409, message: 'Time limit exceeded or subtest not active', data: { code: 'TIME_LIMIT_EXCEEDED', answers: previous } })
  return { answers: merged, discarded }
}
export function progressMetadata(test, metadata = {}) {
  // Clients cannot overwrite battery links, server timing or scoring state.
  const index = metadata.currentQuestionIndex
  return Number.isInteger(index) && index >= 0 && index < test.questions.length ? { currentQuestionIndex: index } : {}
}
export function hasUsableScores(session) {
  return session.scores?.status !== 'failed' && !session.scores?.raw?.error && Object.keys(session.scores?.dimensions || {}).length > 0
}
