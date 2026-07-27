<template>
  <div class="space-y-4 md:space-y-6">
    <div class="min-w-0">
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-sm md:text-base text-muted-foreground">Manage your account and system preferences</p>
    </div>

    <UiTabs v-if="user" v-model="activeTab" orientation="vertical" class="w-full flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
      <UiTabsList class="w-full h-auto shrink-0 md:w-56 flex-row md:flex-col items-stretch justify-start gap-1 bg-transparent p-0">
        <UiTabsTrigger
          value="profile"
          class="w-full justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
        >
          Profile
        </UiTabsTrigger>
        <UiTabsTrigger
          value="security"
          class="w-full justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
        >
          Security
        </UiTabsTrigger>
        <UiTabsTrigger
          v-if="isAdmin"
          value="users"
          class="w-full justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
        >
          Users
        </UiTabsTrigger>
        <UiTabsTrigger
          v-if="canManageRbac"
          value="rbac"
          class="w-full justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
        >
          Roles & Permissions
        </UiTabsTrigger>
      </UiTabsList>

      <div class="min-w-0 flex-1">
      <!-- Profile Tab -->
      <UiTabsContent value="profile" class="mt-0 space-y-4">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle>Profile Information</UiCardTitle>
            <UiCardDescription>Update your name and email address</UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <form @submit.prevent="updateProfile" class="space-y-4">
              <div class="space-y-2">
                <UiLabel for="profile-name">Name</UiLabel>
                <UiInput id="profile-name" v-model="profileForm.name" required class="h-10" />
              </div>
              <div class="space-y-2">
                <UiLabel for="profile-email">Email</UiLabel>
                <UiInput id="profile-email" v-model="profileForm.email" type="email" required class="h-10" />
              </div>
              <div class="space-y-1">
                <UiLabel class="text-xs text-muted-foreground">Role</UiLabel>
                <p class="text-sm font-medium">{{ user.role }}</p>
              </div>

              <div v-if="profileError" class="text-xs text-destructive">{{ profileError }}</div>
              <div v-if="profileSuccess" class="text-xs text-green-600">{{ profileSuccess }}</div>

              <UiButton type="submit" :disabled="profileLoading" class="h-10">
                {{ profileLoading ? 'Saving...' : 'Save Changes' }}
              </UiButton>
            </form>
          </UiCardContent>
        </UiCard>
      </UiTabsContent>

      <!-- Security Tab -->
      <UiTabsContent value="security" class="mt-0 space-y-4">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle>Change Password</UiCardTitle>
            <UiCardDescription>Update your account password</UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <form @submit.prevent="updatePassword" class="space-y-4">
              <div class="space-y-2">
                <UiLabel for="current-password">Current Password</UiLabel>
                <UiInput id="current-password" v-model="passwordForm.currentPassword" type="password" required class="h-10" />
              </div>
              <div class="space-y-2">
                <UiLabel for="new-password">New Password</UiLabel>
                <UiInput id="new-password" v-model="passwordForm.newPassword" type="password" required class="h-10" minlength="6" />
              </div>
              <div class="space-y-2">
                <UiLabel for="confirm-password">Confirm New Password</UiLabel>
                <UiInput id="confirm-password" v-model="passwordForm.confirmPassword" type="password" required class="h-10" />
              </div>

              <div v-if="passwordError" class="text-xs text-destructive">{{ passwordError }}</div>
              <div v-if="passwordSuccess" class="text-xs text-green-600">{{ passwordSuccess }}</div>

              <UiButton type="submit" :disabled="passwordLoading" class="h-10">
                {{ passwordLoading ? 'Updating...' : 'Update Password' }}
              </UiButton>
            </form>
          </UiCardContent>
        </UiCard>
      </UiTabsContent>

      <!-- Users Tab (Admin only) -->
      <UiTabsContent v-if="isAdmin" value="users" class="mt-0 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">System Users</h3>
            <p class="text-sm text-muted-foreground">Manage user accounts and roles</p>
          </div>
          <UiButton v-if="can('users:create')" @click="showAddUser = true">
            <Icon icon="lucide:user-plus" class="size-4 md:mr-2" />
            <span class="hidden md:inline">Add User</span>
          </UiButton>
        </div>

        <UiResponsiveTable
          v-if="usersData.length"
          :columns="userColumns"
          :data="usersData"
          item-key="id"
          empty-message="No users found."
        >
          <template #cell-name="{ row }">
            <span class="font-medium text-sm truncate block max-w-[120px] md:max-w-none">
              {{ row.name }}
              <span v-if="row.id === user?.id" class="text-xs text-muted-foreground">(you)</span>
            </span>
          </template>

          <template #cell-email="{ row }">
            <span class="text-sm">{{ row.email }}</span>
          </template>

          <template #cell-role="{ row }">
            <UiBadge :variant="row.role === 'admin' ? 'default' : 'secondary'" class="text-xs">{{ row.role }}</UiBadge>
          </template>

          <template #cell-status="{ row }">
            <span :class="row.isActive ? 'text-green-600' : 'text-destructive'" class="text-xs font-medium">
              {{ row.isActive ? 'Active' : 'Inactive' }}
            </span>
          </template>

          <template #cell-actions="{ row }">
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton v-if="can('users:update')" variant="ghost" size="icon" class="size-8">
                  <Icon icon="lucide:more-horizontal" class="size-4" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent align="end">
                <UiDropdownMenuLabel>{{ row.name }}</UiDropdownMenuLabel>
                <UiDropdownMenuSeparator />
                <UiDropdownMenuItem
                  v-for="roleOption in availableRoles.filter((r) => r.name !== row.role)"
                  :key="roleOption.id"
                  @click="setUserRole(row, roleOption.name)"
                  :disabled="row.id === user?.id"
                >
                  <Icon icon="lucide:shield" class="size-4 mr-2" />
                  Set as {{ roleOption.label }}
                </UiDropdownMenuItem>
                <UiDropdownMenuSeparator />
                <UiDropdownMenuItem @click="toggleActive(row)" :disabled="row.id === user?.id">
                  <Icon :icon="row.isActive ? 'lucide:ban' : 'lucide:check-circle'" class="size-4 mr-2" />
                  {{ row.isActive ? 'Deactivate' : 'Activate' }}
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </template>
        </UiResponsiveTable>

        <div v-else class="text-sm text-muted-foreground text-center py-8">
          No users found.
        </div>

        <div v-if="usersError" class="text-xs text-destructive">{{ usersError }}</div>
        <div v-if="usersSuccess" class="text-xs text-green-600">{{ usersSuccess }}</div>
      </UiTabsContent>

      <!-- Roles & Permissions Tab -->
      <UiTabsContent v-if="canManageRbac" value="rbac" class="mt-0 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Roles & Permissions</h3>
            <p class="text-sm text-muted-foreground">Manage roles and what each one is allowed to do</p>
          </div>
          <UiButton @click="showAddRole = true">
            <Icon icon="lucide:shield-plus" class="size-4 md:mr-2" />
            <span class="hidden md:inline">Add Role</span>
          </UiButton>
        </div>

        <div v-if="rbacLoading" class="text-sm text-muted-foreground text-center py-8">Loading...</div>

        <div v-else class="space-y-4">
          <UiCard v-for="role in rolesData" :key="role.id">
            <UiCardHeader>
              <div class="flex items-start justify-between gap-2">
                <div>
                  <UiCardTitle class="flex items-center gap-2">
                    {{ role.label }}
                    <UiBadge v-if="role.isSystem" variant="secondary" class="text-xs">System</UiBadge>
                  </UiCardTitle>
                  <UiCardDescription>
                    {{ role.name }} · {{ role.userCount }} user{{ role.userCount === 1 ? '' : 's' }}
                  </UiCardDescription>
                </div>
                <UiButton
                  v-if="!role.isSystem"
                  variant="ghost"
                  size="icon"
                  class="size-8 text-destructive"
                  :disabled="role.userCount > 0"
                  :title="role.userCount > 0 ? 'Cannot delete: role still in use' : 'Delete role'"
                  @click="deleteRole(role)"
                >
                  <Icon icon="lucide:trash-2" class="size-4" />
                </UiButton>
              </div>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div v-if="roleDrafts[role.id]" class="space-y-2">
                <UiLabel :for="`role-label-${role.id}`">Display Name</UiLabel>
                <UiInput :id="`role-label-${role.id}`" v-model="roleDrafts[role.id].label" class="h-10 max-w-sm" />
              </div>

              <div v-if="roleDrafts[role.id]" class="space-y-3">
                <div v-for="group in permissionGroups" :key="group.resource" class="space-y-2">
                  <p class="text-xs font-semibold uppercase text-muted-foreground tracking-wide">{{ group.resource }}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      v-for="perm in group.items"
                      :key="perm.key"
                      class="flex items-center justify-between gap-2 text-sm rounded-md border px-3 py-2"
                    >
                      <span>{{ perm.label }}</span>
                      <UiSwitch v-model="roleDrafts[role.id].permissions[perm.key]" />
                    </label>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 pt-2">
                <UiButton :disabled="!isRoleDirty(role) || roleSaving[role.id]" @click="saveRole(role)">
                  {{ roleSaving[role.id] ? 'Saving...' : 'Save Changes' }}
                </UiButton>
                <UiButton v-if="isRoleDirty(role)" type="button" variant="outline" @click="resetRoleDraft(role)">
                  Cancel
                </UiButton>
              </div>
            </UiCardContent>
          </UiCard>
        </div>

        <div v-if="rbacError" class="text-xs text-destructive">{{ rbacError }}</div>
        <div v-if="rbacSuccess" class="text-xs text-green-600">{{ rbacSuccess }}</div>
      </UiTabsContent>
      </div>
    </UiTabs>

    <!-- Add User Dialog -->
    <UiDialog v-model:open="showAddUser">
      <UiDialogContent class="sm:max-w-md">
        <UiDialogHeader>
          <UiDialogTitle>Add User</UiDialogTitle>
          <UiDialogDescription>Create a new system user account</UiDialogDescription>
        </UiDialogHeader>
        <form @submit.prevent="handleAddUser" class="space-y-4">
          <div class="space-y-2">
            <UiLabel for="add-name">Name</UiLabel>
            <UiInput id="add-name" v-model="addUserForm.name" required class="h-10" />
          </div>
          <div class="space-y-2">
            <UiLabel for="add-email">Email</UiLabel>
            <UiInput id="add-email" v-model="addUserForm.email" type="email" required class="h-10" />
          </div>
          <div class="space-y-2">
            <UiLabel for="add-password">Password</UiLabel>
            <UiInput id="add-password" v-model="addUserForm.password" type="password" required class="h-10" minlength="6" />
          </div>
          <div class="space-y-2">
            <UiLabel for="add-role">Role</UiLabel>
            <UiSelect v-model="addUserForm.role">
              <UiSelectTrigger class="h-10">
                <UiSelectValue placeholder="Select role" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="roleOption in availableRoles" :key="roleOption.id" :value="roleOption.name">
                  {{ roleOption.label }}
                </UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <div v-if="addUserError" class="text-xs text-destructive">{{ addUserError }}</div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="showAddUser = false">Cancel</UiButton>
            <UiButton type="submit" :disabled="addUserLoading">{{ addUserLoading ? 'Creating...' : 'Create User' }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>

    <!-- Add Role Dialog -->
    <UiDialog v-model:open="showAddRole">
      <UiDialogContent class="sm:max-w-md">
        <UiDialogHeader>
          <UiDialogTitle>Add Role</UiDialogTitle>
          <UiDialogDescription>Create a new role, then choose its permissions below</UiDialogDescription>
        </UiDialogHeader>
        <form @submit.prevent="handleAddRole" class="space-y-4">
          <div class="space-y-2">
            <UiLabel for="add-role-name">Name</UiLabel>
            <UiInput id="add-role-name" v-model="addRoleForm.name" required class="h-10" placeholder="e.g. reviewer" />
            <p class="text-xs text-muted-foreground">Lowercase letters, numbers, or underscores. Cannot be changed later.</p>
          </div>
          <div class="space-y-2">
            <UiLabel for="add-role-label">Display Name</UiLabel>
            <UiInput id="add-role-label" v-model="addRoleForm.label" required class="h-10" placeholder="e.g. Reviewer" />
          </div>

          <div v-if="addRoleError" class="text-xs text-destructive">{{ addRoleError }}</div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="showAddRole = false">Cancel</UiButton>
            <UiButton type="submit" :disabled="addRoleLoading">{{ addRoleLoading ? 'Creating...' : 'Create Role' }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const { user, can, getAuthHeaders, fetchMe } = useAuth()
const isAdmin = computed(() => can('users:read'))
const canManageRbac = computed(() => can('rbac:manage'))
const toast = useToast()
const { confirm } = useConfirm()

const userColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', headClass: 'hidden sm:table-cell' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', headClass: 'w-24', mobileLabel: '' },
]

