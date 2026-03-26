import type { Role } from "@prisma/client";

import type { TenantNavItem } from "@/shared/components/tenant-shell";

export type TenantRole = Extract<Role, "ADMIN_EMPRESA" | "VENDEDOR">;

export type TenantShellProps = {
  kind: "tenant";
  tenantName: string;
  role: TenantRole;
  email: string;
  links: TenantNavItem[];
};

export type SuperShellProps = {
  kind: "super";
  email: string;
};

export type AppShellProps = TenantShellProps | SuperShellProps | null;

export function buildTenantShellProps(params: {
  tenantName: string;
  email: string;
  role: TenantRole;
}): TenantShellProps {
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

  if (params.role === "ADMIN_EMPRESA") {
    links.push({ href: "/app/users", label: "Usuarios", icon: "users" });
    links.push({ href: "/app/settings", label: "Settings", icon: "settings" });
  }

  return {
    kind: "tenant",
    tenantName: params.tenantName,
    role: params.role,
    email: params.email,
    links,
  };
}

export function buildSuperShellProps(email: string): SuperShellProps {
  return {
    kind: "super",
    email,
  };
}
