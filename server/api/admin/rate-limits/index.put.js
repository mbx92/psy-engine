import { randomUUID } from 'node:crypto'
import { rateLimitSettings } from '~~/db/schema/rateLimitSettings'
import { rateLimitSettingsSchema } from '~~/utils/rateLimitSettings'
import { requirePermission } from '~~/server/utils/access'
import { PERMISSIONS } from '~~/server/utils/permissions'
import { validateBody } from '~~/server/utils/validation'
export default defineEventHandler(async event => {
  await requirePermission(event, PERMISSIONS.SETTINGS_UPDATE)
  const policies = validateBody(rateLimitSettingsSchema, await readBody(event))
  // A new revision starts fresh windows on every process after a settings change.
  const values = { policies, revision: randomUUID(), updatedAt: new Date() }
  await useDB().insert(rateLimitSettings).values({ id: 1, ...values })
    .onConflictDoUpdate({ target: rateLimitSettings.id, set: values })
  return { settings: policies }
})
