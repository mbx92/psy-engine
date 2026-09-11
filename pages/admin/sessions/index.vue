<template>
  <div class="space-y-4 md:space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Sessions</h1>
        <p class="text-sm md:text-base text-muted-foreground">Monitor ongoing and completed test sessions</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <UiButton v-if="can('sessions:read')" as-child variant="outline">
          <NuxtLink to="/admin/monitoring"><Icon icon="lucide:monitor" class="size-4 md:mr-2" /><span class="hidden md:inline">Monitoring</span></NuxtLink>
        </UiButton>
        <UiButton v-if="can('sessions:manage')" variant="outline" @click="openPublicLinks">
          <Icon icon="lucide:link" class="size-4 md:mr-2" />
          <span class="hidden md:inline">Public Links</span>
        </UiButton>
        <UiButton v-if="can('sessions:manage')" @click="openCreate">
          <Icon icon="lucide:plus" class="size-4 md:mr-2" />
          <span class="hidden md:inline">Create Session</span>
        </UiButton>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="relative w-full sm:max-w-xs shrink-0">
        <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <UiInput
          v-model="search"
          placeholder="Search participant, test, or status..."
          class="h-10 pl-9"
        />
      </div>

      <UiTabs v-model="activeTab" class="w-full sm:w-auto overflow-x-auto">
        <UiTabsList class="w-max sm:w-auto">
          <UiTabsTrigger value="all" class="text-sm">All</UiTabsTrigger>
          <UiTabsTrigger value="pending" class="text-sm">Pending</UiTabsTrigger>
          <UiTabsTrigger value="in_progress" class="text-sm">In Progress</UiTabsTrigger>
          <UiTabsTrigger value="completed" class="text-sm">Completed</UiTabsTrigger>
          <UiTabsTrigger value="verified" class="text-sm">Verified</UiTabsTrigger>
          <UiTabsTrigger value="abandoned" class="text-sm">Abandoned</UiTabsTrigger>
        </UiTabsList>
      </UiTabs>
    </div>

    <div>
      <div v-if="loading" class="space-y-2">
        <UiSkeleton v-for="i in 5" :key="i" class="h-12 w-full rounded-md" />
      </div>

      <UiResponsiveTable
        v-else
        :columns="columns"
        :data="sessions"
        item-key="id"
        class="cursor-pointer"
        @select="(row) => navigateTo(`/admin/sessions/${row.id}`)"
      >
        <template #empty>
          <EmptyState
            icon="lucide:clipboard-check"
            title="No sessions found"
            :description="emptyDescription"
          />
        </template>
        <template #cell-participant="{ row }">
          <span class="font-medium text-sm">{{ row.participantName }}</span>
        </template>
        <template #cell-test="{ row }">
          <span class="text-sm">{{ row.testTypeName }}</span>
        </template>
        <template #cell-status="{ row }">
          <UiBadge :variant="statusVariant(row.status)" class="text-xs whitespace-nowrap">{{ statusLabel(row.status) }}</UiBadge>
        </template>
        <template #cell-created="{ row }">
          <span class="text-muted-foreground text-xs">{{ formatDateTime(row.createdAt) }}</span>
        </template>
        <template #cell-invite="{ row }">
          <div v-if="row.token" class="flex items-center gap-1.5 min-w-0" @click.stop>
            <span class="font-mono text-[11px] text-muted-foreground truncate max-w-[10rem] lg:max-w-[14rem]" :title="inviteUrl(row)">
              /take/{{ shortToken(row.token) }}
            </span>
            <UiButton
              type="button"
              variant="outline"
              size="icon"
              class="size-7 shrink-0"
              :title="copiedId === row.id ? 'Copied' : 'Copy invitation link'"
              @click="copySessionInvite(row)"
            >
              <Icon :icon="copiedId === row.id ? 'lucide:check' : 'lucide:copy'" class="size-3.5" />
            </UiButton>
          </div>
          <span v-else class="text-xs text-muted-foreground">—</span>
        </template>
        <template #cell-actions="{ row }">
          <NuxtLink
            :to="`/admin/sessions/${row.id}`"
            class="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-md text-xs font-medium hover:bg-accent hover:text-accent-foreground"
            @click.stop
          >
            <Icon icon="lucide:eye" class="size-3.5" />
            <span class="hidden md:inline">View</span>
          </NuxtLink>
        </template>
      </UiResponsiveTable>

      <PaginationBar
        v-if="!loading && (pageMeta?.total ?? 0) > 0"
        :page="page"
        :limit="pageSize"
        :total="pageMeta.total"
        @update:page="goToPage"
      />
    </div>

    <div v-if="listError" class="text-xs text-destructive">{{ listError }}</div>

    <!-- Create Session Dialog -->
    <UiDialog v-model:open="showCreate">
      <UiDialogContent class="sm:max-w-md">
        <UiDialogHeader>
          <UiDialogTitle>{{ createMode === 'public' ? 'Create Public Link' : 'Create Session' }}</UiDialogTitle>
          <UiDialogDescription>
            {{ createMode === 'public'
              ? 'Generate a shareable link. Participants enter biodata when they open it.'
              : 'Assign a test to a participant and generate an invitation link' }}
          </UiDialogDescription>
        </UiDialogHeader>

        <div v-if="!createdInvite && !bulkResult" class="space-y-4">
          <UiTabs v-model="createMode">
            <UiTabsList class="w-full">
              <UiTabsTrigger value="single" class="flex-1 text-sm">Single</UiTabsTrigger>
              <UiTabsTrigger value="bulk" class="flex-1 text-sm">Bulk</UiTabsTrigger>
              <UiTabsTrigger value="public" class="flex-1 text-sm">Public</UiTabsTrigger>
            </UiTabsList>
          </UiTabs>

          <template v-if="createMode === 'public'">
            <p class="text-xs text-muted-foreground">
              Link bisa dibagikan ke banyak orang. Pilih satu atau beberapa tes — peserta mengisi biodata saat membuka link.
            </p>
            <div class="space-y-2">
              <UiLabel>Jenis Tes</UiLabel>
              <div class="border rounded-md max-h-48 overflow-y-auto divide-y">
                <p v-if="!activeTestTypes.length" class="text-xs text-muted-foreground p-3">Tidak ada tes aktif</p>
                <label
                  v-for="t in activeTestTypes"
                  :key="t.id"
                  class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent/50"
                >
                  <UiCheckbox
                    :model-value="publicForm.testTypeIds.includes(t.id)"
                    @update:model-value="togglePublicTest(t.id)"
                  />
                  {{ t.name }}
                </label>
              </div>
              <p v-if="publicForm.testTypeIds.length" class="text-xs text-muted-foreground">
                {{ publicForm.testTypeIds.length }} tes dipilih
                <span v-if="publicForm.testTypeIds.length > 1"> · dikerjakan berurutan</span>
              </p>
            </div>
            <div class="space-y-2">
              <UiLabel for="s-public-label">Label <span class="text-muted-foreground font-normal">(opsional)</span></UiLabel>
              <UiInput id="s-public-label" v-model="publicForm.label" class="h-10" placeholder="Contoh: Batch Maret 2026" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-2">
                <UiLabel for="s-public-max">Max uses</UiLabel>
                <UiInput id="s-public-max" v-model="publicForm.maxUses" type="number" min="1" class="h-10" placeholder="Unlimited" />
              </div>
              <div class="space-y-2">
                <UiLabel for="s-public-expires">Expires</UiLabel>
                <UiInput id="s-public-expires" v-model="publicForm.expiresAt" type="date" class="h-10" />
              </div>
            </div>
          </template>

          <div v-else class="space-y-2">
            <UiLabel for="s-test-type">Test Type</UiLabel>
            <UiSelect v-model="createForm.testTypeId">
              <UiSelectTrigger id="s-test-type" class="h-10">
                <UiSelectValue placeholder="Select test type" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="t in activeTestTypes" :key="t.id" :value="t.id">{{ t.name }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <div v-if="createMode !== 'public'" class="space-y-2">
            <UiLabel for="s-participant-search">{{ createMode === 'bulk' ? 'Participants' : 'Participant' }}</UiLabel>
            <UiInput
              id="s-participant-search"
              v-model="participantSearch"
              placeholder="Search participant by name/email/NIK..."
              class="h-10"
            />

            <UiSelect v-if="createMode === 'single'" v-model="createForm.participantId">
              <UiSelectTrigger class="h-10">
                <UiSelectValue placeholder="Select participant" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-if="!participantOptions.length" value="__none" disabled>
                  {{ participantSearch ? 'No matches' : 'Type to search...' }}
                </UiSelectItem>
                <UiSelectItem v-for="p in participantOptions" :key="p.id" :value="p.id">{{ p.name }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>

            <div v-else class="border rounded-md max-h-48 overflow-y-auto divide-y">
              <p v-if="!participantOptions.length" class="text-xs text-muted-foreground p-3">
                {{ participantSearch ? 'No matches' : 'Type to search...' }}
              </p>
              <label
                v-for="p in participantOptions"
                :key="p.id"
                class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent/50"
              >
                <UiCheckbox :model-value="bulkParticipantIds.includes(p.id)" @update:model-value="toggleBulkParticipant(p.id)" />
                {{ p.name }}
              </label>
            </div>
            <p v-if="createMode === 'bulk' && bulkParticipantIds.length" class="text-xs text-muted-foreground">
              {{ bulkParticipantIds.length }} participant(s) selected
            </p>
          </div>

          <div v-if="createError" class="text-xs text-destructive">{{ createError }}</div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="showCreate = false">Cancel</UiButton>
            <UiButton
              v-if="createMode === 'single'"
              :disabled="createLoading || !createForm.testTypeId || !createForm.participantId"
              @click="handleCreate"
            >
              {{ createLoading ? 'Creating...' : 'Create Session' }}
            </UiButton>
            <UiButton
              v-else-if="createMode === 'bulk'"
              :disabled="createLoading || !createForm.testTypeId || !bulkParticipantIds.length"
              @click="handleBulkCreate"
            >
              {{ createLoading ? 'Creating...' : `Create ${bulkParticipantIds.length || ''} Sessions` }}
            </UiButton>
            <UiButton
              v-else
              :disabled="createLoading || !publicForm.testTypeIds.length"
              @click="handlePublicCreate"
            >
              {{ createLoading ? 'Creating...' : 'Create Public Link' }}
            </UiButton>
          </UiDialogFooter>
        </div>

        <div v-else-if="createdInvite" class="space-y-4">
          <p class="text-sm text-muted-foreground">
            {{ createMode === 'public'
              ? 'Public link created. Share this link — participants fill biodata when they open it:'
              : 'Session created. Share this invitation link with the participant:' }}
          </p>
          <div class="flex items-center gap-2">
            <UiInput :model-value="createdInvite" readonly class="h-10 font-mono text-xs" />
            <UiButton type="button" variant="outline" size="icon" class="shrink-0" @click="copyInvite">
              <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
            </UiButton>
          </div>
          <UiDialogFooter>
            <UiButton type="button" @click="finishCreate">Done</UiButton>
          </UiDialogFooter>
        </div>

        <div v-else class="space-y-4">
          <p class="text-sm text-muted-foreground">
            {{ bulkResult.created.length }} session(s) created.
            <span v-if="bulkResult.errors?.length">{{ bulkResult.errors.length }} failed.</span>
          </p>
          <div class="border rounded-md max-h-48 overflow-y-auto divide-y">
            <div v-for="c in bulkResult.created" :key="c.sessionId" class="flex items-center gap-2 px-3 py-2 text-xs">
              <span class="font-mono truncate flex-1">{{ origin }}{{ c.invitationPath }}</span>
              <UiButton type="button" variant="ghost" size="icon" class="size-6 shrink-0" @click="copyText(origin + c.invitationPath)">
                <Icon icon="lucide:copy" class="size-3.5" />
              </UiButton>
            </div>
          </div>
          <ul v-if="bulkResult.errors?.length" class="text-xs text-destructive space-y-0.5">
            <li v-for="e in bulkResult.errors" :key="e.participantId">{{ e.participantId }}: {{ e.reason }}</li>
          </ul>
          <UiDialogFooter>
            <UiButton type="button" @click="finishCreate">Done</UiButton>
          </UiDialogFooter>
        </div>
      </UiDialogContent>
    </UiDialog>

    <!-- Public Links Manager -->
    <UiDialog v-model:open="showPublicLinks">
      <UiDialogContent class="sm:max-w-lg">
        <UiDialogHeader>
          <UiDialogTitle>Public Links</UiDialogTitle>
          <UiDialogDescription>
            Link publik untuk pendaftaran mandiri. Klik Create Session → Public untuk membuat yang baru.
          </UiDialogDescription>
        </UiDialogHeader>

        <div v-if="publicLinksLoading" class="space-y-2">
          <UiSkeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-md" />
        </div>
        <template v-else-if="!publicLinks.length">
          <div class="text-sm text-muted-foreground py-6 text-center">
            Belum ada public link.
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col gap-3">
            <div class="relative w-full">
              <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <UiInput
                v-model="publicLinksSearch"
                placeholder="Search label, test, or path..."
                class="h-9 pl-9"
              />
            </div>

            <UiTabs v-model="publicLinksTab" class="w-full">
              <UiTabsList class="w-full grid grid-cols-3">
                <UiTabsTrigger value="all" class="text-sm">All</UiTabsTrigger>
                <UiTabsTrigger value="active" class="text-sm">Active</UiTabsTrigger>
                <UiTabsTrigger value="inactive" class="text-sm">Inactive</UiTabsTrigger>
              </UiTabsList>
            </UiTabs>
          </div>

          <div v-if="!filteredPublicLinks.length" class="text-sm text-muted-foreground py-6 text-center">
            Tidak ada link yang cocok.
          </div>
          <div v-else class="space-y-2 max-h-80 overflow-y-auto">
            <div
              v-for="link in filteredPublicLinks"
              :key="link.id"
              class="border rounded-md p-3 space-y-2"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm font-medium truncate">{{ link.testTypeName }}</p>
                  <p class="text-xs text-muted-foreground truncate">
                    {{ link.label || 'Tanpa label' }}
                    <span v-if="link.testCount > 1"> · {{ link.testCount }} tes</span>
                  </p>
                </div>
                <div
                  v-if="can('sessions:manage')"
                  class="flex items-center gap-2 shrink-0"
                >
                  <span class="text-[11px] text-muted-foreground">
                    {{ link.isActive ? 'Active' : 'Off' }}
                  </span>
                  <UiSwitch
                    :model-value="link.isActive"
                    :disabled="!!link._toggling"
                    @update:model-value="(v) => togglePublicLink(link, v)"
                  />
                </div>
                <UiBadge
                  v-else
                  :variant="link.isActive ? 'secondary' : 'destructive'"
                  class="text-xs shrink-0"
                >
                  {{ link.isActive ? 'Active' : 'Off' }}
                </UiBadge>
              </div>
              <div class="flex items-center gap-2">
                <UiInput :model-value="origin + link.invitationPath" readonly class="h-8 font-mono text-[11px]" />
                <UiButton type="button" variant="outline" size="icon" class="size-8 shrink-0" @click="copyText(origin + link.invitationPath)">
                  <Icon icon="lucide:copy" class="size-3.5" />
                </UiButton>
              </div>
              <div class="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Used {{ link.useCount }}{{ link.maxUses != null ? ` / ${link.maxUses}` : '' }}
                  <span v-if="link.expiresAt"> · exp {{ formatDateTime(link.expiresAt) }}</span>
                </span>
              </div>
            </div>
          </div>
        </template>

        <UiDialogFooter>
          <UiButton type="button" variant="outline" @click="showPublicLinks = false">Close</UiButton>
          <UiButton type="button" @click="showPublicLinks = false; openCreate('public')">New Public Link</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup>
import { statusLabel, statusVariant } from '~~/utils/sessionStatus'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { can, getAuthHeaders } = useAuth()
const toast = useToast()

const columns = [
  { key: 'participant', label: 'Participant' },
  { key: 'test', label: 'Test' },
  { key: 'status', label: 'Status', headClass: 'hidden sm:table-cell', showOnMobile: false },
  { key: 'created', label: 'Created', headClass: 'hidden lg:table-cell', showOnMobile: false },
  { key: 'invite', label: 'Invitation link', headClass: 'hidden md:table-cell', cellClass: 'hidden md:table-cell', mobileLabel: 'Invite' },
  { key: 'actions', label: '', headClass: 'w-28', mobileLabel: '' },
]

const copiedId = ref('')
let copiedTimer = null

function shortToken(token) {
  if (!token) return ''
  return token.length > 12 ? `${token.slice(0, 8)}…` : token
}

function inviteUrl(row) {
  if (!row?.token) return ''
  const base = import.meta.client ? window.location.origin : origin
  return `${base}/take/${row.token}`
}

async function copySessionInvite(row) {
  const url = inviteUrl(row)
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    copiedId.value = row.id
    toast.success('Invitation link copied')
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copiedId.value = '' }, 2000)
  } catch {
    toast.error('Failed to copy link')
  }
}

