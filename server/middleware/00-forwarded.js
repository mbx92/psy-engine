import { isPrivateHost } from '~~/server/utils/cors'

/**
 * Cloudflare Tunnel on another machine often forwards to http://LAN_IP:PORT.
 * Prefer the public Host so redirects, SSR URLs, and cookies stay on the tunnel hostname.
 */
export default defineEventHandler((event) => {
  const req = event.node?.req
  if (!req?.headers) return

  const xfHost = getHeader(event, 'x-forwarded-host')
  const host = getHeader(event, 'host') || ''

  if (xfHost && isPrivateHost(host)) {
    req.headers.host = xfHost.split(',')[0].trim()
  }

  const xfProto = getHeader(event, 'x-forwarded-proto')
  if (xfProto && !req.headers['x-forwarded-proto']) {
    req.headers['x-forwarded-proto'] = xfProto.split(',')[0].trim()
  }
})
