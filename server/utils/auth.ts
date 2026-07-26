import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'psy-engine-secret-key-change-in-production'
const SALT_ROUNDS = 10

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { userId: number; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: number; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string }
  } catch {
    return null
  }
}

export function getTokenFromEvent(event: any): string | null {
  const header = getHeader(event, 'authorization')
  if (header?.startsWith('Bearer ')) {
    return header.slice(7)
  }
  return null
}
