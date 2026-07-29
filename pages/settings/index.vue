<template>
  <div class="space-y-4 md:space-y-6">
    <div class="min-w-0">
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-sm md:text-base text-muted-foreground">Manage your account and system preferences</p>
    </div>

    <UiTabs v-if="user" v-model="activeTab" orientation="vertical" class="w-full flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
      <UiTabsList class="w-full h-auto shrink-0 md:w-56 flex-row md:flex-col items-stretch justify-start gap-1 bg-transparent p-0">
        <UiTabsTrigger
          v-if="can('settings:read')"
          value="general"
          class="w-full justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
        >
          General
        </UiTabsTrigger>
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
        <UiTabsTrigger
          v-if="can('settings:read')"
          value="psikogram"
          class="w-full justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
        >
          Psikogram
        </UiTabsTrigger>
        <UiTabsTrigger
          v-if="canSystemSetup"
          value="system"
          class="w-full justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
        >
          System Setup
        </UiTabsTrigger>
      </UiTabsList>

      <div class="min-w-0 flex-1">
      <!-- General Tab -->
      <UiTabsContent v-if="can('settings:read')" value="general" class="mt-0 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">General</h3>
            <p class="text-sm text-muted-foreground">Nama sistem, timezone, dan logo aplikasi</p>
          </div>
          <UiButton v-if="can('settings:update')" :disabled="generalSaving" @click="saveGeneralSettings">
            <Icon icon="lucide:save" class="size-4 mr-2" />
            {{ generalSaving ? 'Menyimpan...' : 'Simpan' }}
          </UiButton>
        </div>

        <div v-if="generalLoading" class="text-sm text-muted-foreground text-center py-8">Loading...</div>

        <template v-else>
          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Identitas Sistem</UiCardTitle>
              <UiCardDescription>Ditampilkan di navigasi dan halaman login</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div class="space-y-2">
                <UiLabel>Nama Sistem</UiLabel>
                <UiInput v-model="general.systemName" class="h-10" placeholder="PsyEngine" />
              </div>
              <div class="space-y-2">
                <UiLabel>Tagline</UiLabel>
                <UiInput v-model="general.tagline" class="h-10" placeholder="Psychology Test System" />
              </div>
              <div class="space-y-2">
                <UiLabel>Timezone</UiLabel>
                <UiSelect v-model="general.timezone">
                  <UiSelectTrigger class="h-10">
                    <UiSelectValue placeholder="Pilih timezone" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
                      {{ tz.label }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
                <p class="text-xs text-muted-foreground">Digunakan untuk tampilan tanggal/waktu di sistem</p>
              </div>
            </UiCardContent>
          </UiCard>

          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Logo Aplikasi</UiCardTitle>
              <UiCardDescription>PNG, JPG, atau SVG — maks. 2MB</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div class="flex items-center gap-4">
                <div class="size-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden shrink-0">
                  <img v-if="general.logo" :src="general.logo" alt="Logo" class="max-w-full max-h-full object-contain" />
                  <Icon v-else icon="lucide:brain" class="size-7 text-primary" />
                </div>
                <div class="space-y-1">
                  <input ref="appLogoInput" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" class="hidden" @change="handleAppLogoUpload" />
                  <UiButton type="button" variant="outline" size="sm" @click="appLogoInput?.click()">Upload Logo</UiButton>
                  <UiButton v-if="general.logo" type="button" variant="ghost" size="sm" class="text-destructive" @click="general.logo = ''">Hapus</UiButton>
                </div>
              </div>
              <div class="rounded-md border p-3 flex items-center gap-2.5 bg-muted/30">
                <div class="size-8 rounded flex items-center justify-center bg-background border overflow-hidden shrink-0">
                  <img v-if="general.logo" :src="general.logo" alt="" class="size-full object-contain" />
                  <Icon v-else icon="lucide:brain" class="size-4 text-primary" />
                </div>
                <span class="text-sm font-semibold">{{ general.systemName || 'PsyEngine' }}</span>
                <span class="text-xs text-muted-foreground truncate">{{ general.tagline || 'Psychology Test System' }}</span>
              </div>
            </UiCardContent>
          </UiCard>

          <div v-if="generalError" class="text-xs text-destructive">{{ generalError }}</div>
          <div v-if="generalSuccess" class="text-xs text-green-600">{{ generalSuccess }}</div>
        </template>
      </UiTabsContent>

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
            <UiBadge
              :variant="row.role === 'superadmin' ? 'verified' : row.role === 'admin' ? 'default' : 'secondary'"
              class="text-xs"
            >
              {{ row.role }}
            </UiBadge>
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

      <!-- Psikogram Settings Tab -->
      <UiTabsContent v-if="can('settings:read')" value="psikogram" class="mt-0 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Pengaturan Psikogram</h3>
            <p class="text-sm text-muted-foreground">Profil psikolog dan branding untuk laporan psikogram</p>
          </div>
          <UiButton v-if="can('settings:update')" :disabled="psikoSaving" @click="savePsikoSettings">
            <Icon icon="lucide:save" class="size-4 mr-2" />
            {{ psikoSaving ? 'Menyimpan...' : 'Simpan' }}
          </UiButton>
        </div>

        <div v-if="psikoLoading" class="text-sm text-muted-foreground text-center py-8">Loading...</div>

        <template v-else>
          <!-- Logo & Branding -->
          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Logo &amp; Branding</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <UiLabel>Logo Header Laporan</UiLabel>
                  <div class="flex items-center gap-3">
                    <div class="w-28 h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted overflow-hidden shrink-0">
                      <img v-if="psiko.logo" :src="psiko.logo" alt="Logo" class="max-w-full max-h-full object-contain" />
                      <Icon v-else icon="lucide:image" class="size-5 text-muted-foreground" />
                    </div>
                    <div class="space-y-1">
                      <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/svg+xml" class="hidden" @change="(e) => handleFileUpload(e, 'logo')" />
                      <UiButton type="button" variant="outline" size="sm" @click="logoInput?.click()">Upload</UiButton>
                      <UiButton v-if="psiko.logo" type="button" variant="ghost" size="sm" class="text-destructive" @click="psiko.logo = ''">Hapus</UiButton>
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <UiLabel>Footer / Banner Laporan</UiLabel>
                  <div class="flex items-center gap-3">
                    <div class="w-28 h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted overflow-hidden shrink-0">
                      <img v-if="psiko.footer" :src="psiko.footer" alt="Footer" class="max-w-full max-h-full object-contain" />
                      <Icon v-else icon="lucide:image" class="size-5 text-muted-foreground" />
                    </div>
                    <div class="space-y-1">
                      <input ref="footerInput" type="file" accept="image/png,image/jpeg,image/svg+xml" class="hidden" @change="(e) => handleFileUpload(e, 'footer')" />
                      <UiButton type="button" variant="outline" size="sm" @click="footerInput?.click()">Upload</UiButton>
                      <UiButton v-if="psiko.footer" type="button" variant="ghost" size="sm" class="text-destructive" @click="psiko.footer = ''">Hapus</UiButton>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <UiLabel>Warna Tabel &amp; Header PDF</UiLabel>
                  <p class="text-xs text-muted-foreground">Header tabel aspek, judul section, dan aksen laporan</p>
                  <div class="flex gap-2">
                    <UiInput v-model="psiko.primaryColor" type="color" class="w-12 h-10 p-1" />
                    <UiInput v-model="psiko.primaryColor" class="h-10 font-mono" placeholder="#16a34a" />
                  </div>
                </div>
                <div class="space-y-2">
                  <UiLabel>Warna Teks Sekunder</UiLabel>
                  <p class="text-xs text-muted-foreground">Tagline dan teks pendukung di header</p>
                  <div class="flex gap-2">
                    <UiInput v-model="psiko.secondaryColor" type="color" class="w-12 h-10 p-1" />
                    <UiInput v-model="psiko.secondaryColor" class="h-10 font-mono" placeholder="#6b7280" />
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <UiLabel>Preview Header Tabel</UiLabel>
                <div class="rounded-md border overflow-hidden text-xs">
                  <div
                    class="px-3 py-2 font-semibold text-white flex items-center justify-between"
                    :style="{ backgroundColor: psiko.primaryColor || '#16a34a' }"
                  >
                    <span>A. KECERDASAN</span>
                    <span class="opacity-90">PENGERTIAN &nbsp; R &nbsp; K &nbsp; C &nbsp; B &nbsp; T</span>
                  </div>
                  <div class="grid grid-cols-[auto_1fr_2fr_repeat(5,1.5rem)] gap-px bg-border text-[11px]">
                    <div class="bg-background px-2 py-1.5 text-center">1.</div>
                    <div class="bg-background px-2 py-1.5 font-medium">Contoh Aspek</div>
                    <div class="bg-background px-2 py-1.5 text-muted-foreground">Deskripsi singkat aspek...</div>
                    <div class="bg-background px-1 py-1.5 text-center">✓</div>
                    <div class="bg-background px-1 py-1.5" />
                    <div class="bg-background px-1 py-1.5" />
                    <div class="bg-background px-1 py-1.5" />
                    <div class="bg-background px-1 py-1.5" />
                  </div>
                </div>
                <div class="flex flex-wrap gap-2 pt-1">
                  <button
                    v-for="swatch in tableColorPresets"
                    :key="swatch"
                    type="button"
                    class="size-7 rounded-md border-2 transition-transform hover:scale-105"
                    :class="psiko.primaryColor?.toLowerCase() === swatch ? 'border-foreground' : 'border-transparent'"
                    :style="{ backgroundColor: swatch }"
                    :title="swatch"
                    @click="psiko.primaryColor = swatch"
                  />
                </div>
              </div>
            </UiCardContent>
          </UiCard>

          <!-- Psychologist Info -->
          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Informasi Psikolog</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <UiLabel>Nama Psikolog</UiLabel>
                <UiInput v-model="psiko.psychologistName" class="h-10" placeholder="Contoh: Dr. Sarah, M.Psi" />
              </div>
              <div class="space-y-2">
                <UiLabel>No. STR/SIPP</UiLabel>
                <UiInput v-model="psiko.licenseNumber" class="h-10" placeholder="Contoh: SIPP.1234.05.2020" />
              </div>
              <div class="space-y-2">
                <UiLabel>Email</UiLabel>
                <UiInput v-model="psiko.email" type="email" class="h-10" />
              </div>
              <div class="space-y-2">
                <UiLabel>No. Telepon</UiLabel>
                <UiInput v-model="psiko.phone" class="h-10" />
              </div>
            </UiCardContent>
          </UiCard>

          <!-- Institution Info -->
          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Informasi Instansi / Tempat Praktek</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2 sm:col-span-2">
                <UiLabel>Nama Instansi</UiLabel>
                <UiInput v-model="psiko.institutionName" class="h-10" />
              </div>
              <div class="space-y-2 sm:col-span-2">
                <UiLabel>Tagline / Slogan</UiLabel>
                <UiInput v-model="psiko.tagline" class="h-10" />
              </div>
              <div class="space-y-2 sm:col-span-2">
                <UiLabel>Alamat</UiLabel>
                <UiTextarea v-model="psiko.address" rows="2" />
              </div>
              <div class="space-y-2">
                <UiLabel>Website</UiLabel>
                <UiInput v-model="psiko.institutionWebsite" type="url" class="h-10" />
              </div>
              <div class="space-y-2">
                <UiLabel>Email Instansi</UiLabel>
                <UiInput v-model="psiko.institutionEmail" type="email" class="h-10" />
              </div>
              <div class="space-y-2">
                <UiLabel>No. Telepon Instansi</UiLabel>
                <UiInput v-model="psiko.institutionPhone" class="h-10" />
              </div>
              <div class="space-y-2">
                <UiLabel>Instagram</UiLabel>
                <UiInput v-model="psiko.instagram" class="h-10" placeholder="username" />
              </div>
            </UiCardContent>
          </UiCard>

          <!-- Report Settings -->
          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Pengaturan Laporan</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div class="space-y-2">
                <UiLabel>Judul Laporan</UiLabel>
                <UiInput v-model="psiko.reportTitle" class="h-10" placeholder="Contoh: PSIKOGRAM" />
              </div>
              <div class="space-y-2">
                <UiLabel>Sub Judul</UiLabel>
                <UiInput v-model="psiko.reportSubtitle" class="h-10" placeholder="Contoh: Hasil Pemeriksaan Psikologis" />
              </div>
              <div class="space-y-2">
                <UiLabel>Footer Laporan</UiLabel>
                <UiTextarea v-model="psiko.reportFooter" rows="2" />
              </div>

              <div class="pt-2 space-y-2">
                <label class="flex items-center justify-between gap-2 text-sm rounded-md border px-3 py-2">
                  <span>Tampilkan logo pada laporan</span>
                  <UiSwitch v-model="psiko.showLogo" />
                </label>
                <label class="flex items-center justify-between gap-2 text-sm rounded-md border px-3 py-2">
                  <span>Tampilkan tanda tangan psikolog</span>
                  <UiSwitch v-model="psiko.showSignature" />
                </label>
                <label class="flex items-center justify-between gap-2 text-sm rounded-md border px-3 py-2">
                  <span>Tampilkan watermark pada laporan</span>
                  <UiSwitch v-model="psiko.showWatermark" />
                </label>
              </div>
            </UiCardContent>
          </UiCard>

          <!-- Signature -->
          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Tanda Tangan Digital</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div class="flex gap-1 w-fit rounded-md border p-1">
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm rounded"
                  :class="signatureMode === 'draw' ? 'bg-muted font-medium' : 'text-muted-foreground'"
                  @click="signatureMode = 'draw'"
                >
                  Gambar Langsung
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm rounded"
                  :class="signatureMode === 'upload' ? 'bg-muted font-medium' : 'text-muted-foreground'"
                  @click="signatureMode = 'upload'"
                >
                  Upload File
                </button>
              </div>

              <div v-if="signatureMode === 'draw'" class="space-y-3">
                <canvas
                  ref="signatureCanvas"
                  class="w-full h-40 border-2 rounded-lg bg-white cursor-crosshair"
                  @mousedown="startDrawing"
                  @mousemove="draw"
                  @mouseup="stopDrawing"
                  @mouseleave="stopDrawing"
                  @touchstart.prevent="startDrawingTouch"
                  @touchmove.prevent="drawTouch"
                  @touchend="stopDrawing"
                />
                <div class="flex gap-2">
                  <UiButton type="button" variant="outline" size="sm" @click="clearSignatureCanvas">Hapus</UiButton>
                  <UiButton type="button" size="sm" :disabled="!hasDrawnSignature" @click="saveSignatureFromCanvas">Gunakan Tanda Tangan Ini</UiButton>
                </div>
              </div>

              <div v-else class="flex items-center gap-3">
                <div class="w-40 h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted overflow-hidden shrink-0">
                  <img v-if="psiko.signature" :src="psiko.signature" alt="Signature" class="max-w-full max-h-full object-contain" />
                  <Icon v-else icon="lucide:pen-line" class="size-5 text-muted-foreground" />
                </div>
                <div class="space-y-1">
                  <input ref="signatureInput" type="file" accept="image/png,image/jpeg,image/svg+xml" class="hidden" @change="(e) => handleFileUpload(e, 'signature')" />
                  <UiButton type="button" variant="outline" size="sm" @click="signatureInput?.click()">Upload Tanda Tangan</UiButton>
                  <UiButton v-if="psiko.signature" type="button" variant="ghost" size="sm" class="text-destructive" @click="psiko.signature = ''">Hapus</UiButton>
                </div>
              </div>
            </UiCardContent>
          </UiCard>

          <div v-if="psikoError" class="text-xs text-destructive">{{ psikoError }}</div>
          <div v-if="psikoSuccess" class="text-xs text-green-600">{{ psikoSuccess }}</div>

          <div class="flex justify-end pb-4">
            <UiButton v-if="can('settings:update')" :disabled="psikoSaving" @click="savePsikoSettings">
              <Icon icon="lucide:save" class="size-4 mr-2" />
              {{ psikoSaving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
            </UiButton>
          </div>
        </template>
      </UiTabsContent>

      <!-- System Setup Tab (superadmin only) -->
      <UiTabsContent v-if="canSystemSetup" value="system" class="mt-0 space-y-4">
        <div>
          <h3 class="text-lg font-semibold">System Setup</h3>
          <p class="text-sm text-muted-foreground">Backup, mode pemeliharaan, dan penguncian sistem</p>
        </div>

        <div v-if="systemLoading" class="text-sm text-muted-foreground text-center py-8">Loading...</div>

        <template v-else>
          <UiCard class="border-destructive/40">
            <UiCardHeader>
              <UiCardTitle class="text-base text-destructive">Lock Sistem</UiCardTitle>
              <UiCardDescription>Menonaktifkan seluruh akses (staff dan partisipan) hingga dibuka kembali</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-medium">{{ systemForm.systemLocked ? 'Sistem terkunci' : 'Sistem terbuka' }}</p>
                  <p class="text-xs text-muted-foreground">Tindakan ini bersifat kritis. Pastikan sesi Anda tetap aktif sebelum mengunci.</p>
                </div>
                <UiBadge :variant="systemForm.systemLocked ? 'abandoned' : 'completed'" class="text-xs shrink-0">
                  {{ systemForm.systemLocked ? 'Locked' : 'Open' }}
                </UiBadge>
              </div>

              <div v-if="!lockConfirming" class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
                  :class="systemForm.systemLocked
                    ? 'border border-input bg-background hover:bg-accent'
                    : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'"
                  :disabled="systemSaving"
                  @click="beginLockToggle"
                >
                  <Icon :icon="systemForm.systemLocked ? 'lucide:lock-open' : 'lucide:lock'" class="size-4" />
                  {{ systemSaving ? 'Menyimpan...' : (systemForm.systemLocked ? 'Buka Kunci Sistem' : 'Kunci Sistem') }}
                </button>
              </div>

              <div v-else class="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-3">
                <p class="text-sm font-medium">
                  {{ systemForm.systemLocked ? 'Buka kunci sistem sekarang?' : 'Kunci sistem sekarang?' }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ systemForm.systemLocked
                    ? 'Akses masuk akan dibuka kembali untuk seluruh pengguna aktif.'
                    : 'Akses masuk dan API akan ditangguhkan hingga sistem dibuka kembali.' }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="inline-flex h-9 items-center justify-center rounded-full border border-input bg-background px-3 text-sm hover:bg-accent disabled:opacity-50"
                    :disabled="systemSaving"
                    @click="lockConfirming = false"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-9 items-center justify-center rounded-full px-3 text-sm font-medium disabled:opacity-50"
                    :class="systemForm.systemLocked
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'"
                    :disabled="systemSaving"
                    @click="confirmLockToggle"
                  >
                    {{ systemSaving ? 'Menyimpan...' : (systemForm.systemLocked ? 'Ya, Buka Kunci' : 'Ya, Kunci Sistem') }}
                  </button>
                </div>
              </div>
            </UiCardContent>
          </UiCard>

          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Maintenance Mode</UiCardTitle>
              <UiCardDescription>Menangguhkan seluruh akses (staff dan partisipan) selama pemeliharaan berlangsung</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-medium">Aktifkan maintenance</p>
                  <p class="text-xs text-muted-foreground">Tampilkan pesan dan blokir akses user biasa</p>
                </div>
                <UiSwitch
                  v-model="systemForm.maintenanceMode"
                  :disabled="systemSaving"
                  @update:model-value="(v) => toggleMaintenance(v)"
                />
              </div>
              <div class="space-y-2">
                <UiLabel>Pesan maintenance</UiLabel>
                <UiTextarea
                  v-model="systemForm.maintenanceMessage"
                  class="min-h-[80px]"
                  placeholder="Sistem sedang dalam pemeliharaan. Silakan coba kembali nanti."
                />
              </div>
              <UiButton type="button" size="sm" variant="outline" :disabled="systemSaving" @click="saveMaintenanceMessage">
                Simpan Pesan
              </UiButton>
            </UiCardContent>
          </UiCard>

          <UiCard>
            <UiCardHeader>
              <UiCardTitle class="text-base">Backup Database</UiCardTitle>
              <UiCardDescription>Unduh dump SQL PostgreSQL (membutuhkan pg_dump di server)</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-3">
              <UiButton type="button" variant="outline" :disabled="backupLoading" @click="downloadBackup">
                <Icon icon="lucide:database-backup" class="size-4 mr-2" />
                {{ backupLoading ? 'Menyiapkan backup...' : 'Download Backup SQL' }}
              </UiButton>
              <p v-if="backupError" class="text-xs text-destructive">{{ backupError }}</p>
            </UiCardContent>
          </UiCard>

          <div v-if="systemError" class="text-xs text-destructive">{{ systemError }}</div>
          <div v-if="systemSuccess" class="text-xs text-green-600">{{ systemSuccess }}</div>
        </template>
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
const canSystemSetup = computed(() => can('system:manage'))
const toast = useToast()
const { confirm } = useConfirm()
const { applyLocal: applyAppSettingsLocal, refresh: refreshAppSettings } = useAppSettings()

const userColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', headClass: 'hidden sm:table-cell' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', headClass: 'w-24', mobileLabel: '' },
]

const activeTab = ref(can('settings:read') ? 'general' : 'profile')
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
    availableRoles.value = (data.roles || [])
      .filter((r) => canSystemSetup.value || r.name !== 'superadmin')
      .map((r) => ({ id: r.id, name: r.name, label: r.label }))
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
    permissionsData.value = (permsRes.permissions || []).filter(
      (p) => canSystemSetup.value || p.key !== 'system:manage',
    )
    rolesData.value = (rolesRes.roles || []).filter(
      (r) => canSystemSetup.value || r.name !== 'superadmin',
    )
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

// General (app) settings
const generalLoading = ref(false)
const generalSaving = ref(false)
const generalError = ref('')
const generalSuccess = ref('')
const generalLoaded = ref(false)
const appLogoInput = ref(null)

const general = reactive({
  systemName: 'PsyEngine',
  tagline: 'Psychology Test System',
  timezone: 'Asia/Jakarta',
  logo: '',
})

const timezoneOptions = [
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB, UTC+7)' },
  { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA, UTC+8)' },
  { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT, UTC+9)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)' },
  { value: 'UTC', label: 'UTC' },
]

