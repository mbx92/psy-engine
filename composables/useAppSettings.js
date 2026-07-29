const DEFAULTS = {
  systemName: 'PsyEngine',
  tagline: 'Psychology Test System',
  timezone: 'Asia/Jakarta',
  logo: null,
  maintenanceMode: false,
  maintenanceMessage: null,
  systemLocked: false,
}

export function useAppSettings() {
  const settings = useState('app-settings', () => ({ ...DEFAULTS }))
  const loaded = useState('app-settings-loaded', () => false)
  const loading = useState('app-settings-loading', () => false)

  async function refresh() {
    if (loading.value) return settings.value
    loading.value = true
    try {
      const data = await $fetch('/api/public/app-settings')
      if (data?.settings) {
        settings.value = { ...DEFAULTS, ...data.settings }
        loaded.value = true
      }
    } catch {
      // Keep defaults
    } finally {
      loading.value = false
    }
    return settings.value
  }

  function applyLocal(patch) {
    settings.value = { ...settings.value, ...patch }
  }

  return {
    settings,
    loaded,
    loading,
    refresh,
    applyLocal,
    systemName: computed(() => settings.value.systemName || DEFAULTS.systemName),
    tagline: computed(() => settings.value.tagline || DEFAULTS.tagline),
    timezone: computed(() => settings.value.timezone || DEFAULTS.timezone),
    logo: computed(() => settings.value.logo || null),
    maintenanceMode: computed(() => !!settings.value.maintenanceMode),
    maintenanceMessage: computed(() => settings.value.maintenanceMessage || ''),
    systemLocked: computed(() => !!settings.value.systemLocked),
  }
}
