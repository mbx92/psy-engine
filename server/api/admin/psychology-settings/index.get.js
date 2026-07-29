import { psychologySettings } from '~~/db/schema/psychologySettings'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SETTINGS_READ)

  const db = useDB()
  const [settings] = await db.select().from(psychologySettings).limit(1)

  return { settings: settings || null }
})
