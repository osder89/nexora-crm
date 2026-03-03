import { redirect } from "next/navigation";

import { TenantShell, type TenantNavItem } from "@/components/tenant-shell";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user || !user.tenantId || (user.role !== "ADMIN_EMPRESA" && user.role !== "VENDEDOR")) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { name: true, isActive: true },
  });

  if (!tenant?.isActive) {
    redirect("/login");
  }

  const links: TenantNavItem[] = [
    { href: "/app/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/app/customers", label: "Clientes", icon: "customers" },
    { href: "/app/products", label: "Productos", icon: "products" },
    {
      key: "purchases",
      label: "Compras",
      icon: "purchases",
      children: [
        { href: "/app/purchases/suppliers", label: "Proveedores", icon: "suppliers" },
        { href: "/app/purchases/orders", label: "Pedidos", icon: "purchase_orders" },
        { href: "/app/purchases/receipts", label: "Recepciones", icon: "receipts" },
      ],
    },
    { href: "/app/sales", label: "Ventas", icon: "sales" },
    { href: "/app/receivables", label: "Cobranzas", icon: "receivables" },
  ];

  if (user.role === "ADMIN_EMPRESA") {
    links.push({ href: "/app/users", label: "Usuarios", icon: "users" });
    links.push({ href: "/app/settings", label: "Settings", icon: "settings" });
  }

  return (
    <TenantShell tenantName={tenant.name} role={user.role} email={user.email} links={links}>
      {children}
    </TenantShell>
  );
}
