import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { buildAllReports } from '~~/server/utils/reportBuilders'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.REPORTS_READ)

  const db = useDB()
  const query = getQuery(event)
  const reports = await buildAllReports(db, query)

  return {
    generatedAt: new Date().toISOString(),
    ...reports,
  }
})
