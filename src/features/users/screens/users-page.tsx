import { Role } from "@prisma/client";

import { CreateVendorForm } from "@/features/users/components/create-vendor-form";
import { UserStatusToggleButton } from "@/features/users/components/user-status-toggle-button";
import type { TenantUser } from "@/services/server/users.service";
import { Card, PageTitle } from "@/shared/components/ui";

type UsersPageProps = {
  users: TenantUser[];
};

export default function UsersPage({ users }: UsersPageProps) {
  const tenantUsers = users.filter((item) => item.role === Role.VENDEDOR);
  const tenantAdmins = users.filter((item) => item.role === Role.ADMIN_EMPRESA);

  return (
    <div className="space-y-6">
      <PageTitle title="Usuarios" subtitle="Solo ADMIN_EMPRESA puede crear y activar/desactivar vendedores." />

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Crear vendedor</h2>
        <CreateVendorForm />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Admins de la empresa</h2>
        <ul className="space-y-2 text-sm">
          {tenantAdmins.map((admin) => (
            <li key={admin.id} className="rounded-md border border-slate-200 px-3 py-2">
              {admin.email} - {admin.isActive ? "Activo" : "Inactivo"}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Vendedores</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Email</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Accion</th>
              </tr>
            </thead>
            <tbody>
              {tenantUsers.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2">{item.email}</td>
                  <td className="py-2">{item.isActive ? "Activo" : "Inactivo"}</td>
                  <td className="py-2">
                    <UserStatusToggleButton userId={item.id} isActive={item.isActive} />
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