async function loadGeneralSettings() {
  if (!can('settings:read')) return
  generalLoading.value = true
  generalError.value = ''
  try {
    const data = await $fetch('/api/admin/app-settings', { headers: getAuthHeaders() })
    if (data.settings) {
      general.systemName = data.settings.systemName || 'PsyEngine'
      general.tagline = data.settings.tagline || 'Psychology Test System'
      general.timezone = data.settings.timezone || 'Asia/Jakarta'
      general.logo = data.settings.logo || ''
    }
    generalLoaded.value = true
  } catch (err) {
    generalError.value = err?.data?.message || 'Failed to load general settings'
    toast.error(generalError.value)
  } finally {
    generalLoading.value = false
  }
}

function handleAppLogoUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Ukuran file melebihi 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => { general.logo = e.target.result }
  reader.readAsDataURL(file)
  event.target.value = ''
}

async function saveGeneralSettings() {
  generalSaving.value = true
  generalError.value = ''
  generalSuccess.value = ''
  try {
    const data = await $fetch('/api/admin/app-settings', {
      method: 'PUT',
      body: {
        systemName: general.systemName,
        tagline: general.tagline,
        timezone: general.timezone,
        logo: general.logo || null,
      },
      headers: getAuthHeaders(),
    })
    if (data.settings) {
      general.systemName = data.settings.systemName || 'PsyEngine'
      general.tagline = data.settings.tagline || 'Psychology Test System'
      general.timezone = data.settings.timezone || 'Asia/Jakarta'
      general.logo = data.settings.logo || ''
      applyAppSettingsLocal({
        systemName: general.systemName,
        tagline: general.tagline,
        timezone: general.timezone,
        logo: general.logo || null,
      })
    }
    generalSuccess.value = 'Pengaturan berhasil disimpan'
    toast.success(generalSuccess.value)
    await refreshAppSettings()
  } catch (err) {
    generalError.value = err?.data?.message || err?.message || 'Gagal menyimpan pengaturan'
    toast.error(generalError.value)
  } finally {
    generalSaving.value = false
  }
}