const activeTab = ref('all')
const search = ref('')
const page = ref(1)
const pageSize = 20
const sessions = ref([])
const pageMeta = ref({ total: 0, totalPages: 1 })
const loading = ref(false)
const listError = ref('')

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadSessions() {
  loading.value = true
  listError.value = ''
  try {
    const data = await $fetch('/api/sessions', {
      query: {
        page: page.value,
        limit: pageSize,
        tab: activeTab.value,
        ...(search.value.trim() ? { search: search.value.trim() } : {}),
      },
      headers: getAuthHeaders(),
    })
    sessions.value = data.sessions || []
    pageMeta.value = data.pagination ?? { total: sessions.value.length, totalPages: 1 }
  } catch (err) {
    listError.value = err?.data?.message || 'Failed to load sessions'
    toast.error(listError.value)
  } finally {
    loading.value = false
  }
}

function goToPage(next) {
  page.value = next
  loadSessions()
}

const emptyDescription = computed(() => {
  if (search.value.trim()) return 'Try a different search term.'
  if (activeTab.value === 'all') return 'Create a session to get started.'
  return `No ${statusLabel(activeTab.value).toLowerCase()} sessions found.`
})

let searchDebounce = null
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    loadSessions()
  }, 300)
})

watch(activeTab, () => {
  page.value = 1
  loadSessions()
})

