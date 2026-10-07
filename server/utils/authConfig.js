import { randomBytes } from 'node:crypto'
let developmentSecret
export function getAuthSecret() {
  const secret = process.env.JWT_SECRET?.trim()
  if (secret && secret.length >= 32 && !/change[-_ ]?me|change-in-production|replace-with/i.test(secret)) return secret
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be a non-default random secret of at least 32 characters')
  developmentSecret ||= randomBytes(48).toString('hex')
  return developmentSecret
}
export function authCookieOptions() {
  // Enable for the public HTTPS hostname; LAN QA can keep this false.
  return { httpOnly: true, secure: process.env.AUTH_COOKIE_SECURE === 'true', sameSite: 'lax', path: '/', maxAge: 7 * 86400 }
}
