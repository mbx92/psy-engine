/**
 * Parse pagination query params.
 * Returns null when neither `page` nor `limit` is provided (legacy: return all).
 */
export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const hasPagination = query.page != null || query.limit != null
  if (!hasPagination) return null

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

export function paginationMeta({ page, limit, total }) {
  const safeTotal = Number(total) || 0
  const totalPages = Math.max(1, Math.ceil(safeTotal / limit))
  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  }
}
