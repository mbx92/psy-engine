import { z } from 'zod'
import { createError } from 'h3'
export function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export const calendarDateSchema = z.string().refine(isCalendarDate, 'Must be a real calendar date (YYYY-MM-DD)')
export function assertUuid(value, label = 'ID') {
  if (!z.string().uuid().safeParse(value).success) throw createError({ statusCode: 400, message: `${label} must be a valid UUID` })
  return value
}
export function validateFilterQuery(query) {
  for (const key of ['testTypeId', 'participantId', 'sessionId']) if (query[key] != null && query[key] !== '') assertUuid(query[key], key)
  for (const key of ['dateFrom', 'dateTo', 'from', 'to']) {
    if (query[key] == null || query[key] === '') continue
    if (!isCalendarDate(query[key])) throw createError({ statusCode: 400, message: `${key} must be a real calendar date (YYYY-MM-DD)` })
  }
  if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) throw createError({ statusCode: 400, message: 'dateFrom must not exceed dateTo' })
}