const activeTab = ref('profile')
const showAddUser = ref(false)

// Profile form
const profileForm = reactive({
  name: user.value?.name || '',
  email: user.value?.email || '',
})
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

async function updateProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  profileLoading.value = true
  try {
    const data = await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: { name: profileForm.name, email: profileForm.email },
      headers: getAuthHeaders(),
    })
    user.value = data.user
    profileSuccess.value = 'Profile updated successfully'
    toast.success('Profile updated')
  } catch (err) {
    profileError.value = err?.data?.message || err?.message || 'Failed to update profile'
    toast.error(profileError.value)
  } finally {
    profileLoading.value = false
  }
}

// Password form
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

async function updatePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    return
  }

  passwordLoading.value = true
  try {
    await $fetch('/api/auth/password', {
      method: 'PUT',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
      headers: getAuthHeaders(),
    })
    passwordSuccess.value = 'Password updated successfully'
    toast.success('Password updated')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err) {
    passwordError.value = err?.data?.message || err?.message || 'Failed to update password'
    toast.error(passwordError.value)
  } finally {
    passwordLoading.value = false
  }
}

// Users management
const usersData = ref([])
const usersLoading = ref(false)
const usersError = ref('')
const usersSuccess = ref('')

// Roles available to assign to users (shared by the Users tab's role picker
// and the Add User dialog) — readable by anyone with users:read, not just rbac:manage.
const availableRoles = ref([])