// Psikogram settings
const psikoLoading = ref(false)
const psikoSaving = ref(false)
const psikoError = ref('')
const psikoSuccess = ref('')
const psikoLoaded = ref(false)

const logoInput = ref(null)
const footerInput = ref(null)
const signatureInput = ref(null)
const signatureCanvas = ref(null)
const signatureMode = ref('draw')
const isDrawing = ref(false)
const hasDrawnSignature = ref(false)
let canvasContext = null

const psiko = reactive({
  logo: '',
  footer: '',
  primaryColor: '#16a34a',
  secondaryColor: '#6b7280',
  psychologistName: '',
  licenseNumber: '',
  email: '',
  phone: '',
  institutionName: '',
  tagline: '',
  address: '',
  institutionWebsite: '',
  institutionEmail: '',
  institutionPhone: '',
  instagram: '',
  reportTitle: 'PSIKOGRAM',
  reportSubtitle: 'Hasil Pemeriksaan Psikologis',
  reportFooter: '',
  showLogo: true,
  showSignature: true,
  showWatermark: false,
  signature: '',
})

const tableColorPresets = ['#16a34a', '#1e3a5f', '#1456f0', '#7c3aed', '#be123c', '#0f766e', '#c2410c']

async function loadPsikoSettings() {
  if (!can('settings:read')) return
  psikoLoading.value = true
  psikoError.value = ''
  try {
    const data = await $fetch('/api/admin/psychology-settings', { headers: getAuthHeaders() })
    if (data.settings) Object.assign(psiko, data.settings)
    psikoLoaded.value = true
  } catch (err) {
    psikoError.value = err?.data?.message || 'Failed to load psikogram settings'
    toast.error(psikoError.value)
  } finally {
    psikoLoading.value = false
  }
}

