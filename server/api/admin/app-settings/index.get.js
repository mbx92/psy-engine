import { appSettings } from '~~/db/schema/appSettings'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SETTINGS_READ)

  const db = useDB()
  const [settings] = await db.select().from(appSettings).limit(1)

  return {
    settings: settings || {
      systemName: 'PsyEngine',
      tagline: 'Psychology Test System',
      timezone: 'Asia/Jakarta',
      logo: null,
    },
  }
})
