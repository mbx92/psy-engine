export default defineNuxtRouteMiddleware((to) => {
  // Skip SSR check — token is stored client-only (localStorage)
  if (import.meta.server) return

  const { isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