async function loadRoleOptions() {
  try {
    const data = await $fetch('/api/admin/rbac/roles', { headers: getAuthHeaders() })
    availableRoles.value = (data.roles || []).map((r) => ({ id: r.id, name: r.name, label: r.label }))
  } catch {
    // Non-fatal: role picker just stays empty if this fails
  }
}

async function loadUsers() {
  if (!isAdmin.value) return
  usersLoading.value = true
  usersError.value = ''
  try {
    const [data] = await Promise.all([
      $fetch('/api/admin/users', { headers: getAuthHeaders() }),
      loadRoleOptions(),
    ])
    usersData.value = data.users || []
  } catch (err) {
    usersError.value = err?.data?.message || 'Failed to load users'
    toast.error(usersError.value)
  } finally {
    usersLoading.value = false
  }
}

async function setUserRole(u, newRole) {
  usersError.value = ''
  usersSuccess.value = ''
  try {
    await $fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      body: { role: newRole },
      headers: getAuthHeaders(),
    })
    u.role = newRole
    usersSuccess.value = `${u.name} is now ${newRole}`
    toast.success(usersSuccess.value)
  } catch (err) {
    usersError.value = err?.data?.message || 'Failed to update role'
    toast.error(usersError.value)
  }
}

async function toggleActive(u) {
  usersError.value = ''
  usersSuccess.value = ''
  try {
    await $fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      body: { isActive: !u.isActive },
      headers: getAuthHeaders(),
    })
    u.isActive = !u.isActive
    usersSuccess.value = `${u.name} ${u.isActive ? 'activated' : 'deactivated'}`
    toast.success(usersSuccess.value)
  } catch (err) {
    usersError.value = err?.data?.message || 'Failed to update status'
    toast.error(usersError.value)
  }
}

