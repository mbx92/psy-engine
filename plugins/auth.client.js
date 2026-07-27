export default defineNuxtPlugin(() => {
  const { migrateFromLocalStorage, isAuthenticated } = useAuth()
  const route = useRoute()

  // Run after hydration so legacy localStorage migrate cannot mismatch SSR HTML.
  onNuxtReady(async () => {
    const migrated = migrateFromLocalStorage()
    if (migrated && route.path === '/login' && isAuthenticated.value) {
      await navigateTo('/')
    }
  })
})
