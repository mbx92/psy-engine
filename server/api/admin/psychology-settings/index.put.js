import { psychologySettings } from '~~/db/schema/psychologySettings'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody, psychologySettingsSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SETTINGS_UPDATE)

  const body = validateBody(psychologySettingsSchema, await readBody(event))
  const db = useDB()

  const [existing] = await db.select({ id: psychologySettings.id }).from(psychologySettings).limit(1)

  let saved
  if (existing) {
    [saved] = await db.update(psychologySettings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(psychologySettings.id, existing.id))
      .returning()
  } else {
    [saved] = await db.insert(psychologySettings).values(body).returning()
  }

  return { settings: saved }
})
