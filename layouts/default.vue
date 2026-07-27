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
              <h2 class="font-semibold text-lg">PsyEngine</h2>
              <p class="text-sm text-muted-foreground">Psychology Test System</p>
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

        <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
          <Icon icon="lucide:brain" class="size-5 text-primary" />
          PsyEngine
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

        <UiDropdownMenu v-if="user">
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="ghost" class="relative h-8 w-8 rounded-full">
              <UiAvatar class="h-8 w-8">
                <UiAvatarFallback>{{ user.name?.charAt(0)?.toUpperCase() || 'U' }}</UiAvatarFallback>
              </UiAvatar>
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

const navItems = computed(() => [
  { label: 'Dashboard', to: '/', icon: 'lucide:layout-dashboard', show: true },
  { label: 'Test Types', to: '/admin/test-types', icon: 'lucide:clipboard-list', show: can('tests:read') },
  { label: 'Participants', to: '/admin/participants', icon: 'lucide:users', show: can('participants:read') },
  { label: 'Sessions', to: '/admin/sessions', icon: 'lucide:play-circle', show: can('sessions:read') },
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
