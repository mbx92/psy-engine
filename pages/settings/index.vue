<template>
  <div class="space-y-4 md:space-y-6">
    <div class="min-w-0">
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-sm md:text-base text-muted-foreground">Manage your account and system preferences</p>
    </div>

    <UiTabs v-if="user" v-model="activeTab" class="w-full">
      <UiTabsList class="w-full sm:w-auto flex">
        <UiTabsTrigger value="profile" class="flex-1 sm:flex-none">Profile</UiTabsTrigger>
        <UiTabsTrigger value="security" class="flex-1 sm:flex-none">Security</UiTabsTrigger>
        <UiTabsTrigger v-if="isAdmin" value="users" class="flex-1 sm:flex-none">Users</UiTabsTrigger>
      </UiTabsList>

      <!-- Profile Tab -->
      <UiTabsContent value="profile" class="mt-4 space-y-4">
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
      <UiTabsContent value="security" class="mt-4 space-y-4">
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
      <UiTabsContent v-if="isAdmin" value="users" class="mt-4 space-y-4">
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
                <UiDropdownMenuItem @click="toggleRole(row)" :disabled="row.id === user?.id">
                  <Icon icon="lucide:shield" class="size-4 mr-2" />
                  {{ row.role === 'admin' ? 'Set as User' : 'Set as Admin' }}
                </UiDropdownMenuItem>
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
                <UiSelectItem value="admin">Admin</UiSelectItem>
                <UiSelectItem value="operator">Operator</UiSelectItem>
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
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '@/components/ui/responsive-table'

definePageMeta({
  middleware: 'auth',
})

const { user, can, getAuthHeaders } = useAuth()
const isAdmin = computed(() => can('users:read'))

const userColumns: ColumnDef[] = [
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
    const data: any = await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: { name: profileForm.name, email: profileForm.email },
      headers: getAuthHeaders(),
    })
    user.value = data.user
    profileSuccess.value = 'Profile updated successfully'
  } catch (err: any) {
    profileError.value = err?.data?.message || err?.message || 'Failed to update profile'
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
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    passwordError.value = err?.data?.message || err?.message || 'Failed to update password'
  } finally {
    passwordLoading.value = false
  }
}

// Users management
const usersData = ref<any[]>([])
const usersLoading = ref(false)
const usersError = ref('')
const usersSuccess = ref('')

async function loadUsers() {
  if (!isAdmin.value) return
  usersLoading.value = true
  usersError.value = ''
  try {
    const data: any = await $fetch('/api/admin/users', {
      headers: getAuthHeaders(),
    })
    usersData.value = data.users || []
  } catch (err: any) {
    usersError.value = err?.data?.message || 'Failed to load users'
  } finally {
    usersLoading.value = false
  }
}

async function toggleRole(u: any) {
  usersError.value = ''
  usersSuccess.value = ''
  const newRole = u.role === 'admin' ? 'operator' : 'admin'
  try {
    await $fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      body: { role: newRole },
      headers: getAuthHeaders(),
    })
    u.role = newRole
    usersSuccess.value = `${u.name} is now ${newRole}`
  } catch (err: any) {
    usersError.value = err?.data?.message || 'Failed to update role'
  }
}

async function toggleActive(u: any) {
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
  } catch (err: any) {
    usersError.value = err?.data?.message || 'Failed to update status'
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
    const data: any = await $fetch('/api/admin/users', {
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
  } catch (err: any) {
    addUserError.value = err?.data?.message || err?.message || 'Failed to create user'
  } finally {
    addUserLoading.value = false
  }
}

// Load users when tab switches to users
watch(activeTab, (tab) => {
  if (tab === 'users' && isAdmin.value) {
    loadUsers()
  }
})
</script>