// Add user form
const addUserForm = reactive({
  name: '',
  email: '',
  password: '',
  role: 'operator',
})
const addUserLoading = ref(false)
const addUserError = ref('')

async function handleAddUser() {
  addUserError.value = ''
  addUserLoading.value = true
  try {
    const data = await $fetch('/api/admin/users', {
      method: 'POST',
      body: { ...addUserForm },
      headers: getAuthHeaders(),
    })
    usersData.value.unshift(data.user)
    showAddUser.value = false
    addUserForm.name = ''
    addUserForm.email = ''
    addUserForm.password = ''
    addUserForm.role = 'operator'
    usersSuccess.value = `User ${data.user.name} created`
    toast.success(usersSuccess.value)
  } catch (err) {
    addUserError.value = err?.data?.message || err?.message || 'Failed to create user'
  } finally {
    addUserLoading.value = false
  }
}

// Roles & permissions management
const rolesData = ref([])
const permissionsData = ref([])
const rbacLoading = ref(false)
const rbacError = ref('')
const rbacSuccess = ref('')
const roleDrafts = reactive({})
const roleSaving = reactive({})

const permissionGroups = computed(() => {
  const groups = {}
  for (const perm of permissionsData.value) {
    if (!groups[perm.resource]) groups[perm.resource] = []
    groups[perm.resource].push(perm)
  }
  return Object.entries(groups).map(([resource, items]) => ({ resource, items }))
})

