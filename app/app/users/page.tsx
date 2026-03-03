import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { Card, Input, Label, PageTitle, SmallButton, SubmitButton } from "@/components/ui";
import { createVendorAction, toggleTenantUserStatusAction } from "@/lib/actions/users";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function UsersPage() {
  const user = await getSessionUser();

  if (!user || !user.tenantId || user.role !== Role.ADMIN_EMPRESA) {
    redirect("/app/dashboard");
  }

  const [tenantUsers, tenantAdmins] = await Promise.all([
    prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        role: Role.VENDEDOR,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        role: Role.ADMIN_EMPRESA,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, isActive: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle title="Usuarios" subtitle="Solo ADMIN_EMPRESA puede crear y activar/desactivar vendedores." />

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Crear vendedor</h2>
        <form action={createVendorAction} className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Email *</Label>
            <Input type="email" name="email" required />
          </div>
          <div>
            <Label>Password inicial *</Label>
            <Input type="text" name="password" required minLength={6} />
          </div>
          <div className="flex items-end">
            <SubmitButton label="Crear vendedor" />
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Admins de la empresa</h2>
        <ul className="space-y-2 text-sm">
          {tenantAdmins.map((admin) => (
            <li key={admin.id} className="rounded-md border border-slate-200 px-3 py-2">
              {admin.email} · {admin.isActive ? "Activo" : "Inactivo"}
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
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {tenantUsers.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2">{item.email}</td>
                  <td className="py-2">{item.isActive ? "Activo" : "Inactivo"}</td>
                  <td className="py-2">
                    <form action={toggleTenantUserStatusAction}>
                      <input type="hidden" name="userId" value={item.id} />
                      <input type="hidden" name="nextState" value={item.isActive ? "false" : "true"} />
                      <SmallButton label={item.isActive ? "Desactivar" : "Activar"} />
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
