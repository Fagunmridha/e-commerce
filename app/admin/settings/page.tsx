import { SettingsForm } from '@/components/admin/settings-form'
import { getStoreSettings } from '@/app/actions/settings'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await getStoreSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Store Settings
        </h1>
        <p className="text-muted-foreground">
          Manage platform-wide settings and defaults.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
