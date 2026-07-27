<template>
  <div class="space-y-4 md:space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Participants</h1>
        <p class="text-sm md:text-base text-muted-foreground">Manage test participants</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <UiButton v-if="can('participants:create')" variant="outline" @click="openImport">
          <Icon icon="lucide:upload" class="size-4 md:mr-2" />
          <span class="hidden md:inline">Import CSV</span>
        </UiButton>
        <UiButton v-if="can('participants:create')" @click="openCreate">
          <Icon icon="lucide:plus" class="size-4 md:mr-2" />
          <span class="hidden md:inline">Add Participant</span>
        </UiButton>
      </div>
    </div>

    <div class="max-w-sm">
      <UiInput v-model="search" placeholder="Search by name, email, or NIK..." class="h-10" />
    </div>

    <div v-if="loading" class="space-y-2">
      <UiSkeleton v-for="i in 5" :key="i" class="h-12 w-full rounded-md" />
    </div>

    <UiResponsiveTable
      v-else
      :columns="columns"
      :data="participants"
      item-key="id"
    >
      <template #empty>
        <EmptyState
          icon="lucide:users"
          title="No participants found"
          :description="search ? 'Try a different search term.' : 'Add your first participant to get started.'"
        />
      </template>
      <template #cell-name="{ row }">
        <span class="font-medium">{{ row.name }}</span>
      </template>
      <template #cell-gender="{ row }">
        <span>{{ row.gender === 'L' ? 'Laki-laki' : row.gender === 'P' ? 'Perempuan' : '—' }}</span>
      </template>
      <template #cell-birthDate="{ row }">
        <span>{{ formatDate(row.birthDate) }}</span>
      </template>
      <template #cell-email="{ row }">
        <span class="text-muted-foreground">{{ row.email || '—' }}</span>
      </template>
      <template #cell-actions="{ row }">
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="ghost" size="icon" class="size-8">
              <Icon icon="lucide:more-horizontal" class="size-4" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <UiDropdownMenuLabel>{{ row.name }}</UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem v-if="can('participants:update')" @click="openEdit(row)">
              <Icon icon="lucide:pencil" class="size-4 mr-2" />
              Edit
            </UiDropdownMenuItem>
            <UiDropdownMenuItem v-if="can('participants:delete')" class="text-destructive" @click="deleteParticipant(row)">
              <Icon icon="lucide:trash-2" class="size-4 mr-2" />
              Delete
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </template>
    </UiResponsiveTable>

    <div v-if="listError" class="text-xs text-destructive">{{ listError }}</div>
    <div v-if="listSuccess" class="text-xs text-green-600">{{ listSuccess }}</div>

    <!-- Add/Edit Participant Dialog -->
    <UiDialog v-model:open="showForm">
      <UiDialogContent class="sm:max-w-md">
        <UiDialogHeader>
          <UiDialogTitle>{{ editingId ? 'Edit Participant' : 'Add Participant' }}</UiDialogTitle>
          <UiDialogDescription>
            {{ editingId ? 'Update participant details' : 'Register a new test participant' }}
          </UiDialogDescription>
        </UiDialogHeader>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <UiLabel for="p-name">Name</UiLabel>
            <UiInput id="p-name" v-model="form.name" required class="h-10" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <UiLabel for="p-birth-date">Birth Date</UiLabel>
              <UiInput id="p-birth-date" v-model="form.birthDate" type="date" required class="h-10" />
            </div>
            <div class="space-y-2">
              <UiLabel for="p-gender">Gender</UiLabel>
              <UiSelect v-model="form.gender">
                <UiSelectTrigger class="h-10">
                  <UiSelectValue placeholder="Select" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem value="L">Laki-laki</UiSelectItem>
                  <UiSelectItem value="P">Perempuan</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </div>
          </div>
          <div class="space-y-2">
            <UiLabel for="p-email">Email</UiLabel>
            <UiInput id="p-email" v-model="form.email" type="email" class="h-10" />
          </div>
          <div class="space-y-2">
            <UiLabel for="p-phone">Phone</UiLabel>
            <UiInput id="p-phone" v-model="form.phone" class="h-10" />
          </div>
          <div class="space-y-2">
            <UiLabel for="p-nik">NIK</UiLabel>
            <UiInput id="p-nik" v-model="form.nik" class="h-10" />
          </div>

          <div v-if="formError" class="text-xs text-destructive">{{ formError }}</div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="showForm = false">Cancel</UiButton>
            <UiButton type="submit" :disabled="formLoading">
              {{ formLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Participant' }}
            </UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>

    <!-- Import CSV Dialog -->
    <UiDialog v-model:open="showImport">
      <UiDialogContent class="sm:max-w-md">
        <UiDialogHeader>
          <UiDialogTitle>Import Participants (CSV)</UiDialogTitle>
          <UiDialogDescription>
            Columns: name, birthDate (YYYY-MM-DD), gender (L/P), phone, email, nik. First row must be the header.
          </UiDialogDescription>
        </UiDialogHeader>

        <div class="space-y-4">
          <a
            class="text-xs text-primary underline underline-offset-2"
            :href="templateHref"
            download="participants-template.csv"
          >
            Download CSV template
          </a>

          <div class="space-y-2">
            <UiLabel for="import-file">CSV File</UiLabel>
            <input
              id="import-file"
              type="file"
              accept=".csv,text/csv"
              class="block w-full text-sm file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-primary file:px-3 file:text-sm file:font-medium file:text-primary-foreground"
              @change="handleFileSelect"
            />
          </div>

          <div v-if="importFileName" class="text-xs text-muted-foreground">
            Selected: {{ importFileName }} ({{ importRowCount }} row{{ importRowCount === 1 ? '' : 's' }} detected)
          </div>

          <div v-if="importResult" class="space-y-2 rounded-md border p-3 text-sm">
            <p class="font-medium text-green-600">{{ importResult.imported }} participant(s) imported</p>
            <div v-if="importResult.errors?.length" class="space-y-1">
              <p class="text-xs font-medium text-destructive">{{ importResult.errors.length }} row(s) skipped:</p>
              <ul class="text-xs text-destructive space-y-0.5 max-h-32 overflow-y-auto">
                <li v-for="err in importResult.errors" :key="err.row">Row {{ err.row }}: {{ err.reason }}</li>
              </ul>
            </div>
          </div>

          <div v-if="importError" class="text-xs text-destructive">{{ importError }}</div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="showImport = false">Close</UiButton>
            <UiButton :disabled="!importCsvText || importLoading" @click="handleImport">
              {{ importLoading ? 'Importing...' : 'Import' }}
            </UiButton>
          </UiDialogFooter>
        </div>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { can, getAuthHeaders } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'gender', label: 'Gender', headClass: 'hidden sm:table-cell' },
  { key: 'birthDate', label: 'Birth Date', headClass: 'hidden md:table-cell' },
  { key: 'email', label: 'Email', headClass: 'hidden lg:table-cell', showOnMobile: false },
  { key: 'actions', label: '', headClass: 'w-16', mobileLabel: '' },
]

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const participants = ref([])
const loading = ref(false)
const listError = ref('')
const listSuccess = ref('')
const search = ref('')

