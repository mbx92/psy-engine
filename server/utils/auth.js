import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { eq, and, gt, lt } from 'drizzle-orm'
import { authSessions } from '~~/db/schema/authSessions'
import { users } from '~~/db/schema/users'
import { getAuthSecret, authCookieOptions } from './authConfig.js'

const SALT_ROUNDS = 10

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, getAuthSecret(), { expiresIn: '7d', algorithm: 'HS256' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getAuthSecret(), { algorithms: ['HS256'] })
  } catch {
    return null
  }
}

export function getTokenFromEvent(event) {
  const header = getHeader(event, 'authorization')
  if (header?.startsWith('Bearer ')) {
    return header.slice(7)
  }
  // EventSource uses same-origin cookies. Do not accept URL tokens.
  const cookieToken = getCookie(event, 'psy-token')
  if (cookieToken) return cookieToken
  return null
}

export async function createAuthSession(event, user) {
  const id = randomUUID()
  const db = useDB()
  await db.delete(authSessions).where(lt(authSessions.expiresAt, new Date()))
  await db.insert(authSessions).values({ id, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) })
  const token = signToken({ userId: user.id, sid: id })
  setCookie(event, 'psy-token', token, authCookieOptions())
  return token
}
export function clearAuthCookie(event) {
  deleteCookie(event, 'psy-token', authCookieOptions())
  deleteCookie(event, 'psy-user', { path: '/' })
}
export async function resolveAuthSession(payload) {
  if (!payload?.sid || !Number.isInteger(payload.userId)) return null
  const db = useDB()
  const [row] = await db.select({ userId: users.id, email: users.email, role: users.role, isActive: users.isActive, sid: authSessions.id })
    .from(authSessions).innerJoin(users, eq(users.id, authSessions.userId))
    .where(and(eq(authSessions.id, payload.sid), eq(users.id, payload.userId), gt(authSessions.expiresAt, new Date()))).limit(1)
  return row?.isActive ? row : null
}
export async function revokeUserSessions(userId, db = useDB()) {
  await db.delete(authSessions).where(eq(authSessions.userId, userId))
}
