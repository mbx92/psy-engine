<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <UiCard class="w-full max-w-sm mx-auto">
      <UiCardHeader class="space-y-2 pb-4">
        <div class="flex justify-center mb-2">
          <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon icon="lucide:brain" class="size-5 text-primary" />
          </div>
        </div>
        <UiCardTitle class="text-xl text-center">PsyEngine</UiCardTitle>
        <UiCardDescription class="text-sm text-center">
          Psychology Test Management
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <UiLabel for="email" class="text-sm">Email</UiLabel>
            <UiInput
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              required
              class="h-10"
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
              class="h-10"
            />
          </div>

          <UiButton type="submit" class="w-full h-10" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </UiButton>

          <UiButton
            type="button"
            variant="outline"
            class="w-full h-9 text-xs text-muted-foreground"
            @click="fillDevCreds"
          >
            <Icon icon="lucide:bug" class="size-3 mr-2" />
            Fill Dev Credentials
          </UiButton>

          <p v-if="error" class="text-xs text-destructive text-center">{{ error }}</p>
        </form>
      </UiCardContent>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'login',
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { login, isAuthenticated } = useAuth()

onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo('/')
  } else {
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
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
