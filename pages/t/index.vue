<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <header class="border-b bg-background/95 backdrop-blur">
      <div class="max-w-lg mx-auto px-4 py-4">
        <h1 class="text-xl font-bold">Psychology Tests</h1>
        <p class="text-sm text-muted-foreground">Pilih tes untuk memulai</p>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center p-4">
      <UiCard class="w-full max-w-sm text-center">
        <UiCardContent class="pt-6">
          <p class="text-sm text-destructive mb-4">{{ error }}</p>
          <UiButton @click="loadTests" variant="outline" class="w-full">Coba Lagi</UiButton>
        </UiCardContent>
      </UiCard>
    </div>

    <!-- Test list -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="max-w-lg mx-auto p-4 space-y-3">
        <div
          v-for="test in tests"
          :key="test.id"
          @click="startTest(test.slug)"
          class="p-4 rounded-xl border-2 border-border hover:border-primary/50 active:border-primary transition-colors cursor-pointer active:scale-[0.99]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h3 class="font-semibold text-sm">{{ test.name }}</h3>
              <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ test.description }}</p>
              <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{{ test.config?.timeLimit }} menit</span>
                <span class="size-1 rounded-full bg-muted-foreground/30" />
                <span>{{ test.type }}</span>
              </div>
            </div>
            <div class="size-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon icon="lucide:chevron-right" class="size-4 text-primary" />
            </div>
          </div>
        </div>

        <div v-if="!tests.length" class="text-center py-12 text-sm text-muted-foreground">
          Belum ada tes tersedia.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const loading = ref(true)
const tests = ref<any[]>([])
const error = ref('')

async function loadTests() {
  loading.value = true
  error.value = ''
  try {
    const data: any = await $fetch('/api/tests')
    tests.value = data || []
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Gagal memuat tes'
  } finally {
    loading.value = false
  }
}

function startTest(slug: string) {
  navigateTo(`/t/${slug}`)
}

onMounted(loadTests)
</script>
