export default defineEventHandler(() => {
  throw createError({ statusCode: 403, message: 'Public registration is disabled. Contact an administrator.' })
})
