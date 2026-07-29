import { appSettings } from '~~/db/schema/appSettings'

/** Public branding + system status flags for login / chrome (no auth). */
export default defineEventHandler(async () => {
  const db = useDB()
  const [settings] = await db.select({
    systemName: appSettings.systemName,
    tagline: appSettings.tagline,
    timezone: appSettings.timezone,
    logo: appSettings.logo,
    maintenanceMode: appSettings.maintenanceMode,
    maintenanceMessage: appSettings.maintenanceMessage,
    systemLocked: appSettings.systemLocked,
  }).from(appSettings).limit(1)

  return {
    settings: settings || {
      systemName: 'PsyEngine',
      tagline: 'Psychology Test System',
      timezone: 'Asia/Jakarta',
      logo: null,
      maintenanceMode: false,
      maintenanceMessage: null,
      systemLocked: false,
    },
  }
})
