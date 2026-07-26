// Server-side
const authToken = process.server ? null : null

export const useAuth = () => {
  // Use Nuxt's built-in useState for SSR-safe state
  const user = useState<{ id: number; email: string; name: string; role: string } | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)
  const loading = ref(false)

  // Hydrate from localStorage on client mount
  if (import.meta.client) {
    const stored = localStorage.getItem('psy-auth')
    if (stored && !token.value) {
      try {
        const parsed = JSON.parse(stored)
        token.value = parsed.token
        user.value = parsed.user
      } catch { /* ignore */ }
    }
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.role ?? '')

  // Permission map — `admin` has everything, others have explicit grants
  const permissionMap: Record<string, string[]> = {
    admin: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'tests:read', 'tests:create', 'tests:update', 'tests:delete',
      'participants:read', 'participants:create', 'participants:update',
      'sessions:read', 'sessions:manage',
      'settings:read', 'settings:update',
    ],
    operator: [
      'tests:read', 'tests:create', 'tests:update',
      'participants:read', 'participants:create', 'participants:update',
      'sessions:read', 'sessions:manage',
      'settings:read', 'settings:update',
    ],
  }

  /** Check if the current user has a specific permission */
  function can(permission: string): boolean {
    const perms = permissionMap[role.value]
    if (!perms) return false
    return perms.includes(permission)
  }

  /** Check if the current user has all specified permissions */
  function canAll(...permissions: string[]): boolean {
    return permissions.every((p) => can(p))
  }

  /** Check if the current user has any of the specified permissions */
  function canAny(...permissions: string[]): boolean {
    return permissions.some((p) => can(p))
  }

  const isAdmin = computed(() => role.value === 'admin')

  function persist() {
    if (import.meta.client) {
      localStorage.setItem('psy-auth', JSON.stringify({
        token: token.value,
        user: user.value,
      }))
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const data: any = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      token.value = data.token
      user.value = data.user
      persist()
      return data
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, name: string) {
    loading.value = true
    try {
      const data: any = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password, name },
      })
      token.value = data.token
      user.value = data.user
      persist()
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return null
    try {
      const data: any = await $fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = data.user
      persist()
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
  }
}
