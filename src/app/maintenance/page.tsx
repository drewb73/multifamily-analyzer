import { MaintenancePage } from '@/components/MaintenancePage'
import { getSystemSettings } from '@/lib/settings'

export default async function MaintenanceRoute() {
  const settings = await getSystemSettings()
  
  return <MaintenancePage message={settings.maintenanceMessage || undefined} />
}