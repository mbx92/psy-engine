<template>
  <div class="relative w-full min-h-screen flex items-center justify-center bg-background">
    <div class="absolute top-4 right-4 z-20 flex items-center gap-1">
      <ThemeSwitcher />
      <UiButton
        variant="ghost"
        size="icon"
        class="h-9 w-9"
        :title="colorMode.preference === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleColorMode"
      >
        <Sun v-if="colorMode.value === 'dark'" class="size-4" aria-hidden="true" />
        <Moon v-else class="size-4" aria-hidden="true" />
      </UiButton>
    </div>
    <slot />
  </div>
</template>

<script setup>
import { Sun, Moon } from 'lucide-vue-next'

const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
