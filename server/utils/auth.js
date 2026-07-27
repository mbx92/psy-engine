import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'psy-engine-secret-key-change-in-production'
const SALT_ROUNDS = 10

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function getTokenFromEvent(event) {
  const header = getHeader(event, 'authorization')
  if (header?.startsWith('Bearer ')) {
    return header.slice(7)
  }
  // Cookie / query fallback — needed for EventSource (no custom headers)
  const cookieToken = getCookie(event, 'psy-token')
  if (cookieToken) return cookieToken
  const query = getQuery(event)
  if (typeof query.token === 'string' && query.token) return query.token
  return null
}
