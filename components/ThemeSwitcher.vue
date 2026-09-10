<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <UiButton
        variant="ghost"
        size="icon"
        class="h-9 w-9"
        :title="`Design theme: ${currentMeta.label}`"
      >
        <Palette class="size-4" aria-hidden="true" />
        <span class="sr-only">Switch design theme</span>
      </UiButton>
    </UiDropdownMenuTrigger>
    <UiDropdownMenuContent align="end" class="w-48">
      <UiDropdownMenuLabel class="text-xs text-muted-foreground">Design theme</UiDropdownMenuLabel>
      <UiDropdownMenuSeparator />
      <UiDropdownMenuRadioGroup :model-value="theme" @update:model-value="setTheme">
        <UiDropdownMenuRadioItem v-for="item in themes" :key="item.id" :value="item.id" class="min-h-9">
          {{ item.label }}
        </UiDropdownMenuRadioItem>
      </UiDropdownMenuRadioGroup>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>

<script setup>
import { Palette } from 'lucide-vue-next'

const { theme, currentMeta, themes, setTheme } = useDesignTheme()
</script>
