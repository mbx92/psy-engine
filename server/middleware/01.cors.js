import { isOriginAllowed } from '~~/server/utils/cors'

/**
 * CORS for Cloudflare Tunnel (and any public origin) calling this app on a LAN IP.
 * Preflight must succeed here — auth middleware would otherwise 401 OPTIONS.
 */
export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin')

  if (origin && isOriginAllowed(origin)) {
    setHeader(event, 'Access-Control-Allow-Origin', origin)
    setHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setHeader(event, 'Vary', 'Origin')
  }

  setHeader(event, 'Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS')
  setHeader(
    event,
    'Access-Control-Allow-Headers',
    getHeader(event, 'access-control-request-headers') || 'Authorization,Content-Type,Accept',
  )
  setHeader(event, 'Access-Control-Max-Age', '86400')

  if (getHeader(event, 'access-control-request-private-network') === 'true') {
    setHeader(event, 'Access-Control-Allow-Private-Network', 'true')
  }

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