function handleFileUpload(event, field) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Ukuran file melebihi 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => { psiko[field] = e.target.result }
  reader.readAsDataURL(file)
}

function initSignatureCanvas() {
  if (!signatureCanvas.value) return
  const canvas = signatureCanvas.value
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  canvasContext = canvas.getContext('2d')
  canvasContext.lineCap = 'round'
  canvasContext.lineJoin = 'round'
  canvasContext.strokeStyle = '#000000'
  canvasContext.lineWidth = 2
}

function pointerPos(e, isTouch) {
  const rect = signatureCanvas.value.getBoundingClientRect()
  const point = isTouch ? e.touches[0] : e
  return { x: point.clientX - rect.left, y: point.clientY - rect.top }
}

function startDrawing(e) {
  if (!canvasContext) initSignatureCanvas()
  isDrawing.value = true
  hasDrawnSignature.value = true
  const { x, y } = pointerPos(e, false)
  canvasContext.beginPath()
  canvasContext.moveTo(x, y)
}

function draw(e) {
  if (!isDrawing.value || !canvasContext) return
  const { x, y } = pointerPos(e, false)
  canvasContext.lineTo(x, y)
  canvasContext.stroke()
}

function stopDrawing() {
  isDrawing.value = false
}

function startDrawingTouch(e) {
  if (!canvasContext) initSignatureCanvas()
  isDrawing.value = true
  hasDrawnSignature.value = true
  const { x, y } = pointerPos(e, true)
  canvasContext.beginPath()
  canvasContext.moveTo(x, y)
}

