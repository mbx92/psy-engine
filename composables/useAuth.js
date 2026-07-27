const COOKIE_OPTS = {
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax',
  path: '/',
}

export const useAuth = () => {
  // Cookies keep SSR and client auth state in sync (avoids hydration mismatch).
  const token = useCookie('psy-token', COOKIE_OPTS)
  const user = useCookie('psy-user', COOKIE_OPTS)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.role ?? '')

  // Permissions are resolved server-side (DB-backed RBAC) and attached to
  // the user object by /api/auth/login, /register, /me, and /profile.
  /** Check if the current user has a specific permission */
  function can(permission) {
    const perms = user.value?.permissions
    if (!perms) return false
    return perms.includes(permission)
  }

  /** Check if the current user has all specified permissions */
  function canAll(...permissions) {
    return permissions.every((p) => can(p))
  }

  /** Check if the current user has any of the specified permissions */
  function canAny(...permissions) {
    return permissions.some((p) => can(p))
  }

  const isAdmin = computed(() => role.value === 'admin')

  function persist(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser
  }

  /** One-time migration from legacy localStorage auth (post-hydration only). */
  function migrateFromLocalStorage() {
    if (!import.meta.client || token.value) return false
    const stored = localStorage.getItem('psy-auth')
    if (!stored) return false
    try {
      const parsed = JSON.parse(stored)
      if (parsed?.token && parsed?.user) {
        persist(parsed.token, parsed.user)
        localStorage.removeItem('psy-auth')
        return true
      }
    } catch { /* ignore */ }
    localStorage.removeItem('psy-auth')
    return false
  }

  async function login(email, password) {
    loading.value = true
    try {
      const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      persist(data.token, data.user)
      if (import.meta.client) localStorage.removeItem('psy-auth')
      return data
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, name) {
    loading.value = true
    try {
      const data = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password, name },
      })
      persist(data.token, data.user)
      if (import.meta.client) localStorage.removeItem('psy-auth')
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return null
    try {
      const data = await $fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = data.user
      return data.user
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    token.value = null
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('psy-auth')
    }
  }

  function getAuthHeaders() {
    if (!token.value) return {}
    return { Authorization: `Bearer ${token.value}` }
  }

  return {
    user,
    token,
    role,
    loading,
    isAuthenticated,
    isAdmin,
    can,
    canAll,
    canAny,
    login,
    register,
    fetchMe,
    logout,
    getAuthHeaders,
    migrateFromLocalStorage,
  }
}
