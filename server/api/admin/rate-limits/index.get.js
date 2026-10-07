import { requirePermission } from '~~/server/utils/access'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { getRateLimitSettings } from '~~/server/utils/rateLimitSettings'
export default defineEventHandler(async event => {
  await requirePermission(event, PERMISSIONS.SETTINGS_READ)
  const { settings } = await getRateLimitSettings()
  return { settings }
})
