import type { TenantSettings } from "@/services/server/settings.service";

import { TenantSettingsForm } from "@/features/settings/components/tenant-settings-form";
import { PageTitle } from "@/shared/components/ui";

type SettingsPageProps = {
  tenant: TenantSettings;
};

export default function SettingsPage({ tenant }: SettingsPageProps) {
  return (
    <div className="space-y-6">
      <PageTitle title="Configuracion de empresa" subtitle="Solo ADMIN_EMPRESA puede editar branding base del tenant." />
      <TenantSettingsForm tenant={tenant} />
    </div>
  );
}