function drawTouch(e) {
  if (!isDrawing.value || !canvasContext) return
  const { x, y } = pointerPos(e, true)
  canvasContext.lineTo(x, y)
  canvasContext.stroke()
}

function clearSignatureCanvas() {
  if (!signatureCanvas.value) return
  const ctx = signatureCanvas.value.getContext('2d')
  ctx.clearRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height)
  hasDrawnSignature.value = false
}

function saveSignatureFromCanvas() {
  if (!signatureCanvas.value) return
  psiko.signature = signatureCanvas.value.toDataURL('image/png')
  toast.success('Tanda tangan disimpan')
}

async function savePsikoSettings() {
  psikoSaving.value = true
  psikoError.value = ''
  psikoSuccess.value = ''
  try {
    const data = await $fetch('/api/admin/psychology-settings', {
      method: 'PUT',
      body: { ...psiko },
      headers: getAuthHeaders(),
    })
    if (data.settings) Object.assign(psiko, data.settings)
    psikoSuccess.value = 'Pengaturan berhasil disimpan'
    toast.success(psikoSuccess.value)
  } catch (err) {
    psikoError.value = err?.data?.message || err?.message || 'Gagal menyimpan pengaturan'
    toast.error(psikoError.value)
  } finally {
    psikoSaving.value = false
  }
}

