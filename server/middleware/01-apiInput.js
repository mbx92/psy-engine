import { assertUuid, validateFilterQuery } from '../utils/input.js'
export default defineEventHandler(event => {
  const path = event.path?.split('?')[0] || ''
  if (!path.startsWith('/api/')) return
  const parts = path.slice(5).split('/')
  let id
  if (parts[0] === 'participants' && parts[1] && parts[1] !== 'import') id = parts[1]
  if (parts[0] === 'sessions' && parts[1] && !['token', 'export', 'compare', 'monitoring'].includes(parts[1])) id = parts[1]
  if (parts[0] === 'admin' && ['test-types', 'psikograms', 'open-invitations'].includes(parts[1]) && parts[2] && parts[2] !== 'analyze') id = parts[2]
  if (parts[0] === 'admin' && parts[1] === 'psikograms' && parts[2] === 'analyze') id = parts[3]
  if (id !== undefined) assertUuid(id)
  if (event.method === 'GET' && !path.includes('/token/')) validateFilterQuery(getQuery(event))
})
