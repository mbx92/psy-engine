/**
 * Seed the RBAC catalog: permissions, system roles (admin/operator),
 * and the role -> permission assignments that reproduce the app's
 * previous hardcoded behavior. Safe to re-run (idempotent upserts).
 *
 * Run: node scripts/seed-rbac.mjs
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and } from 'drizzle-orm'
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
  { key: 'settings:read', resource: 'settings', action: 'read', label: 'View settings' },
  { key: 'settings:update', resource: 'settings', action: 'update', label: 'Update settings' },
  { key: 'rbac:manage', resource: 'rbac', action: 'manage', label: 'Manage roles & permissions' },
]

const ROLE_CATALOG = [
  { name: 'admin', label: 'Admin', isSystem: true },
  { name: 'operator', label: 'Operator', isSystem: true },
]

const OPERATOR_PERMISSION_KEYS = [
  'tests:read', 'tests:create', 'tests:update',
  'participants:read', 'participants:create', 'participants:update',
  'sessions:read', 'sessions:manage',
  'settings:read', 'settings:update',
]

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

  const adminRole = roleByName.admin
  const operatorRole = roleByName.operator

  let assigned = 0
  for (const perm of allPermissions) {
    const existing = await db.select().from(schema.rolePermissions)
      .where(and(eq(schema.rolePermissions.roleId, adminRole.id), eq(schema.rolePermissions.permissionId, perm.id)))
      .limit(1)
    if (!existing.length) {
      await db.insert(schema.rolePermissions).values({ roleId: adminRole.id, permissionId: perm.id })
      assigned++
    }
  }

  for (const key of OPERATOR_PERMISSION_KEYS) {
    const perm = permByKey[key]
    const existing = await db.select().from(schema.rolePermissions)
      .where(and(eq(schema.rolePermissions.roleId, operatorRole.id), eq(schema.rolePermissions.permissionId, perm.id)))
      .limit(1)
    if (!existing.length) {
      await db.insert(schema.rolePermissions).values({ roleId: operatorRole.id, permissionId: perm.id })
      assigned++
    }
  }
  console.log(`  ✓ ${assigned} new role/permission assignments (admin: all, operator: subset)`)

  console.log('\nRBAC seed complete.')
  await client.end()
}

seed().catch((err) => {
  console.error('RBAC seed failed:', err)
  process.exit(1)
})
