import type { GetServerSidePropsContext } from "next";

import { SaleStatus } from "@prisma/client";

import { getReceivablesDataServer } from "@/services/server/receivables.service";
import { getSalesDataServer } from "@/services/server/sales.service";
import { getTenantUsersServer } from "@/services/server/users.service";
import { getCustomerFullName } from "@/shared/lib/customers";

export async function getDashboardDataServer(
  context: GetServerSidePropsContext,
  params: { from?: string; to?: string; sellerId?: string },
) {
  const [users, salesResponse, receivablesResponse] = await Promise.all([
    getTenantUsersServer(context),
    getSalesDataServer(context),
    getReceivablesDataServer(context),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const fromDate = params.from ? new Date(`${params.from}T00:00:00`) : monthStart;
  const toDate = params.to ? new Date(`${params.to}T23:59:59`) : monthEnd;
  const sellerId = params.sellerId?.trim() || undefined;

  const sellers = users
    .filter((user) => user.isActive && (user.role === "ADMIN_EMPRESA" || user.role === "VENDEDOR"))
    .sort((left, right) => left.email.localeCompare(right.email));

  const salesInRange = salesResponse.sales.filter((sale) => {
    const createdAt = new Date(sale.createdAt);
    const matchesDateRange = createdAt >= fromDate && createdAt <= toDate;
    const matchesSeller = sellerId ? sale.seller?.id === sellerId : true;

    return matchesDateRange && matchesSeller;
  });

  const receivables = receivablesResponse.sales.filter((sale) => sale.status === SaleStatus.PENDING || sale.status === SaleStatus.OVERDUE);

  const salesTotal = salesInRange.reduce((sum, sale) => sum + Number(sale.total), 0);
  const pendingCount = receivables.filter((sale) => sale.status === SaleStatus.PENDING).length;
  const overdueCount = receivables.filter((sale) => sale.status === SaleStatus.OVERDUE).length;

  const customerTotals = new Map<string, number>();
  for (const sale of salesInRange) {
    const name = sale.customer ? getCustomerFullName(sale.customer) : "Consumidor final";
    customerTotals.set(name, (customerTotals.get(name) ?? 0) + Number(sale.total));
  }

  const topCustomers = Array.from(customerTotals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);

  const productStats = new Map<string, { quantity: number; amount: number }>();
  for (const sale of salesInRange) {
    for (const item of sale.items) {
      const current = productStats.get(item.product.name) ?? { quantity: 0, amount: 0 };
      current.quantity += item.quantity;
      current.amount += Number(item.subtotal);
      productStats.set(item.product.name, current);
    }
  }

  const topProducts = Array.from(productStats.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5);

  return {
    sellers,
    salesTotal,
    pendingCount,
    overdueCount,
    topCustomers,
    topProducts,
  };
}

