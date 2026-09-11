import assert from 'node:assert/strict'
import { connectionState, needsAttention } from '../utils/sessionMonitoring.js'

const now = Date.parse('2026-09-11T00:00:00Z')
const session = { status: 'in_progress', monitoring: { receivedAt: new Date(now).toISOString(), visibility: 'visible', saveState: 'saved' } }
assert.equal(connectionState(session, now), 'online')
assert.equal(connectionState(session, now + 45000), 'online')
assert.equal(connectionState(session, now + 45001), 'stale')
assert.equal(needsAttention(session, now + 45001), true)
assert.equal(connectionState({ ...session, monitoring: null }, now), 'unknown')
assert.equal(connectionState({ ...session, monitoring: { receivedAt: 'invalid' } }, now), 'unknown')
assert.equal(needsAttention({ ...session, monitoring: null }, now), false)
assert.equal(connectionState({ ...session, monitoring: { ...session.monitoring, visibility: 'hidden' } }, now), 'hidden')
assert.equal(needsAttention({ ...session, monitoring: { ...session.monitoring, saveState: 'error' } }, now), true)
for (const status of ['completed', 'verified', 'abandoned']) {
  const finished = { ...session, status, monitoring: { ...session.monitoring, saveState: 'error' } }
  assert.equal(connectionState(finished, now + 90000), 'ended')
  assert.equal(needsAttention(finished, now + 90000), false)
}
console.log('Monitoring connection and attention checks passed.')
