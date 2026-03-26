import { Card, Input, Label, PageTitle, Select, SubmitButton } from "@/shared/components/ui";
import { formatCurrency } from "@/shared/lib/utils";

type DashboardSeller = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
};

type DashboardPageProps = {
  from: string;
  to: string;
  sellerId: string;
  sellers: DashboardSeller[];
  salesTotal: number;
  pendingCount: number;
  overdueCount: number;
  topCustomers: Array<{ name: string; amount: number }>;
  topProducts: Array<{ name: string; quantity: number; amount: number }>;
};

export default function DashboardPage({
  from,
  to,
  sellerId,
  sellers,
  salesTotal,
  pendingCount,
  overdueCount,
  topCustomers,
  topProducts,
}: DashboardPageProps) {
  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" subtitle="KPIs por rango de fechas y vendedor." />

      <Card>
        <form className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>Desde</Label>
            <Input type="date" name="from" defaultValue={from} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" name="to" defaultValue={to} />
          </div>
          <div>
            <Label>Vendedor</Label>
            <Select name="sellerId" defaultValue={sellerId}>
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
          <h2 className="mb-3 text-lg font-semibold">Productos mas vendidos</h2>
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

