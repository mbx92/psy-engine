import { appSettings } from '~~/db/schema/appSettings'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { validateBody } from '~~/server/utils/validation'

const schema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(2000).optional().nullable(),
  systemLocked: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SYSTEM_MANAGE)

  const body = validateBody(schema, await readBody(event))
  const db = useDB()
  const [existing] = await db.select({ id: appSettings.id }).from(appSettings).limit(1)

  const patch = { updatedAt: new Date() }
  if (body.maintenanceMode !== undefined) patch.maintenanceMode = body.maintenanceMode
  if (body.maintenanceMessage !== undefined) patch.maintenanceMessage = body.maintenanceMessage
  if (body.systemLocked !== undefined) patch.systemLocked = body.systemLocked

  const notes = []
  if (body.systemLocked === true) notes.push('system locked')
  if (body.systemLocked === false) notes.push('system unlocked')
  if (body.maintenanceMode === true) notes.push('maintenance enabled')
  if (body.maintenanceMode === false) notes.push('maintenance disabled')
  if (body.maintenanceMessage !== undefined) notes.push('maintenance message updated')

  event.context.activityLog = {
    action: 'system.status_update',
    category: 'system',
    message: notes.length ? `System status updated: ${notes.join(', ')}` : 'System status updated',
    level: body.systemLocked === true ? 'warning' : 'info',
  }

  let saved
  if (existing) {
    [saved] = await db.update(appSettings).set(patch).where(eq(appSettings.id, existing.id)).returning({
      maintenanceMode: appSettings.maintenanceMode,
      maintenanceMessage: appSettings.maintenanceMessage,
      systemLocked: appSettings.systemLocked,
    })
  } else {
    [saved] = await db.insert(appSettings).values({
      maintenanceMode: body.maintenanceMode ?? false,
      maintenanceMessage: body.maintenanceMessage ?? null,
      systemLocked: body.systemLocked ?? false,
    }).returning({
      maintenanceMode: appSettings.maintenanceMode,
      maintenanceMessage: appSettings.maintenanceMessage,
      systemLocked: appSettings.systemLocked,
    })
  }

  return { settings: saved }
})