async function loadParticipants() {
  loading.value = true
  listError.value = ''
  try {
    const data = await $fetch('/api/participants', {
      query: search.value ? { search: search.value } : {},
      headers: getAuthHeaders(),
    })
    participants.value = data.participants || []
  } catch (err) {
    listError.value = err?.data?.message || 'Failed to load participants'
  } finally {
    loading.value = false
  }
}

let searchDebounce = null
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(loadParticipants, 300)
})

onMounted(loadParticipants)

// Add/Edit form
const showForm = ref(false)
const editingId = ref(null)
const form = reactive({ name: '', birthDate: '', gender: '', phone: '', email: '', nik: '' })
const formLoading = ref(false)
const formError = ref('')

function resetForm() {
  form.name = ''
  form.birthDate = ''
  form.gender = ''
  form.phone = ''
  form.email = ''
  form.nik = ''
}

function openCreate() {
  editingId.value = null
  resetForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.name = row.name
  form.birthDate = row.birthDate ? row.birthDate.slice(0, 10) : ''
  form.gender = row.gender
  form.phone = row.phone || ''
  form.email = row.email || ''
  form.nik = row.nik || ''
  formError.value = ''
  showForm.value = true
}

async function handleSubmit() {
  formError.value = ''
  formLoading.value = true
  try {
    const body = { ...form }
    if (editingId.value) {
      const data = await $fetch(`/api/participants/${editingId.value}`, {
        method: 'PUT',
        body,
        headers: getAuthHeaders(),
      })
      const idx = participants.value.findIndex((p) => p.id === editingId.value)
      if (idx !== -1) participants.value[idx] = data.participant
      listSuccess.value = `${data.participant.name} updated`
      toast.success(listSuccess.value)
    } else {
      const data = await $fetch('/api/participants', {
        method: 'POST',
        body,
        headers: getAuthHeaders(),
      })
      participants.value.unshift(data.participant)
      listSuccess.value = `${data.participant.name} added`
      toast.success(listSuccess.value)
    }
    showForm.value = false
  } catch (err) {
    formError.value = err?.data?.message || err?.message || 'Failed to save participant'
  } finally {
    formLoading.value = false
  }
}