// System Setup (superadmin)
const systemLoading = ref(false)
const systemSaving = ref(false)
const systemError = ref('')
const systemSuccess = ref('')
const systemLoaded = ref(false)
const backupLoading = ref(false)
const backupError = ref('')
const systemForm = reactive({
  maintenanceMode: false,
  maintenanceMessage: '',
  systemLocked: false,
})
const lockConfirming = ref(false)

async function loadSystemSetup() {
  if (!canSystemSetup.value) return
  systemLoading.value = true
  systemError.value = ''
  try {
    const data = await $fetch('/api/admin/system/status', { headers: getAuthHeaders() })
    systemForm.maintenanceMode = !!data.settings?.maintenanceMode
    systemForm.maintenanceMessage = data.settings?.maintenanceMessage || ''
    systemForm.systemLocked = !!data.settings?.systemLocked
    systemLoaded.value = true
  } catch (err) {
    systemError.value = err?.data?.message || 'Failed to load system status'
    toast.error(systemError.value)
  } finally {
    systemLoading.value = false
  }
}

async function patchSystemStatus(body, successMsg) {
  systemSaving.value = true
  systemError.value = ''
  systemSuccess.value = ''
  try {
    const data = await $fetch('/api/admin/system/status', {
      method: 'PUT',
      body,
      headers: getAuthHeaders(),
    })
    systemForm.maintenanceMode = !!data.settings?.maintenanceMode
    systemForm.maintenanceMessage = data.settings?.maintenanceMessage || ''
    systemForm.systemLocked = !!data.settings?.systemLocked
    applyAppSettingsLocal({
      maintenanceMode: systemForm.maintenanceMode,
      maintenanceMessage: systemForm.maintenanceMessage,
      systemLocked: systemForm.systemLocked,
    })
    systemSuccess.value = successMsg
    toast.success(successMsg)
  } catch (err) {
    systemError.value = err?.data?.message || err?.message || 'Gagal memperbarui status sistem'
    toast.error(systemError.value)
    throw err
  } finally {
    systemSaving.value = false
  }
}

