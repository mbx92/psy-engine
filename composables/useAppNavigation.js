export function useAppNavigation() {
  const route = useRoute()
  const { can } = useAuth()

  const navItems = computed(() => [
    { label: 'Dashboard', to: '/', icon: 'lucide:layout-dashboard', group: 'Workspace', show: true },
    { label: 'Test Types', to: '/admin/test-types', icon: 'lucide:clipboard-list', group: 'Workspace', show: can('tests:read') },
    { label: 'Participants', to: '/admin/participants', icon: 'lucide:users', group: 'Workspace', show: can('participants:read') },
    { label: 'Sessions', to: '/admin/sessions', icon: 'lucide:play-circle', group: 'Workspace', show: can('sessions:read') },
    { label: 'Psikogram', to: '/admin/psikograms', icon: 'lucide:file-text', group: 'Insights', show: can('psikograms:read') },
    { label: 'Reports', to: '/admin/reports', icon: 'lucide:bar-chart-3', group: 'Insights', show: can('reports:read') },
    { label: 'Activity Log', to: '/admin/activity-logs', icon: 'lucide:scroll-text', group: 'Management', show: can('activity:read') },
    { label: 'Settings', to: '/settings', icon: 'lucide:settings', group: 'Management', show: can('settings:read') },
  ].filter(item => item.show))

  function isActive(path) {
    return path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`)
  }

  const activeItem = computed(() => navItems.value.find(item => isActive(item.to)))

  return { navItems, isActive, activeItem }
}