function buildRoleDraft(role) {
  const perms = {}
  for (const perm of permissionsData.value) {
    perms[perm.key] = role.permissionKeys.includes(perm.key)
  }
  return { label: role.label, permissions: perms }
}

function resetRoleDraft(role) {
  roleDrafts[role.id] = buildRoleDraft(role)
}

function isRoleDirty(role) {
  const draft = roleDrafts[role.id]
  if (!draft) return false
  if (draft.label !== role.label) return true
  return permissionsData.value.some(
    (perm) => !!draft.permissions[perm.key] !== role.permissionKeys.includes(perm.key),
  )
}

async function loadRbac() {
  if (!canManageRbac.value) return
  rbacLoading.value = true
  rbacError.value = ''
  try {
    const [rolesRes, permsRes] = await Promise.all([
      $fetch('/api/admin/rbac/roles', { headers: getAuthHeaders() }),
      $fetch('/api/admin/rbac/permissions', { headers: getAuthHeaders() }),
    ])
    permissionsData.value = permsRes.permissions || []
    rolesData.value = rolesRes.roles || []
    for (const role of rolesData.value) {
      roleDrafts[role.id] = buildRoleDraft(role)
    }
  } catch (err) {
    rbacError.value = err?.data?.message || 'Failed to load roles & permissions'
    toast.error(rbacError.value)
  } finally {
    rbacLoading.value = false
  }
}

async function saveRole(role) {
  rbacError.value = ''
  rbacSuccess.value = ''
  roleSaving[role.id] = true
  try {
    const draft = roleDrafts[role.id]
    const permissionKeys = Object.entries(draft.permissions).filter(([, checked]) => checked).map(([key]) => key)

    const data = await $fetch(`/api/admin/rbac/roles/${role.id}`, {
      method: 'PUT',
      body: { label: draft.label, permissionKeys },
      headers: getAuthHeaders(),
    })
    Object.assign(role, data.role)
    roleDrafts[role.id] = buildRoleDraft(role)
    rbacSuccess.value = `${role.label} updated`
    toast.success(rbacSuccess.value)

    // Refresh our own session's permissions immediately if we just edited our own role
    if (role.name === user.value?.role) {
      await fetchMe()
    }
  } catch (err) {
    rbacError.value = err?.data?.message || 'Failed to update role'
    toast.error(rbacError.value)
  } finally {
    roleSaving[role.id] = false
  }
}

async function deleteRole(role) {
  const ok = await confirm({
    title: `Delete role "${role.label}"?`,
    description: 'This cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'destructive',
  })
  if (!ok) return

  rbacError.value = ''
  rbacSuccess.value = ''
  try {
    await $fetch(`/api/admin/rbac/roles/${role.id}`, { method: 'DELETE', headers: getAuthHeaders() })
    rolesData.value = rolesData.value.filter((r) => r.id !== role.id)
    delete roleDrafts[role.id]
    rbacSuccess.value = `${role.label} deleted`
    toast.success(rbacSuccess.value)
  } catch (err) {
    rbacError.value = err?.data?.message || 'Failed to delete role'
    toast.error(rbacError.value)
  }
}

// Add role form
const showAddRole = ref(false)
const addRoleForm = reactive({ name: '', label: '' })
const addRoleLoading = ref(false)
const addRoleError = ref('')

async function handleAddRole() {
  addRoleError.value = ''
  addRoleLoading.value = true
  try {
    const data = await $fetch('/api/admin/rbac/roles', {
      method: 'POST',
      body: { ...addRoleForm },
      headers: getAuthHeaders(),
    })
    rolesData.value.push(data.role)
    roleDrafts[data.role.id] = buildRoleDraft(data.role)
    availableRoles.value.push({ id: data.role.id, name: data.role.name, label: data.role.label })
    showAddRole.value = false
    addRoleForm.name = ''
    addRoleForm.label = ''
    rbacSuccess.value = `Role ${data.role.label} created`
    toast.success(rbacSuccess.value)
  } catch (err) {
    addRoleError.value = err?.data?.message || err?.message || 'Failed to create role'
  } finally {
    addRoleLoading.value = false
  }
}

// Load users when tab switches to users, roles & permissions when switching to rbac
watch(activeTab, (tab) => {
  if (tab === 'users' && isAdmin.value) {
    loadUsers()
  }
  if (tab === 'rbac' && canManageRbac.value) {
    loadRbac()
  }
})
</script>
