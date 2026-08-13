<template>
  <div class="relative w-full min-h-screen flex items-center justify-center bg-background">
    <div class="absolute top-4 right-4 z-20 flex items-center gap-1">
      <ThemeSwitcher />
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
    </div>
    <slot />
  </div>
</template>

<script setup>
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
