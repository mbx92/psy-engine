import { appSettings } from '~~/db/schema/appSettings'
import { eq } from 'drizzle-orm'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { requirePermission } from '~~/server/utils/access'
import { getSystemFlags } from '~~/server/utils/systemFlags'

export default defineEventHandler(async (event) => {
  await requirePermission(event, PERMISSIONS.SYSTEM_MANAGE)
  return { settings: await getSystemFlags() }
})
