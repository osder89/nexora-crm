import { Role, SaleStatus } from "@prisma/client";

import { Card, Input, Label, PageTitle, Select, SubmitButton } from "@/components/ui";
import { getCustomerFullName } from "@/lib/customers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

type SearchParams = {
  from?: string;
  to?: string;
  sellerId?: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireTenantUser();
  const query = await searchParams;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const fromDate = query.from ? new Date(`${query.from}T00:00:00`) : monthStart;
  const toDate = query.to ? new Date(`${query.to}T23:59:59`) : monthEnd;
  const sellerFilter = query.sellerId?.trim() || undefined;

  const [sellers, salesInRange, receivables] = await Promise.all([
    prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        role: { in: [Role.ADMIN_EMPRESA, Role.VENDEDOR] },
      },
      orderBy: { email: "asc" },
      select: { id: true, email: true },
    }),
    prisma.sale.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
        ...(sellerFilter ? { sellerId: sellerFilter } : {}),
      },
      include: {
        customer: { select: { name: true } },
        items: {
          where: { tenantId: user.tenantId },
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: [SaleStatus.PENDING, SaleStatus.OVERDUE] },
      },
      select: { id: true, status: true, balance: true },
    }),
  ]);

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
    .sort((a, b) => b.amount - a.amount)
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
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" subtitle="KPIs por rango de fechas y vendedor." />

      <Card>
        <form className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>Desde</Label>
            <Input type="date" name="from" defaultValue={query.from ?? ""} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" name="to" defaultValue={query.to ?? ""} />
          </div>
          <div>
            <Label>Vendedor</Label>
            <Select name="sellerId" defaultValue={sellerFilter ?? ""}>
              <option value="">Todos</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.email}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <SubmitButton label="Filtrar" />
          </div>
        </form>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Ventas del rango</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(salesTotal)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pendientes</p>
          <p className="mt-1 text-2xl font-semibold">{pendingCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Vencidas</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{overdueCount}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Top clientes</h2>
          <div className="space-y-2 text-sm">
            {topCustomers.map((customer) => (
              <div key={customer.name} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span>{customer.name}</span>
                <strong>{formatCurrency(customer.amount)}</strong>
              </div>
            ))}
            {topCustomers.length === 0 ? <p className="text-slate-500">Sin ventas en el rango.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Productos más vendidos</h2>
          <div className="space-y-2 text-sm">
            {topProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span>{product.name}</span>
                <span>
                  {product.quantity} uds · {formatCurrency(product.amount)}
                </span>
              </div>
            ))}
            {topProducts.length === 0 ? <p className="text-slate-500">Sin items vendidos en el rango.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

