import { Role } from "@prisma/client";

import { Card, FormGrid, Input, Label, PageTitle, SmallButton, SubmitButton } from "@/components/ui";
import { createTenantAction, createTenantAdminAction, toggleTenantStatusAction } from "@/lib/actions/super";
import { prisma } from "@/lib/prisma";

export default async function SuperTenantsPage() {
  const [tenants, admins] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            products: true,
            sales: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.ADMIN_EMPRESA },
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle title="Tenants" subtitle="Gestiona empresas, estado y usuarios ADMIN_EMPRESA." />

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear tenant</h2>
        <form action={createTenantAction} className="space-y-3">
          <FormGrid>
            <div>
              <Label>Nombre empresa *</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>NIT</Label>
              <Input name="nit" />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input name="phone" />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input name="address" />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input name="logoUrl" />
            </div>
            <div>
              <Label>Color primario</Label>
              <Input name="primaryColor" placeholder="#0f172a" />
            </div>
          </FormGrid>
          <SubmitButton label="Crear tenant" />
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear ADMIN_EMPRESA</h2>
        <form action={createTenantAdminAction} className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>Tenant *</Label>
            <select
              name="tenantId"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring"
            >
              <option value="">Selecciona...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Email *</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Password inicial *</Label>
            <Input name="password" type="text" required minLength={6} />
          </div>
          <div className="flex items-end">
            <SubmitButton label="Crear admin" />
          </div>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Email</th>
                <th className="py-2">Tenant</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-slate-100">
                  <td className="py-2">{admin.email}</td>
                  <td className="py-2">{admin.tenant?.name ?? "-"}</td>
                  <td className="py-2">{admin.isActive ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Listado de tenants</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Empresa</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Usuarios</th>
                <th className="py-2">Clientes</th>
                <th className="py-2">Productos</th>
                <th className="py-2">Ventas</th>
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-900">{tenant.name}</td>
                  <td className="py-2">{tenant.isActive ? "Activo" : "Inactivo"}</td>
                  <td className="py-2">{tenant._count.users}</td>
                  <td className="py-2">{tenant._count.customers}</td>
                  <td className="py-2">{tenant._count.products}</td>
                  <td className="py-2">{tenant._count.sales}</td>
                  <td className="py-2">
                    <form action={toggleTenantStatusAction}>
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <input type="hidden" name="nextState" value={tenant.isActive ? "false" : "true"} />
                      <SmallButton label={tenant.isActive ? "Desactivar" : "Activar"} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

