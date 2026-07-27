export default defineEventHandler(async () => {
  return { success: true, message: 'Logged out (clear token client-side)' }
})
