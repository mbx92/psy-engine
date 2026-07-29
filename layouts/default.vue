<template>
  <div class="min-h-screen flex flex-col bg-background">
    <!-- Top Navigation -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="flex h-14 items-center px-4 gap-4">
        <UiSheet v-model:open="mobileMenuOpen">
          <UiSheetTrigger as-child>
            <UiButton variant="ghost" size="icon" class="md:hidden">
              <Icon icon="lucide:menu" class="size-5" />
            </UiButton>
          </UiSheetTrigger>
          <UiSheetContent side="left" class="w-64 p-0">
            <div class="p-6 border-b">
              <div class="flex items-center gap-2">
                <img v-if="logo" :src="logo" alt="" class="size-8 object-contain" />
                <Icon v-else icon="lucide:brain" class="size-5 text-primary" />
                <div class="min-w-0">
                  <h2 class="font-semibold text-lg truncate">{{ systemName }}</h2>
                  <p class="text-sm text-muted-foreground truncate">{{ tagline }}</p>
                </div>
              </div>
            </div>
            <nav class="p-4 space-y-1">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                :class="{ 'bg-accent text-accent-foreground': isActive(item.to) }"
                @click="mobileMenuOpen = false"
              >
                <Icon :icon="item.icon" class="size-4 shrink-0" />
                {{ item.label }}
              </NuxtLink>
            </nav>
          </UiSheetContent>
        </UiSheet>

        <NuxtLink to="/" class="flex items-center gap-2 font-semibold min-w-0">
          <img v-if="logo" :src="logo" alt="" class="size-6 object-contain shrink-0" />
          <Icon v-else icon="lucide:brain" class="size-5 text-primary shrink-0" />
          <span class="truncate">{{ systemName }}</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1 ml-6">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            :class="{ 'bg-accent text-accent-foreground': isActive(item.to) }"
          >
            <Icon :icon="item.icon" class="size-4 shrink-0" />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="flex-1" />

        <!-- Dark Mode Toggle -->
        <UiButton
          variant="ghost"
          size="icon"
          class="h-9 w-9"
          :title="colorMode.preference === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleColorMode"
        >
          <Icon v-if="colorMode.value === 'dark'" icon="lucide:sun" class="size-4" />
          <Icon v-else icon="lucide:moon" class="size-4" />
        </UiButton>

        <UiDropdownMenu v-if="user">
          <UiDropdownMenuTrigger as-child>
            <UiButton
              variant="ghost"
              class="h-9 gap-2 rounded-full pl-1.5 pr-3 hover:bg-accent"
            >
              <UiAvatar class="h-7 w-7 shrink-0 border-2 border-border">
                <UiAvatarFallback class="text-xs">{{ user.name?.charAt(0)?.toUpperCase() || 'U' }}</UiAvatarFallback>
              </UiAvatar>
              <span class="max-w-[10rem] truncate text-sm font-medium">{{ user.name }}</span>
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent class="w-56" align="end">
            <UiDropdownMenuLabel class="font-normal">
              <div class="flex flex-col space-y-1">
                <p class="text-sm font-medium leading-none">{{ user.name }}</p>
                <p class="text-xs leading-none text-muted-foreground">{{ user.email }}</p>
              </div>
            </UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem @click="handleLogout">
              <Icon icon="lucide:log-out" class="mr-2 size-4" />
              Log out
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </header>

    <main class="flex-1 p-4 md:p-6 lg:p-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
const mobileMenuOpen = ref(false)
const route = useRoute()

const { user, can, logout } = useAuth()
const { systemName, tagline, logo, refresh: refreshAppSettings } = useAppSettings()
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

useHead(() => ({
  title: systemName.value,
}))

onMounted(() => {
  refreshAppSettings()
})

const navItems = computed(() => [
  { label: 'Dashboard', to: '/', icon: 'lucide:layout-dashboard', show: true },
  { label: 'Test Types', to: '/admin/test-types', icon: 'lucide:clipboard-list', show: can('tests:read') },
  { label: 'Participants', to: '/admin/participants', icon: 'lucide:users', show: can('participants:read') },
  { label: 'Sessions', to: '/admin/sessions', icon: 'lucide:play-circle', show: can('sessions:read') },
  { label: 'Psikogram', to: '/admin/psikograms', icon: 'lucide:file-text', show: can('psikograms:read') },
  { label: 'Reports', to: '/admin/reports', icon: 'lucide:bar-chart-3', show: can('reports:read') },
  { label: 'Activity Log', to: '/admin/activity-logs', icon: 'lucide:scroll-text', show: can('activity:read') },
  { label: 'Settings', to: '/settings', icon: 'lucide:settings', show: can('settings:read') },
].filter(i => i.show))

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  await logout()
  navigateTo('/login')
}
</script>

<style>
@media print {
  header {
    display: none !important;
  }
}
</style>
