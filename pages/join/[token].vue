<template>
  <div class="min-h-screen bg-background flex flex-col">
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center space-y-4">
        <div class="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p class="text-sm text-muted-foreground">Memuat undangan...</p>
      </div>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center p-4">
      <UiCard class="w-full max-w-sm text-center">
        <UiCardHeader>
          <UiCardTitle class="text-destructive">Link Tidak Valid</UiCardTitle>
          <UiCardDescription>{{ error }}</UiCardDescription>
        </UiCardHeader>
      </UiCard>
    </div>

    <div v-else class="flex-1 flex items-center justify-center p-4">
      <UiCard class="w-full max-w-md">
        <UiCardHeader class="space-y-2">
          <UiCardTitle>
            {{ isMulti ? 'Paket Tes' : testType?.name }}
          </UiCardTitle>
          <UiCardDescription>
            {{ isMulti
              ? 'Isi biodata Anda untuk memulai rangkaian tes.'
              : (testType?.description || 'Isi biodata Anda untuk memulai tes.') }}
          </UiCardDescription>
          <p v-if="invitation?.label" class="text-xs text-muted-foreground">{{ invitation.label }}</p>
        </UiCardHeader>

        <UiCardContent>
          <div v-if="isMulti" class="mb-4 rounded-lg border p-3 text-sm space-y-2">
            <p class="text-xs font-medium text-muted-foreground">Tes dalam paket ({{ testTypes.length }})</p>
            <ol class="space-y-1 list-decimal list-inside">
              <li v-for="t in testTypes" :key="t.id" class="text-sm">
                {{ t.name }}
                <span v-if="t.timeLimit" class="text-xs text-muted-foreground"> · {{ t.timeLimit }} mnt</span>
              </li>
            </ol>
          </div>

          <div v-else-if="testType?.timeLimit || testType?.instructions?.length" class="mb-4 rounded-lg bg-muted p-3 text-sm space-y-2">
            <div v-if="testType.timeLimit" class="flex justify-between">
              <span class="text-muted-foreground">Waktu</span>
              <span class="font-medium">{{ testType.timeLimit }} menit</span>
            </div>
            <ul v-if="testType.instructions?.length" class="space-y-1 text-xs text-muted-foreground">
              <li v-for="(inst, i) in testType.instructions" :key="i">{{ i + 1 }}. {{ inst }}</li>
            </ul>
          </div>

          <form class="space-y-4" @submit.prevent="handleClaim">
            <div class="space-y-2">
              <UiLabel for="name">Nama Lengkap</UiLabel>
              <UiInput id="name" v-model="form.name" required class="h-10" placeholder="Nama sesuai identitas" />
            </div>

            <div class="space-y-2">
              <UiLabel for="birthDate">Tanggal Lahir</UiLabel>
              <UiInput id="birthDate" v-model="form.birthDate" type="date" required class="h-10" />
            </div>

            <div class="space-y-2">
              <UiLabel>Jenis Kelamin</UiLabel>
              <UiSelect v-model="form.gender" required>
                <UiSelectTrigger class="h-10">
                  <UiSelectValue placeholder="Pilih" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem value="L">Laki-laki</UiSelectItem>
                  <UiSelectItem value="P">Perempuan</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </div>

            <div class="space-y-2">
              <UiLabel for="phone">No. HP <span class="text-muted-foreground font-normal">(opsional)</span></UiLabel>
              <UiInput id="phone" v-model="form.phone" class="h-10" />
            </div>

            <div class="space-y-2">
              <UiLabel for="email">Email <span class="text-muted-foreground font-normal">(opsional)</span></UiLabel>
              <UiInput id="email" v-model="form.email" type="email" class="h-10" />
            </div>

            <div class="space-y-2">
              <UiLabel for="nik">NIK <span class="text-muted-foreground font-normal">(opsional)</span></UiLabel>
              <UiInput id="nik" v-model="form.nik" class="h-10" />
            </div>

            <p v-if="submitError" class="text-xs text-destructive">{{ submitError }}</p>

            <UiButton type="submit" class="w-full h-11" :disabled="submitting || !canSubmit">
              {{ submitting ? 'Menyimpan...' : (isMulti ? 'Lanjut ke Tes Pertama' : 'Lanjut ke Tes') }}
            </UiButton>
          </form>
        </UiCardContent>
      </UiCard>
    </div>
  </div>
</template>

<script setup>
import { clearParticipantClientState, saveParticipantFlow } from '~~/utils/participantSession'

definePageMeta({ layout: false })

const route = useRoute()
const token = computed(() => route.params.token)

const loading = ref(true)
const error = ref('')
const invitation = ref(null)
const testType = ref(null)
const testTypes = ref([])

const form = reactive({
  name: '',
  birthDate: '',
  gender: '',
  phone: '',
  email: '',
  nik: '',
})
const submitting = ref(false)
const submitError = ref('')

const canSubmit = computed(() => form.name.trim() && form.birthDate && form.gender)
const isMulti = computed(() => testTypes.value.length > 1)

onMounted(async () => {
  clearParticipantClientState()
  loading.value = true
  error.value = ''
  try {
    const data = await $fetch(`/api/open-invitations/token/${token.value}`)
    invitation.value = data.invitation
    testType.value = data.testType
    testTypes.value = data.testTypes?.length ? data.testTypes : (data.testType ? [data.testType] : [])
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'Gagal membuka undangan'
  } finally {
    loading.value = false
  }
})

async function handleClaim() {
  submitError.value = ''
  submitting.value = true
  try {
    const data = await $fetch(`/api/open-invitations/token/${token.value}/claim`, {
      method: 'POST',
      body: {
        name: form.name.trim(),
        birthDate: form.birthDate,
        gender: form.gender,
        phone: form.phone || null,
        email: form.email || null,
        nik: form.nik || null,
      },
    })
    saveParticipantFlow({
      joinToken: token.value,
      takePath: data.invitationPath,
      batteryId: data.battery?.id || null,
    })
    await navigateTo(data.invitationPath)
  } catch (err) {
    submitError.value = err?.data?.message || err?.message || 'Gagal mendaftar'
  } finally {
    submitting.value = false
  }
}
</script>
