import { z } from 'zod'

/** Parse `body` against `schema`; throws a clean 400 on failure, else returns the validated data. */
export function validateBody(schema, body) {
  const result = schema.safeParse(body || {})
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join('; ')
    throw createError({ statusCode: 400, message })
  }
  return result.data
}

const uuid = () => z.string().uuid('Must be a valid UUID')
const dateString = () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format')

// ── Participants ─────────────────────────────────────────────
export const participantCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  birthDate: dateString(),
  gender: z.enum(['L', 'P'], { message: "Gender must be 'L' or 'P'" }),
  phone: z.string().optional().nullable(),
  email: z.union([z.string().email('Must be a valid email'), z.literal(''), z.null()]).optional(),
  nik: z.string().optional().nullable(),
})

export const participantUpdateSchema = participantCreateSchema.partial()

// ── Test Types ───────────────────────────────────────────────
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const testTypeCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().regex(SLUG_PATTERN, 'Slug must be lowercase alphanumeric with hyphens only (e.g. "my-test-2")'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional().nullable(),
  config: z.record(z.string(), z.any()).optional(),
  questions: z.array(z.any()).optional(),
  scoringConfig: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
})

export const testTypeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(SLUG_PATTERN, 'Slug must be lowercase alphanumeric with hyphens only (e.g. "my-test-2")').optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  config: z.record(z.string(), z.any()).optional(),
  questions: z.array(z.any()).optional(),
  scoringConfig: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
})

// ── Sessions ─────────────────────────────────────────────────
export const sessionCreateSchema = z.object({
  testTypeId: uuid(),
  participantId: uuid(),
})

export const openInvitationCreateSchema = z.object({
  testTypeId: uuid().optional(),
  testTypeIds: z.array(uuid()).min(1).optional(),
  label: z.union([z.string().max(255), z.literal('')]).optional().nullable(),
  maxUses: z.union([z.number().int().positive(), z.null()]).optional(),
  expiresAt: z.union([
    z.string().datetime({ offset: true }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    z.literal(''),
    z.null(),
  ]).optional(),
}).superRefine((data, ctx) => {
  const ids = Array.isArray(data.testTypeIds) ? data.testTypeIds.filter(Boolean) : []
  if (!ids.length && !data.testTypeId) {
    ctx.addIssue({ code: 'custom', message: 'Pilih minimal satu jenis tes', path: ['testTypeIds'] })
  }
})

export const openInvitationClaimSchema = participantCreateSchema

export const sessionStatusPatchSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'verified', 'abandoned'], { message: 'Invalid status value' }),
  notes: z.string().optional(),
})

// ── Users ────────────────────────────────────────────────────
export const userCreateSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
})

export const userUpdateSchema = z.object({
  role: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const registerSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email('Must be a valid email').optional(),
}).refine((data) => data.name || data.email, { message: 'Nothing to update' })

// ── RBAC Roles ───────────────────────────────────────────────
export const roleCreateSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]{1,49}$/, 'Role name must be lowercase letters, numbers, or underscores, starting with a letter (2-50 chars)'),
  label: z.string().min(1, 'Role label is required'),
})

export const roleUpdateSchema = z.object({
  label: z.string().min(1, 'Role label cannot be empty').optional(),
  permissionKeys: z.array(z.string()).optional(),
})
