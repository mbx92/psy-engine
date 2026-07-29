import { appSettings } from '~~/db/schema/appSettings'

const DEFAULTS = {
  maintenanceMode: false,
  maintenanceMessage: '',
  systemLocked: false,
}

export async function getSystemFlags() {
  const db = useDB()
  const [row] = await db.select({
    maintenanceMode: appSettings.maintenanceMode,
    maintenanceMessage: appSettings.maintenanceMessage,
    systemLocked: appSettings.systemLocked,
  }).from(appSettings).limit(1)

  return {
    maintenanceMode: row?.maintenanceMode ?? DEFAULTS.maintenanceMode,
    maintenanceMessage: row?.maintenanceMessage || DEFAULTS.maintenanceMessage,
    systemLocked: row?.systemLocked ?? DEFAULTS.systemLocked,
  }
}

export function isSuperadminRole(role) {
  return role === 'superadmin'
}
