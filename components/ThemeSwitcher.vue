<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <UiButton
        variant="ghost"
        size="icon"
        class="h-9 w-9"
        title="Switch design theme"
      >
        <Icon icon="lucide:palette" class="size-4" />
        <span class="sr-only">Switch design theme</span>
      </UiButton>
    </UiDropdownMenuTrigger>
    <UiDropdownMenuContent align="end" class="w-40">
      <UiDropdownMenuItem
        v-for="item in themes"
        :key="item.id"
        class="justify-between"
        @click="setTheme(item.id)"
      >
        {{ item.label }}
        <Icon v-if="theme === item.id" icon="lucide:check" class="size-4" />
      </UiDropdownMenuItem>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>

<script setup>
const { theme, themes, setTheme } = useDesignTheme()
</script>
