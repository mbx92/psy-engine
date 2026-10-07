import { rateLimitSettings } from '~~/db/schema/rateLimitSettings'
import { defaultRateLimitSettings, rateLimitSettingsSchema } from '~~/utils/rateLimitSettings'
export async function getRateLimitSettings() {
  const [row] = await useDB().select().from(rateLimitSettings).limit(1)
  return { settings: row ? rateLimitSettingsSchema.parse(row.policies) : defaultRateLimitSettings(), revision: row?.revision || 'default' }
}
