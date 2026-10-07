export default defineNuxtRouteMiddleware(async () => {
  const { fetchMe } = useAuth()
  if (!await fetchMe()) return navigateTo('/login')
})
