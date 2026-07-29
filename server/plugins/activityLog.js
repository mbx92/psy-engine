import { logEventActivity } from '~~/server/utils/activityLog'
import { getResponseStatus } from 'h3'

/**
 * Automatically record mutating API activity after each response / error.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('afterResponse', async (event) => {
    try {
      await logEventActivity(event, { statusCode: getResponseStatus(event) })
    } catch {
      // ignore
    }
  })

  nitroApp.hooks.hook('error', async (error, { event }) => {
    if (!event) return
    try {
      await logEventActivity(event, {
        statusCode: error?.statusCode || getResponseStatus(event) || 500,
        errorMessage: error?.message,
      })
    } catch {
      // ignore
    }
  })
})