async function deleteParticipant(row) {
  const ok = await confirm({
    title: `Delete participant "${row.name}"?`,
    description: 'This cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  })
  if (!ok) return

  listError.value = ''
  listSuccess.value = ''
  try {
    await $fetch(`/api/participants/${row.id}`, { method: 'DELETE', headers: getAuthHeaders() })
    participants.value = participants.value.filter((p) => p.id !== row.id)
    listSuccess.value = `${row.name} deleted`
    toast.success(listSuccess.value)
  } catch (err) {
    listError.value = err?.data?.message || 'Failed to delete participant'
    toast.error(listError.value)
  }
}

// CSV import
const showImport = ref(false)
const importFileName = ref('')
const importCsvText = ref('')
const importRowCount = ref(0)
const importLoading = ref(false)
const importError = ref('')
const importResult = ref(null)

const templateHref = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
  'name,birthDate,gender,phone,email,nik\nBudi Santoso,1995-05-05,L,08123456789,budi@example.com,1234567890123456\n',
)

function openImport() {
  showImport.value = false
  importFileName.value = ''
  importCsvText.value = ''
  importRowCount.value = 0
  importError.value = ''
  importResult.value = null
  showImport.value = true
}

function handleFileSelect(evt) {
  const file = evt.target.files?.[0]
  if (!file) return
  importResult.value = null
  importError.value = ''
  importFileName.value = file.name

  const reader = new FileReader()
  reader.onload = () => {
    importCsvText.value = String(reader.result || '')
    importRowCount.value = Math.max(importCsvText.value.split(/\r?\n/).filter((l) => l.trim()).length - 1, 0)
  }
  reader.onerror = () => {
    importError.value = 'Failed to read file'
  }
  reader.readAsText(file)
}

async function handleImport() {
  importError.value = ''
  importResult.value = null
  importLoading.value = true
  try {
    const data = await $fetch('/api/participants/import', {
      method: 'POST',
      body: { csv: importCsvText.value },
      headers: getAuthHeaders(),
    })
    importResult.value = data
    if (data.imported > 0) {
      loadParticipants()
      toast.success(`Imported ${data.imported} participant${data.imported === 1 ? '' : 's'}`)
    }
  } catch (err) {
    importError.value = err?.data?.message || err?.message || 'Import failed'
  } finally {
    importLoading.value = false
  }
}
</script>
