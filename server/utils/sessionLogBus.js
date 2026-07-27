import { EventEmitter } from 'node:events'

/** In-memory fan-out for live session activity (SSE). Single-process only. */
const bus = new EventEmitter()
bus.setMaxListeners(100)

export function publishSessionEvent(sessionId, payload) {
  if (!sessionId) return
  bus.emit(sessionId, payload)
  bus.emit('*', { sessionId, ...payload })
}

export function subscribeSessionEvents(sessionId, handler) {
  bus.on(sessionId, handler)
  return () => bus.off(sessionId, handler)
}
