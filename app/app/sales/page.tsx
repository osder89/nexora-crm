import Link from "next/link";

import { Prisma, SaleStatus, SaleType } from "@prisma/client";

import { SaleCreateModalButton } from "@/components/sales/sale-create-modal";
import { Card, PageTitle } from "@/components/ui";
import { getCustomerFullName } from "@/lib/customers";
import { getSaleStatusBadgeClass, getSaleStatusLabel, getSaleTypeLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

type SearchParams = {
  q?: string;
  status?: string;
  saleType?: string;
  sellerId?: string;
  page?: string;
};

const PAGE_SIZE = 10;

export default async function SalesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireTenantUser();
  const query = await searchParams;

  const q = (query.q ?? "").trim();
  const status =
    query.status === "PAID" || query.status === "PENDING" || query.status === "OVERDUE" || query.status === "CANCELED" ? query.status : "all";
  const saleType = query.saleType === SaleType.CONTADO || query.saleType === SaleType.CREDITO ? query.saleType : "all";
  const sellerId = (query.sellerId ?? "").trim();
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const where: Prisma.SaleWhereInput = {
    tenantId: user.tenantId,
    deletedAt: null,
    ...(status !== "all" ? { status: status as SaleStatus } : {}),
    ...(saleType !== "all" ? { saleType } : {}),
    ...(sellerId ? { sellerId } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            {
              customer: {
                is: {
                  OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                    { nit: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              seller: {
                is: {
                  email: { contains: q, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [customers, products, sellers, totalSales] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId: user.tenantId, isActive: true, deletedAt: null },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, name: true, firstName: true, lastName: true },
    }),
    prisma.product.findMany({
      where: { tenantId: user.tenantId, isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, price: true, stock: true },
    }),
    prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        role: { in: ["ADMIN_EMPRESA", "VENDEDOR"] },
      },
      orderBy: { email: "asc" },
      select: { id: true, email: true },
    }),
    prisma.sale.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalSales / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const sales = await prisma.sale.findMany({
    where,
    select: {
      id: true,
      createdAt: true,
      saleType: true,
      installmentCount: true,
      installmentFrequencyDays: true,
      total: true,
      balance: true,
      status: true,
      dueDate: true,
      customer: { select: { name: true, firstName: true, lastName: true } },
      seller: { select: { email: true } },
      _count: {
        select: {
          items: true,
          installments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
  });

  const productOptions = products.map((product) => ({
    ...product,
    price: Number(product.price),
  }));
  const pageStart = totalSales === 0 ? 0 : skip + 1;
  const pageEnd = totalSales === 0 ? 0 : Math.min(skip + PAGE_SIZE, totalSales);

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

          <SaleCreateModalButton customers={customers} products={productOptions} />
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
              {sales.map((sale) => {
                const planLabel =
                  sale.saleType === "CREDITO"
                    ? `${sale.installmentCount ?? sale._count.installments} cuotas / ${sale.installmentFrequencyDays ?? "-"} dias`
                    : "No aplica";

                return (
                  <tr key={sale.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{sale.id.slice(-8).toUpperCase()}</td>
                    <td className="py-2 pr-3">{formatDate(sale.createdAt)}</td>
                    <td className="py-2 pr-3">{getSaleTypeLabel(sale.saleType)}</td>
                    <td className="py-2 pr-3">{sale.customer ? getCustomerFullName(sale.customer) : "Consumidor final"}</td>
                    <td className="py-2 pr-3">{sale.seller.email}</td>
                    <td className="py-2 pr-3">{sale._count.items}</td>
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

              {sales.length === 0 ? (
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

function buildSalesUrl({
  q,
  status,
  saleType,
  sellerId,
  page,
}: {
  q: string;
  status: string;
  saleType: string;
  sellerId: string;
  page: number;
}) {
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

