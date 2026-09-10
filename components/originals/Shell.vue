<template>
  <div class="contents">
    <a href="#main-content" class="originals-skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">Skip to content</a>

    <aside class="originals-sidebar fixed inset-y-0 left-0 z-40 hidden w-60 flex-col lg:flex">
      <NuxtLink to="/" class="flex min-h-24 items-center gap-3 border-b border-white/10 px-7 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[hsl(var(--originals-highlight))]">
          <img v-if="logo" :src="logo" alt="" class="size-7 object-contain" />
          <OriginalsIcon v-else icon="lucide:brain" class="size-6" />
        </span>
        <span class="min-w-0">
          <span class="block truncate text-lg font-semibold tracking-tight">{{ systemName }}</span>
          <span class="originals-eyebrow mt-1 block text-[hsl(var(--originals-sidebar-muted))]">Originals</span>
        </span>
      </NuxtLink>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <OriginalsNavigation />
      </div>

      <div v-if="can('reports:read')" class="mx-5 mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
        <OriginalsIcon icon="lucide:chart-no-axes-combined" class="mb-3 size-5 text-[hsl(var(--originals-highlight))]" />
        <p class="text-sm font-medium">See the bigger picture.</p>
        <p class="mt-1 text-xs leading-relaxed text-[hsl(var(--originals-sidebar-muted))]">Bring your assessment results together.</p>
        <NuxtLink to="/admin/reports" class="mt-4 flex min-h-8 items-center gap-2 text-xs font-semibold text-[hsl(var(--originals-highlight))] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
          Explore reports <OriginalsIcon icon="lucide:arrow-up-right" class="size-3.5" />
        </NuxtLink>
      </div>
      <div v-if="user" class="flex items-center gap-3 border-t border-white/10 p-5">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium">{{ initials }}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ user.name }}</p>
          <p class="truncate text-xs capitalize text-[hsl(var(--originals-sidebar-muted))]">{{ user.role }}</p>
        </div>
        <button type="button" aria-label="Log out" title="Log out" class="flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" @click="handleLogout">
          <OriginalsIcon icon="lucide:log-out" class="size-4" />
        </button>
      </div>
    </aside>

      <header class="originals-toolbar sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div class="mx-auto flex h-[72px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <UiSheet v-model:open="mobileMenuOpen">
            <UiSheetTrigger as-child>
              <UiButton variant="ghost" size="icon" class="shrink-0 lg:hidden" aria-label="Open navigation">
                <OriginalsIcon icon="lucide:menu" />
              </UiButton>
            </UiSheetTrigger>
            <UiSheetContent side="left" class="originals-sidebar flex w-72 flex-col gap-0 p-0">
              <UiSheetHeader class="border-b border-white/10 px-7 py-6 text-left">
                <UiSheetTitle class="pr-5 text-left text-[hsl(var(--originals-sidebar-ink))]">{{ systemName }}</UiSheetTitle>
                <UiSheetDescription class="text-left text-[hsl(var(--originals-sidebar-muted))]">Your assessment workspace</UiSheetDescription>
              </UiSheetHeader>
              <div class="min-h-0 flex-1 overflow-y-auto"><OriginalsNavigation @navigate="mobileMenuOpen = false" /></div>
              <button type="button" class="originals-nav-link m-4" @click="handleLogout"><OriginalsIcon icon="lucide:log-out" class="size-4" /> Log out</button>
            </UiSheetContent>
          </UiSheet>
          <div class="flex min-w-0 items-center gap-3 text-sm">
            <span class="hidden text-muted-foreground sm:inline">Workspace</span>
            <OriginalsIcon icon="lucide:chevron-right" class="hidden size-3.5 text-muted-foreground sm:block" />
            <span class="truncate font-medium">{{ activeItem?.label || systemName }}</span>
          </div>
          <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
            <span class="hidden rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground sm:inline">Originals</span>
            <ThemeSwitcher />
            <UiButton variant="ghost" size="icon" class="size-9" :aria-label="modeLabel" :title="modeLabel" @click="toggleColorMode">
              <OriginalsIcon :icon="colorMode.value === 'dark' ? 'lucide:sun' : 'lucide:moon'" />
            </UiButton>
            <span v-if="user" class="hidden size-9 items-center justify-center rounded-full border bg-secondary text-xs font-semibold text-secondary-foreground sm:flex" :title="user.name">{{ initials }}</span>
          </div>
        </div>
      </header>
  </div>
</template>

<script setup>
const mobileMenuOpen = ref(false)
const { user, can, logout } = useAuth()
const { systemName, logo } = useAppSettings()
const { activeItem } = useAppNavigation()
const colorMode = useColorMode()
const initials = computed(() => user.value?.name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'U')
const modeLabel = computed(() => colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

async function handleLogout() {
  mobileMenuOpen.value = false
  await logout()
  await navigateTo('/login')
}
</script>
