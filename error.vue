<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <UiCard class="w-full max-w-sm mx-auto">
      <UiCardHeader class="space-y-2 pb-4">
        <div class="flex justify-center mb-2">
          <div class="size-10 rounded-control bg-destructive/10 flex items-center justify-center">
            <Icon :icon="isNotFound ? 'lucide:map-pin-off' : 'lucide:alert-triangle'" class="size-5 text-destructive" />
          </div>
        </div>
        <UiCardTitle class="text-xl text-center">
          {{ isNotFound ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan' }}
        </UiCardTitle>
        <UiCardDescription class="text-sm text-center">
          {{ isNotFound ? 'Halaman yang Anda cari tidak ada atau sudah dipindahkan.' : 'Maaf, ada yang tidak berjalan semestinya. Silakan coba lagi.' }}
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <UiButton class="w-full h-10" @click="goHome">
          {{ isAuthenticated ? 'Kembali ke Beranda' : 'Kembali ke Login' }}
        </UiButton>
      </UiCardContent>
    </UiCard>
  </div>
</template>

<script setup>
const props = defineProps({
  error: { type: Object, required: true },
})

const { isAuthenticated } = useAuth()

const isNotFound = computed(() => props.error?.statusCode === 404)

function goHome() {
  clearError({ redirect: isAuthenticated.value ? '/' : '/login' })
}
</script>
