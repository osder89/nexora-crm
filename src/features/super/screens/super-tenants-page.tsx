import { CreateTenantAdminForm } from "@/features/super/components/create-tenant-admin-form";
import { CreateTenantForm } from "@/features/super/components/create-tenant-form";
import { TenantStatusToggleButton } from "@/features/super/components/tenant-status-toggle-button";
import type { SuperTenant } from "@/services/server/super.service";
import { Card, PageTitle } from "@/shared/components/ui";

type SuperTenantsPageProps = {
  tenants: SuperTenant[];
};

export default function SuperTenantsPage({ tenants }: SuperTenantsPageProps) {
  const admins = tenants.flatMap((tenant) => tenant.users.map((user) => ({ ...user, tenantName: tenant.name })));

  return (
    <div className="space-y-6">
      <PageTitle title="Tenants" subtitle="Gestiona empresas, estado y usuarios ADMIN_EMPRESA." />

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear tenant</h2>
        <CreateTenantForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear ADMIN_EMPRESA</h2>
        <CreateTenantAdminForm tenants={tenants} />

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
                  <td className="py-2">{admin.tenantName}</td>
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
                <th className="py-2">Accion</th>
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
                    <TenantStatusToggleButton tenantId={tenant.id} isActive={tenant.isActive} />
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

