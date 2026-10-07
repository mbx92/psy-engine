import { z } from 'zod'
export const defaultRateLimitSettings = () => ({
  login: { enabled: true, max: 10, windowMinutes: 15 },
  invitationClaim: { enabled: true, max: 20, windowMinutes: 15 },
})
const policy = z.object({
  enabled: z.boolean(),
  max: z.number().int().min(1).max(10000),
  windowMinutes: z.number().int().min(1).max(1440),
}).strict()
export const rateLimitSettingsSchema = z.object({ login: policy, invitationClaim: policy }).strict()
