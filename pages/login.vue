<template>
  <div class="w-full min-h-screen flex items-center justify-center bg-background p-4">
    <UiCard class="w-full max-w-md">
      <UiCardHeader class="space-y-3 pb-6 pt-8 px-8">
        <div class="flex justify-center mb-2">
          <div class="size-14 rounded-control bg-primary/10 flex items-center justify-center overflow-hidden">
            <img v-if="logo" :src="logo" alt="" class="size-full object-contain p-2" />
            <Icon v-else icon="lucide:brain" class="size-7 text-primary" />
          </div>
        </div>
        <UiCardTitle class="text-2xl text-center">{{ systemName }}</UiCardTitle>
        <UiCardDescription class="text-base text-center">
          {{ tagline }}
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent class="px-8 pb-8">
        <div
          v-if="systemLocked || maintenanceMode"
          class="mb-4 rounded-md border px-3 py-3 text-sm"
          :class="systemLocked ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-amber-500/40 bg-amber-500/10 text-amber-800'"
        >
          <div class="flex gap-3">
            <Icon
              :icon="systemLocked ? 'lucide:lock' : 'lucide:construction'"
              class="size-5 shrink-0 mt-0.5"
            />
            <div class="min-w-0 space-y-0.5">
              <p class="font-medium">
                {{ systemLocked ? 'Akses sistem ditangguhkan' : 'Pemeliharaan sistem' }}
              </p>
              <p class="text-xs opacity-90">
                {{ systemLocked
                  ? 'Sistem sedang dikunci. Silakan hubungi administrator untuk informasi lebih lanjut.'
                  : (maintenanceMessage || 'Sistem sedang dalam pemeliharaan. Silakan coba kembali nanti.') }}
              </p>
            </div>
          </div>
        </div>
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div class="space-y-2">
            <UiLabel for="email" class="text-sm">Email</UiLabel>
            <UiInput
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              required
              class="h-11"
            />
          </div>
          <div class="space-y-2">
            <UiLabel for="password" class="text-sm">Password</UiLabel>
            <UiInput
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              class="h-11"
            />
          </div>

          <UiButton type="submit" class="w-full h-11" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </UiButton>

          <UiButton
            v-if="devToolsEnabled"
            type="button"
            variant="outline"
            class="w-full h-10 text-sm text-muted-foreground"
            @click="fillDevCreds"
          >
            <Icon icon="lucide:bug" class="size-3.5 mr-2" />
            Fill Dev Credentials
          </UiButton>

          <p v-if="error" class="text-sm text-destructive text-center">{{ error }}</p>
        </form>
      </UiCardContent>
    </UiCard>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'login',
})

const runtimeConfig = useRuntimeConfig()
const devToolsEnabled = computed(() => import.meta.dev || !!runtimeConfig.public.devTestTools)

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { login, isAuthenticated } = useAuth()
const { systemName, tagline, logo, maintenanceMode, maintenanceMessage, systemLocked, refresh: refreshAppSettings } = useAppSettings()

onMounted(() => {
  refreshAppSettings()
  if (isAuthenticated.value) {
    navigateTo('/')
  } else if (devToolsEnabled.value) {
    email.value = 'admin@psy.test'
    password.value = 'admin123'
  }
})

function fillDevCreds() {
  email.value = 'admin@psy.test'
  password.value = 'admin123'
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    navigateTo('/')
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
