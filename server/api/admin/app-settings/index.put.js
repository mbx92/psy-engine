import { appSettings } from '~~/db/schema/appSettings'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, appSettingsSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SETTINGS_UPDATE)

  const body = validateBody(appSettingsSchema, await readBody(event))
  const db = useDB()

  const [existing] = await db.select({ id: appSettings.id }).from(appSettings).limit(1)

  let saved
  if (existing) {
    [saved] = await db.update(appSettings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(appSettings.id, existing.id))
      .returning()
  } else {
    [saved] = await db.insert(appSettings).values(body).returning()
  }

  return { settings: saved }
})
