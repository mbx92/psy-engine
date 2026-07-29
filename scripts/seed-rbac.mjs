/**
 * Seed the RBAC catalog: permissions, system roles (superadmin/admin/operator),
 * and the role -> permission assignments. Safe to re-run (idempotent upserts).
 *
 * Also ensures a god/superadmin user exists.
 *
 * Run: node scripts/seed-rbac.mjs
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import * as schema from '../db/schema/index.js'

const connectionString = process.env.DATABASE_URL || 'postgres://mbx@127.0.0.1:5432/psy_engine'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

const PERMISSION_CATALOG = [
  { key: 'users:read', resource: 'users', action: 'read', label: 'View users' },
  { key: 'users:create', resource: 'users', action: 'create', label: 'Create users' },
  { key: 'users:update', resource: 'users', action: 'update', label: 'Update users' },
  { key: 'users:delete', resource: 'users', action: 'delete', label: 'Delete users' },
  { key: 'tests:read', resource: 'tests', action: 'read', label: 'View tests' },
  { key: 'tests:create', resource: 'tests', action: 'create', label: 'Create tests' },
  { key: 'tests:update', resource: 'tests', action: 'update', label: 'Update tests' },
  { key: 'tests:delete', resource: 'tests', action: 'delete', label: 'Delete tests' },
  { key: 'participants:read', resource: 'participants', action: 'read', label: 'View participants' },
  { key: 'participants:create', resource: 'participants', action: 'create', label: 'Create participants' },
  { key: 'participants:update', resource: 'participants', action: 'update', label: 'Update participants' },
  { key: 'participants:delete', resource: 'participants', action: 'delete', label: 'Delete participants' },
  { key: 'sessions:read', resource: 'sessions', action: 'read', label: 'View sessions' },
  { key: 'sessions:manage', resource: 'sessions', action: 'manage', label: 'Manage sessions' },
  { key: 'psikograms:read', resource: 'psikograms', action: 'read', label: 'View psikograms' },
  { key: 'psikograms:create', resource: 'psikograms', action: 'create', label: 'Create psikograms' },
  { key: 'psikograms:update', resource: 'psikograms', action: 'update', label: 'Update psikograms' },
  { key: 'psikograms:delete', resource: 'psikograms', action: 'delete', label: 'Delete psikograms' },
  { key: 'settings:read', resource: 'settings', action: 'read', label: 'View settings' },
  { key: 'settings:update', resource: 'settings', action: 'update', label: 'Update settings' },
  { key: 'rbac:manage', resource: 'rbac', action: 'manage', label: 'Manage roles & permissions' },
  { key: 'system:manage', resource: 'system', action: 'manage', label: 'System setup (backup, maintenance, lock)' },
  { key: 'activity:read', resource: 'activity', action: 'read', label: 'View activity log' },
  { key: 'reports:read', resource: 'reports', action: 'read', label: 'View system reports' },
]

const ROLE_CATALOG = [
  { name: 'superadmin', label: 'Superadmin', isSystem: true },
  { name: 'admin', label: 'Admin', isSystem: true },
  { name: 'operator', label: 'Operator', isSystem: true },
]

const OPERATOR_PERMISSION_KEYS = [
  'tests:read', 'tests:create', 'tests:update',
  'participants:read', 'participants:create', 'participants:update',
  'sessions:read', 'sessions:manage',
  'settings:read', 'settings:update',
  'psikograms:read', 'psikograms:create', 'psikograms:update',
  'reports:read',
]

const SUPERADMIN_USER = {
  email: 'god@psy.test',
  name: 'God Superadmin',
  password: 'god123',
  role: 'superadmin',
}

async function ensureRolePermission(roleId, permissionId) {
  const existing = await db.select().from(schema.rolePermissions)
    .where(and(eq(schema.rolePermissions.roleId, roleId), eq(schema.rolePermissions.permissionId, permissionId)))
    .limit(1)
  if (!existing.length) {
    await db.insert(schema.rolePermissions).values({ roleId, permissionId })
    return true
  }
  return false
}

async function seed() {
  console.log('Seeding RBAC catalog...')

  for (const perm of PERMISSION_CATALOG) {
    await db.insert(schema.permissions).values(perm).onConflictDoNothing({ target: schema.permissions.key })
  }
  console.log(`  ✓ ${PERMISSION_CATALOG.length} permissions`)

  for (const role of ROLE_CATALOG) {
    await db.insert(schema.roles).values(role).onConflictDoNothing({ target: schema.roles.name })
  }
  console.log(`  ✓ ${ROLE_CATALOG.length} roles`)

  const allRoles = await db.select().from(schema.roles)
  const allPermissions = await db.select().from(schema.permissions)
  const roleByName = Object.fromEntries(allRoles.map((r) => [r.name, r]))
  const permByKey = Object.fromEntries(allPermissions.map((p) => [p.key, p]))

  const superadminRole = roleByName.superadmin
  const adminRole = roleByName.admin
  const operatorRole = roleByName.operator

  let assigned = 0

  // Superadmin: ALL permissions including system:manage
  for (const perm of allPermissions) {
    if (await ensureRolePermission(superadminRole.id, perm.id)) assigned++
  }

  // Admin: all except system:manage
  for (const perm of allPermissions) {
    if (perm.key === 'system:manage') continue
    if (await ensureRolePermission(adminRole.id, perm.id)) assigned++
  }

  // Operator: subset
  for (const key of OPERATOR_PERMISSION_KEYS) {
    const perm = permByKey[key]
    if (!perm) continue
    if (await ensureRolePermission(operatorRole.id, perm.id)) assigned++
  }
  console.log(`  ✓ ${assigned} new role/permission assignments`)

  // Ensure god/superadmin user
  const [existingUser] = await db.select().from(schema.users)
    .where(eq(schema.users.email, SUPERADMIN_USER.email))
    .limit(1)

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(SUPERADMIN_USER.password, 10)
    await db.insert(schema.users).values({
      email: SUPERADMIN_USER.email,
      name: SUPERADMIN_USER.name,
      passwordHash,
      role: SUPERADMIN_USER.role,
      isActive: true,
    })
    console.log(`  ✓ Created superadmin user ${SUPERADMIN_USER.email} / ${SUPERADMIN_USER.password}`)
  } else if (existingUser.role !== 'superadmin') {
    await db.update(schema.users)
      .set({ role: 'superadmin', updatedAt: new Date() })
      .where(eq(schema.users.id, existingUser.id))
    console.log(`  ✓ Promoted ${SUPERADMIN_USER.email} to superadmin`)
  } else {
    console.log(`  ✓ Superadmin user already exists (${SUPERADMIN_USER.email})`)
  }

  console.log('\nRBAC seed complete.')
  await client.end()
}

seed().catch((err) => {
  console.error('RBAC seed failed:', err)
  process.exit(1)
})
