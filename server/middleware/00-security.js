export default defineEventHandler(event => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'X-Frame-Options', 'DENY')
  setHeader(event, 'Referrer-Policy', 'no-referrer')
  setHeader(event, 'Content-Security-Policy', "frame-ancestors 'none'; base-uri 'self'; object-src 'none'")
  if (event.path?.startsWith('/api/')) setHeader(event, 'Cache-Control', 'no-store')
  if (!event.path?.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(event.method)) return
  const origin = getHeader(event, 'origin')
  const expectedOrigin = process.env.APP_ORIGIN || getRequestURL(event, { xForwardedHost: false, xForwardedProto: false }).origin
  if (origin && origin !== expectedOrigin) throw createError({ statusCode: 403, message: 'Cross-origin request rejected' })
  if (getHeader(event, 'sec-fetch-site') === 'cross-site') throw createError({ statusCode: 403, message: 'Cross-site request rejected' })
  if (getHeader(event, 'content-length') !== '0' && getHeader(event, 'content-type') && !getHeader(event, 'content-type').toLowerCase().startsWith('application/json')) {
    throw createError({ statusCode: 415, message: 'Use application/json' })
  }
})
