import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { Card, Input, Label, PageTitle, SubmitButton } from "@/components/ui";
import { updateTenantSettingsAction } from "@/lib/actions/settings";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await getSessionUser();

  if (!user || !user.tenantId || user.role !== Role.ADMIN_EMPRESA) {
    redirect("/app/dashboard");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      name: true,
      logoUrl: true,
      primaryColor: true,
      email: true,
      phone: true,
      address: true,
      nit: true,
    },
  });

  if (!tenant) {
    redirect("/app/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Configuración de empresa" subtitle="Solo ADMIN_EMPRESA puede editar branding base del tenant." />

      <Card>
        <form action={updateTenantSettingsAction} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Nombre comercial *</Label>
              <Input name="name" defaultValue={tenant.name} required />
            </div>
            <div>
              <Label>Color primario</Label>
              <Input name="primaryColor" defaultValue={tenant.primaryColor ?? ""} placeholder="#0f172a" />
            </div>
            <div className="md:col-span-2">
              <Label>Logo URL</Label>
              <Input name="logoUrl" defaultValue={tenant.logoUrl ?? ""} />
            </div>
          </div>
          <SubmitButton label="Guardar configuración" />
        </form>

        <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          <p>Email fiscal: {tenant.email ?? "-"}</p>
          <p>Teléfono: {tenant.phone ?? "-"}</p>
          <p>NIT: {tenant.nit ?? "-"}</p>
          <p>Dirección: {tenant.address ?? "-"}</p>
        </div>
      </Card>
    </div>
  );
}