onMounted(loadSessions)

// Create session flow
const showCreate = ref(false)
const createMode = ref('single')
const createForm = reactive({ testTypeId: '', participantId: '' })
const publicForm = reactive({ label: '', maxUses: '', expiresAt: '', testTypeIds: [] })
const createLoading = ref(false)
const createError = ref('')
const createdInvite = ref('')
const copied = ref(false)
const bulkParticipantIds = ref([])
const bulkResult = ref(null)
const origin = import.meta.client ? window.location.origin : ''

const showPublicLinks = ref(false)
const publicLinks = ref([])
const publicLinksLoading = ref(false)
const publicLinksSearch = ref('')
const publicLinksTab = ref('all')

const filteredPublicLinks = computed(() => {
  const q = publicLinksSearch.value.trim().toLowerCase()
  return publicLinks.value.filter((link) => {
    if (publicLinksTab.value === 'active' && !link.isActive) return false
    if (publicLinksTab.value === 'inactive' && link.isActive) return false
    if (!q) return true
    const haystack = [
      link.label,
      link.testTypeName,
      ...(link.testTypeNames || []),
      link.invitationPath,
      link.token,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

function toggleBulkParticipant(id) {
  const idx = bulkParticipantIds.value.indexOf(id)
  if (idx === -1) bulkParticipantIds.value.push(id)
  else bulkParticipantIds.value.splice(idx, 1)
}

function togglePublicTest(id) {
  const idx = publicForm.testTypeIds.indexOf(id)
  if (idx === -1) publicForm.testTypeIds.push(id)
  else publicForm.testTypeIds.splice(idx, 1)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Link copied')
  } catch {
    // Clipboard API unavailable — link is still visible/selectable
  }
}

const activeTestTypes = ref([])
async function loadActiveTestTypes() {
  try {
    const data = await $fetch('/api/admin/test-types', { headers: getAuthHeaders() })
    activeTestTypes.value = (data.testTypes || []).filter((t) => t.isActive)
  } catch {
    // Non-fatal — dropdown just stays empty
  }
}

const participantSearch = ref('')
const participantOptions = ref([])
let participantDebounce = null
watch(participantSearch, (val) => {
  clearTimeout(participantDebounce)
  participantDebounce = setTimeout(async () => {
    try {
      const data = await $fetch('/api/participants', {
        query: val ? { search: val } : {},
        headers: getAuthHeaders(),
      })
      participantOptions.value = data.participants || []
    } catch {
      participantOptions.value = []
    }
  }, 300)
})

function openCreate(mode = 'single') {
  createMode.value = mode
  createForm.testTypeId = ''
  createForm.participantId = ''
  publicForm.label = ''
  publicForm.maxUses = ''
  publicForm.expiresAt = ''
  publicForm.testTypeIds = []
  createError.value = ''
  createdInvite.value = ''
  bulkResult.value = null
  bulkParticipantIds.value = []
  copied.value = false
  participantSearch.value = ''
  participantOptions.value = []
  loadActiveTestTypes()
  showCreate.value = true
}

async function openPublicLinks() {
  showPublicLinks.value = true
  publicLinksSearch.value = ''
  publicLinksTab.value = 'all'
  publicLinksLoading.value = true
  try {
    const data = await $fetch('/api/admin/open-invitations', { headers: getAuthHeaders() })
    publicLinks.value = data.invitations || []
  } catch (err) {
    toast.error(err?.data?.message || 'Failed to load public links')
    publicLinks.value = []
  } finally {
    publicLinksLoading.value = false
  }
}

async function togglePublicLink(link, nextValue) {
  const target = typeof nextValue === 'boolean' ? nextValue : !link.isActive
  if (target === link.isActive) return
  link._toggling = true
  const previous = link.isActive
  link.isActive = target
  try {
    await $fetch(`/api/admin/open-invitations/${link.id}`, {
      method: 'PATCH',
      body: { isActive: target },
      headers: getAuthHeaders(),
    })
    toast.success(target ? 'Link activated' : 'Link deactivated')
  } catch (err) {
    link.isActive = previous
    toast.error(err?.data?.message || 'Failed to update link')
  } finally {
    link._toggling = false
  }
}

async function handleCreate() {
  createError.value = ''
  createLoading.value = true
  try {
    const data = await $fetch('/api/sessions', {
      method: 'POST',
      body: { testTypeId: createForm.testTypeId, participantId: createForm.participantId },
      headers: getAuthHeaders(),
    })
    createdInvite.value = window.location.origin + data.invitationPath
    toast.success('Session created')
  } catch (err) {
    createError.value = err?.data?.message || err?.message || 'Failed to create session'
    toast.error(createError.value)
  } finally {
    createLoading.value = false
  }
}

async function handleBulkCreate() {
  createError.value = ''
  createLoading.value = true
  try {
    const data = await $fetch('/api/admin/bulk-sessions', {
      method: 'POST',
      body: { testTypeId: createForm.testTypeId, participantIds: bulkParticipantIds.value },
      headers: getAuthHeaders(),
    })
    bulkResult.value = data
    toast.success(`${data.created?.length || 0} session(s) created`)
  } catch (err) {
    createError.value = err?.data?.message || err?.message || 'Failed to create sessions'
    toast.error(createError.value)
  } finally {
    createLoading.value = false
  }
}

async function handlePublicCreate() {
  createError.value = ''
  createLoading.value = true
  try {
    const maxUses = publicForm.maxUses === '' || publicForm.maxUses == null
      ? null
      : Number(publicForm.maxUses)
    const data = await $fetch('/api/admin/open-invitations', {
      method: 'POST',
      body: {
        testTypeIds: publicForm.testTypeIds,
        testTypeId: publicForm.testTypeIds[0],
        label: publicForm.label || null,
        maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
        expiresAt: publicForm.expiresAt || null,
      },
      headers: getAuthHeaders(),
    })
    createdInvite.value = window.location.origin + data.invitationPath
    toast.success('Public link created')
  } catch (err) {
    createError.value = err?.data?.message || err?.message || 'Failed to create public link'
    toast.error(createError.value)
  } finally {
    createLoading.value = false
  }
}

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(createdInvite.value)
    copied.value = true
    toast.success('Link copied')
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard API unavailable — link is still visible/selectable in the input
  }
}

function finishCreate() {
  showCreate.value = false
  bulkResult.value = null
  loadSessions()
}
</script>