async function toggleMaintenance(next) {
  const previous = !next
  systemForm.maintenanceMode = next
  try {
    await patchSystemStatus(
      { maintenanceMode: next, maintenanceMessage: systemForm.maintenanceMessage || null },
      next ? 'Maintenance mode aktif' : 'Maintenance mode dimatikan',
    )
  } catch {
    systemForm.maintenanceMode = previous
  }
}

async function saveMaintenanceMessage() {
  await patchSystemStatus(
    { maintenanceMessage: systemForm.maintenanceMessage || null },
    'Pesan maintenance disimpan',
  )
}

function beginLockToggle() {
  lockConfirming.value = true
}

async function confirmLockToggle() {
  const next = !systemForm.systemLocked
  const previous = systemForm.systemLocked
  systemForm.systemLocked = next
  lockConfirming.value = false
  try {
    await patchSystemStatus(
      { systemLocked: next },
      next ? 'Sistem terkunci' : 'Sistem terbuka kembali',
    )
  } catch {
    systemForm.systemLocked = previous
  }
}

async function downloadBackup() {
  backupLoading.value = true
  backupError.value = ''
  try {
    const blob = await $fetch('/api/admin/system/backup', {
      method: 'POST',
      headers: getAuthHeaders(),
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    a.href = url
    a.download = `psy-engine-backup-${stamp}.sql`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup berhasil diunduh')
  } catch (err) {
    backupError.value = err?.data?.message || err?.message || 'Backup gagal. Pastikan pg_dump tersedia di server.'
    toast.error(backupError.value)
  } finally {
    backupLoading.value = false
  }
}

// Load users when tab switches to users, roles & permissions when switching to rbac
watch(activeTab, (tab) => {
  lockConfirming.value = false
  if (tab === 'users' && isAdmin.value) {
    loadUsers()
  }
  if (tab === 'rbac' && canManageRbac.value) {
    loadRbac()
  }
  if (tab === 'general' && !generalLoaded.value) {
    loadGeneralSettings()
  }
  if (tab === 'psikogram' && !psikoLoaded.value) {
    loadPsikoSettings()
    nextTick(() => setTimeout(initSignatureCanvas, 100))
  }
  if (tab === 'system') {
    if (!systemLoaded.value) loadSystemSetup()
  }
})

onMounted(() => {
  if (activeTab.value === 'general') loadGeneralSettings()
  if (activeTab.value === 'system') loadSystemSetup()
})
</script>
