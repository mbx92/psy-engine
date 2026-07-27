<template>
  <div class="min-h-screen bg-background flex flex-col p-4 md:p-8">
    <div class="flex-1 max-w-2xl mx-auto w-full space-y-6 py-4">

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>

      <UiCard v-else-if="error" class="text-center">
        <UiCardHeader>
          <UiCardTitle class="text-destructive">Tidak Dapat Menampilkan Hasil</UiCardTitle>
          <UiCardDescription>{{ error }}</UiCardDescription>
        </UiCardHeader>
      </UiCard>

      <template v-else-if="session">
        <div class="text-center space-y-1">
          <h1 class="text-xl font-bold">{{ session.testType.name }}</h1>
          <p class="text-sm text-muted-foreground">Hasil untuk {{ session.participantName || session.participant?.name }}</p>
        </div>

        <ReportsTestResultPanel :session="sessionForView" />

        <UiButton variant="outline" class="w-full print:hidden" @click="() => window.print()">
          <Icon icon="lucide:printer" class="size-4 mr-2" />
          Cetak / Simpan PDF
        </UiButton>
      </template>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const token = route.params.token

const loading = ref(true)
const error = ref('')
const session = ref(null)

const sessionForView = computed(() => {
  if (!session.value) return null
  return {
    ...session.value,
    participant: {
      name: session.value.participantName,
      gender: session.value.participantGender,
      birthDate: session.value.participantBirthDate,
    },
    testType: session.value.testType,
    scores: session.value.scores,
    interpretation: session.value.interpretation,
  }
})

onMounted(async () => {
  try {
    const data = await $fetch(`/api/sessions/token/${token}`)
    const s = data.session

    if (!['completed', 'verified'].includes(s.status)) {
      error.value = 'Sesi ini belum diselesaikan.'
      return
    }

    session.value = s
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'Gagal memuat hasil'
  } finally {
    loading.value = false
  }
})
</script>
