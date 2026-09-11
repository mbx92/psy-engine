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
        <UiCardHeader class="space-y-3">
          <div
            v-if="accessBlocked"
            class="mx-auto size-12 rounded-full flex items-center justify-center"
            :class="accessBlocked.code === 'SYSTEM_LOCKED' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-800'"
          >
            <Icon :icon="accessBlocked.icon" class="size-6" />
          </div>
          <UiCardTitle :class="accessBlocked ? '' : 'text-destructive'">
            {{ accessBlocked?.title || 'Link Tidak Valid' }}
          </UiCardTitle>
          <UiCardDescription>{{ error }}</UiCardDescription>
        </UiCardHeader>
      </UiCard>
    </div>

    <div v-else class="flex-1 flex items-start justify-center px-3 py-5 sm:items-center sm:p-4">
      <UiCard class="w-full max-w-md overflow-hidden">
        <UiCardHeader class="space-y-2 p-5 pb-4 sm:p-6 sm:pb-4">
          <UiCardTitle class="text-xl leading-tight sm:text-2xl">
            {{ isMulti ? 'Paket Tes' : testType?.name }}
          </UiCardTitle>
          <UiCardDescription>
            {{ isMulti
              ? 'Isi biodata Anda untuk memulai rangkaian tes.'
              : (testType?.description || 'Isi biodata Anda untuk memulai tes.') }}
          </UiCardDescription>
          <p v-if="invitation?.label" class="text-xs text-muted-foreground">{{ invitation.label }}</p>
        </UiCardHeader>

        <UiCardContent class="p-5 pt-0 sm:p-6 sm:pt-0">
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

          <form class="space-y-3.5 sm:space-y-4" @submit.prevent="handleClaim">
            <div class="space-y-2">
              <UiLabel for="name">Nama Lengkap</UiLabel>
              <UiInput id="name" v-model="form.name" required class="h-10" placeholder="Nama sesuai identitas" />
            </div>

            <div class="space-y-2" role="group" aria-labelledby="birthDateLabel">
              <UiLabel id="birthDateLabel">Tanggal Lahir</UiLabel>
              <div class="grid grid-cols-[0.85fr_0.95fr_1.2fr] gap-2">
                <UiSelect v-model="dateParts.day">
                  <UiSelectTrigger class="h-10 min-w-0 px-2.5 text-sm">
                    <UiSelectValue placeholder="Tgl" />
                  </UiSelectTrigger>
                  <UiSelectContent class="max-h-64">
                    <UiSelectItem v-for="day in dayOptions" :key="day" :value="day">
                      {{ day }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>

                <UiSelect v-model="dateParts.month">
                  <UiSelectTrigger class="h-10 min-w-0 px-2.5 text-sm">
                    <UiSelectValue placeholder="Bln" />
                  </UiSelectTrigger>
                  <UiSelectContent class="max-h-64">
                    <UiSelectItem v-for="month in monthOptions" :key="month.value" :value="month.value">
                      {{ month.label }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>

                <UiSelect v-model="dateParts.year">
                  <UiSelectTrigger class="h-10 min-w-0 px-2.5 text-sm">
                    <UiSelectValue placeholder="Thn" />
                  </UiSelectTrigger>
                  <UiSelectContent class="max-h-64">
                    <UiSelectItem v-for="year in yearOptions" :key="year" :value="year">
                      {{ year }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
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
import {
  parseSystemAccessError,
  systemAccessIcon,
  systemAccessMessage,
  systemAccessTitle,
} from '~~/utils/systemAccess'

definePageMeta({ layout: false })

const route = useRoute()
const token = computed(() => route.params.token)
const { refresh: refreshAppSettings, systemLocked, maintenanceMode, maintenanceMessage } = useAppSettings()

const loading = ref(true)
const error = ref('')
const accessBlocked = ref(null)
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
const dateParts = reactive({
  day: '',
  month: '',
  year: '',
})
const submitting = ref(false)
const submitError = ref('')

const canSubmit = computed(() => form.name.trim() && form.birthDate && form.gender)
const isMulti = computed(() => testTypes.value.length > 1)
const monthOptions = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Agu' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Okt' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Des' },
]
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 101 }, (_, index) => String(currentYear - index))
})
const dayOptions = computed(() => {
  const year = Number(dateParts.year || new Date().getFullYear())
  const month = Number(dateParts.month || 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, index) => String(index + 1).padStart(2, '0'))
})

watch(
  () => [dateParts.day, dateParts.month, dateParts.year],
  ([day, month, year]) => {
    if (day && !dayOptions.value.includes(day)) {
      dateParts.day = dayOptions.value.at(-1) || ''
      return
    }

    form.birthDate = day && month && year ? `${year}-${month}-${day}` : ''
  },
)

onMounted(async () => {
  clearParticipantClientState()
  loading.value = true
  error.value = ''
  accessBlocked.value = null
  try {
    await refreshAppSettings()
    if (systemLocked.value || maintenanceMode.value) {
      const flags = {
        systemLocked: systemLocked.value,
        maintenanceMode: maintenanceMode.value,
      }
      accessBlocked.value = {
        code: systemLocked.value ? 'SYSTEM_LOCKED' : 'MAINTENANCE_MODE',
        title: systemAccessTitle(flags),
        icon: systemAccessIcon(flags),
      }
      error.value = systemAccessMessage(flags, maintenanceMessage.value)
      return
    }

    const data = await $fetch(`/api/open-invitations/token/${token.value}`)
    invitation.value = data.invitation
    testType.value = data.testType
    testTypes.value = data.testTypes?.length ? data.testTypes : (data.testType ? [data.testType] : [])
  } catch (err) {
    const blocked = parseSystemAccessError(err)
    if (blocked) {
      accessBlocked.value = blocked
      error.value = systemAccessMessage(blocked.code, maintenanceMessage.value)
    } else {
      error.value = err?.data?.message || err?.message || 'Gagal membuka undangan'
    }
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
