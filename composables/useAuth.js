export const useAuth = () => {
  // This cookie is only a display cache. The server authorizes from its HttpOnly session.
  const user = useCookie('psy-user', { maxAge: 7 * 86400, sameSite: 'lax', path: '/' })
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {}
  const loading = ref(false)
  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? '')
  const can = permission => (user.value?.permissions || []).includes(permission)
  const canAll = (...permissions) => permissions.every(can)
  const canAny = (...permissions) => permissions.some(can)
  const isAdmin = computed(() => ['admin', 'superadmin'].includes(role.value))
  const isSuperadmin = computed(() => role.value === 'superadmin')
  function getAuthHeaders() { return requestHeaders }
  function migrateFromLocalStorage() {
    if (import.meta.client) localStorage.removeItem('psy-auth')
    return false
  }
  async function login(email, password) {
    loading.value = true
    try {
      const data = await $fetch('/api/auth/login', { method: 'POST', body: { email, password } })
      user.value = data.user
      migrateFromLocalStorage()
      return data
    } finally { loading.value = false }
  }
  async function fetchMe() {
    try {
      const data = await $fetch('/api/auth/me', { headers: getAuthHeaders() })
      user.value = data.user
      return data.user
    } catch (err) {
      if ([401, 403].includes(err?.statusCode || err?.response?.status)) user.value = null
      return null
    }
  }
  async function logout() {
    try { await $fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders() }) }
    catch (err) { if (err?.statusCode !== 401) throw err }
    user.value = null
    migrateFromLocalStorage()
  }
  return { user, role, loading, isAuthenticated, isAdmin, isSuperadmin, can, canAll, canAny, login, fetchMe, logout, getAuthHeaders, migrateFromLocalStorage }
}
