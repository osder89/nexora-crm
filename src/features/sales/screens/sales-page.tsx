import Link from "next/link";

import { SaleStatus, SaleType } from "@prisma/client";

import { SaleCreateModalButton } from "@/features/sales/components/sale-create-modal";
import type { AppShellProps } from "@/services/layouts/app-shell";
import type { SaleCustomerOption, SaleListItem, SaleProductOption, SellerOption } from "@/services/server/sales.service";
import { Card, PageTitle } from "@/shared/components/ui";
import { getCustomerFullName } from "@/shared/lib/customers";
import { getSaleStatusBadgeClass, getSaleStatusLabel, getSaleTypeLabel } from "@/shared/lib/labels";
import { formatCurrency, formatDate } from "@/shared/lib/utils";

type SaleStatusFilter = SaleStatus | "all";
type SaleTypeFilter = SaleType | "all";

type SalesPageProps = {
  q: string;
  status: SaleStatusFilter;
  saleType: SaleTypeFilter;
  sellerId: string;
  page: number;
  sales: SaleListItem[];
  customers: SaleCustomerOption[];
  products: SaleProductOption[];
  sellers: SellerOption[];
  appShell?: AppShellProps;
};

const PAGE_SIZE = 10;

export default function SalesPage({ q, status, saleType, sellerId, page, sales: allSales, customers, products, sellers, appShell }: SalesPageProps) {
  const sales = allSales.filter((sale) => {
    const matchesStatus = status === "all" ? true : sale.status === status;
    const matchesSaleType = saleType === "all" ? true : sale.saleType === saleType;
    const matchesSeller = sellerId ? sale.seller?.id === sellerId : true;
    const customerLabel = sale.customer ? getCustomerFullName(sale.customer) : "Consumidor final";
    const saleIdLabel = sale.id.toLowerCase();
    const sellerLabel = sale.seller?.email?.toLowerCase() ?? "";
    const customerNit = (sale.customer && "nit" in sale.customer ? (sale.customer as { nit?: string | null }).nit ?? "" : "").toLowerCase();
    const matchesQuery = !q || saleIdLabel.includes(q) || customerLabel.toLowerCase().includes(q) || sellerLabel.includes(q) || customerNit.includes(q);

    return matchesStatus && matchesSaleType && matchesSeller && matchesQuery;
  });

  const totalSales = sales.length;
  const totalPages = Math.max(1, Math.ceil(totalSales / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;
  const pageRows = sales.slice(skip, skip + PAGE_SIZE);
  const productOptions = products
    .filter((product) => product.isActive)
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      stock: product.stock,
    }));
  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    firstName: customer.firstName,
    lastName: customer.lastName,
  }));
  const pageStart = totalSales === 0 ? 0 : skip + 1;
  const pageEnd = totalSales === 0 ? 0 : Math.min(skip + PAGE_SIZE, totalSales);
  const companyName = appShell?.kind === "tenant" ? appShell.tenantName : "Nexora CRM";

  return (
    <div className="space-y-6">
      <PageTitle title="Ventas" subtitle="Listado principal con filtros y registro desde modal (contado o credito)." />

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form className="grid w-full gap-3 md:max-w-5xl md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Buscar</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="ID, cliente o vendedor"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
              <select name="status" defaultValue={status} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                <option value="all">Todos</option>
                <option value={SaleStatus.PAID}>{getSaleStatusLabel(SaleStatus.PAID)}</option>
                <option value={SaleStatus.PENDING}>{getSaleStatusLabel(SaleStatus.PENDING)}</option>
                <option value={SaleStatus.OVERDUE}>{getSaleStatusLabel(SaleStatus.OVERDUE)}</option>
                <option value={SaleStatus.CANCELED}>{getSaleStatusLabel(SaleStatus.CANCELED)}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
              <select name="saleType" defaultValue={saleType} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                <option value="all">Todos</option>
                <option value={SaleType.CONTADO}>{getSaleTypeLabel(SaleType.CONTADO)}</option>
                <option value={SaleType.CREDITO}>{getSaleTypeLabel(SaleType.CREDITO)}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vendedor</label>
              <select name="sellerId" defaultValue={sellerId} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
                <option value="">Todos</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Filtrar
              </button>
              <Link href="/app/sales" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                Limpiar
              </Link>
            </div>
          </form>

          <SaleCreateModalButton customers={customerOptions} products={productOptions} companyName={companyName} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Mostrando {pageStart}-{pageEnd} de {totalSales} ventas
          </p>
          <p>
            Pagina {currentPage} / {totalPages}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Vendedor</th>
                <th className="py-2 pr-3">Items</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Saldo</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Vence</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((sale) => {
                const planLabel =
                  sale.saleType === "CREDITO"
                    ? `${sale.installmentCount ?? sale.installments.length} cuotas / ${sale.installmentFrequencyDays ?? "-"} dias`
                    : "No aplica";

                return (
                  <tr key={sale.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{sale.id.slice(-8).toUpperCase()}</td>
                    <td className="py-2 pr-3">{formatDate(sale.createdAt)}</td>
                    <td className="py-2 pr-3">{getSaleTypeLabel(sale.saleType)}</td>
                    <td className="py-2 pr-3">{sale.customer ? getCustomerFullName(sale.customer) : "Consumidor final"}</td>
                    <td className="py-2 pr-3">{sale.seller.email}</td>
                    <td className="py-2 pr-3">{sale.items.length}</td>
                    <td className="py-2 pr-3 text-xs">{planLabel}</td>
                    <td className="py-2 pr-3">{formatCurrency(Number(sale.total))}</td>
                    <td className="py-2 pr-3">{formatCurrency(Number(sale.balance))}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getSaleStatusBadgeClass(sale.status)}`}>
                        {getSaleStatusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{formatDate(sale.dueDate)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/app/sales/${sale.id}`}
                          className="rounded-md bg-cyan-100 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-200"
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-5 text-center text-sm text-slate-500">
                    No hay ventas para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <PaginationLink
            disabled={currentPage <= 1}
            href={buildSalesUrl({ q, status, saleType, sellerId, page: currentPage - 1 })}
            label="Anterior"
          />
          <PaginationLink
            disabled={currentPage >= totalPages}
            href={buildSalesUrl({ q, status, saleType, sellerId, page: currentPage + 1 })}
            label="Siguiente"
          />
        </div>
      </Card>
    </div>
  );
}

function buildSalesUrl({ q, status, saleType, sellerId, page }: { q: string; status: SaleStatusFilter; saleType: SaleTypeFilter; sellerId: string; page: number }) {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  if (saleType !== "all") {
    params.set("saleType", saleType);
  }
  if (sellerId) {
    params.set("sellerId", sellerId);
  }
  params.set("page", String(page));

  const query = params.toString();
  return query ? `/app/sales?${query}` : "/app/sales";
}

function PaginationLink({ href, label, disabled }: { href: string; label: string; disabled: boolean }) {
  if (disabled) {
    return <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400">{label}</span>;
  }

  return (
    <Link href={href} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
      {label}
    </Link>
  );
}
