import Link from "next/link";

import { InstallmentStatus, Prisma, SaleStatus } from "@prisma/client";

import { CollectPaymentModalButton } from "@/components/receivables/collect-payment-modal-button";
import { Card, PageTitle } from "@/components/ui";
import { getCustomerFullName } from "@/lib/customers";
import {
  getInstallmentStatusBadgeClass,
  getInstallmentStatusLabel,
  getSaleStatusBadgeClass,
  getSaleStatusLabel,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";
import { formatCurrency, formatDate, startOfDay } from "@/lib/utils";

type SearchParams = {
  q?: string;
  segment?: string;
  sellerId?: string;
  page?: string;
};

const PAGE_SIZE = 12;

export default async function ReceivablesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireTenantUser();
  const query = await searchParams;

  const q = (query.q ?? "").trim();
  const segment = query.segment === "overdue" || query.segment === "upcoming" || query.segment === "pending" ? query.segment : "all";
  const sellerId = (query.sellerId ?? "").trim();
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const today = startOfDay();
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const where: Prisma.SaleWhereInput = {
    tenantId: user.tenantId,
    deletedAt: null,
    status: { in: [SaleStatus.PENDING, SaleStatus.OVERDUE] },
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
                    { phone: { contains: q, mode: "insensitive" } },
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

  const [receivables, sellers] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { name: true, firstName: true, lastName: true } },
        seller: { select: { email: true } },
        installments: {
          where: {
            tenantId: user.tenantId,
            status: { in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE] },
          },
          orderBy: { dueDate: "asc" },
          take: 1,
        },
        collectionLogs: {
          where: { tenantId: user.tenantId },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
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
  ]);

  const dueData = receivables
    .map((sale) => {
      const nextInstallment = sale.installments[0] ?? null;
      const nextDueDate = nextInstallment?.dueDate ?? sale.dueDate;
      const nextAmount = nextInstallment ? Number(nextInstallment.amount) - Number(nextInstallment.paidAmount) : Number(sale.balance);
      const nextStatus = (nextInstallment?.status ?? sale.status) as InstallmentStatus | SaleStatus;

      return {
        sale,
        nextDueDate,
        nextAmount: Math.max(nextAmount, 0),
        nextStatus,
      };
    })
    .sort((left, right) => getSortableDate(left.nextDueDate) - getSortableDate(right.nextDueDate));

  const overdueCount = dueData.filter((entry) => entry.nextDueDate && entry.nextDueDate < today).length;
  const dueSoonCount = dueData.filter((entry) => entry.nextDueDate && entry.nextDueDate >= today && entry.nextDueDate <= weekAhead).length;
  const pendingCount = dueData.filter((entry) => entry.nextStatus === "PENDING").length;

  const filteredData = dueData.filter((entry) => {
    if (segment === "overdue") {
      return Boolean(entry.nextDueDate && entry.nextDueDate < today);
    }

    if (segment === "upcoming") {
      return Boolean(entry.nextDueDate && entry.nextDueDate >= today && entry.nextDueDate <= weekAhead);
    }

    if (segment === "pending") {
      return entry.nextStatus === "PENDING";
    }

    return true;
  });

  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredData.slice(skip, skip + PAGE_SIZE);

  const pageStart = totalRows === 0 ? 0 : skip + 1;
  const pageEnd = totalRows === 0 ? 0 : Math.min(skip + PAGE_SIZE, totalRows);

  return (
    <div className="space-y-6">
      <PageTitle title="Cuentas por cobrar" subtitle="Lista de cobranzas ordenada por pago mas proximo y accion directa de cobro." />

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Pendientes</p>
          <p className="mt-1 text-2xl font-semibold">{pendingCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Proximas 7 dias</p>
          <p className="mt-1 text-2xl font-semibold">{dueSoonCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Vencidas</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{overdueCount}</p>
        </Card>
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Venta, cliente, telefono o vendedor"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Segmento</label>
            <select name="segment" defaultValue={segment} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="upcoming">Proximos 7 dias</option>
              <option value="overdue">Vencidas</option>
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
            <Link href="/app/receivables" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              Limpiar
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Mostrando {pageStart}-{pageEnd} de {totalRows} cobranzas
          </p>
          <p>
            Pagina {currentPage} / {totalPages}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Venta</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Vendedor</th>
                <th className="py-2 pr-3">Proximo pago</th>
                <th className="py-2 pr-3">Monto cuota</th>
                <th className="py-2 pr-3">Deuda total</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Ultimo seguimiento</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ sale, nextDueDate, nextAmount, nextStatus }) => {
                const customerLabel = sale.customer ? getCustomerFullName(sale.customer) : "Consumidor final";
                const saleBalance = Number(sale.balance);

                return (
                  <tr key={sale.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3 font-medium">
                      <Link href={`/app/sales/${sale.id}`} className="underline">
                        {sale.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{customerLabel}</td>
                    <td className="py-2 pr-3">{sale.seller.email}</td>
                    <td className="py-2 pr-3">{formatDate(nextDueDate)}</td>
                    <td className="py-2 pr-3">{formatCurrency(nextAmount)}</td>
                    <td className="py-2 pr-3 font-medium">{formatCurrency(saleBalance)}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getReceivableStatusBadgeClass(nextStatus)}`}>
                        {getReceivableStatusLabel(nextStatus)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-600">{sale.collectionLogs[0]?.comment ?? "Sin seguimiento"}</td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        {saleBalance > 0 ? (
                          <CollectPaymentModalButton
                            saleId={sale.id}
                            customerLabel={customerLabel}
                            nextAmount={nextAmount}
                            maxAmount={saleBalance}
                          />
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500">Sin deuda</span>
                        )}

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
                  <td colSpan={9} className="py-5 text-center text-sm text-slate-500">
                    No hay cuentas por cobrar para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <PaginationLink
            disabled={currentPage <= 1}
            href={buildReceivablesUrl({ q, segment, sellerId, page: currentPage - 1 })}
            label="Anterior"
          />
          <PaginationLink
            disabled={currentPage >= totalPages}
            href={buildReceivablesUrl({ q, segment, sellerId, page: currentPage + 1 })}
            label="Siguiente"
          />
        </div>
      </Card>
    </div>
  );
}

function getSortableDate(value: Date | null) {
  return value ? value.getTime() : Number.MAX_SAFE_INTEGER;
}

function getReceivableStatusLabel(status: InstallmentStatus | SaleStatus) {
  if (status === InstallmentStatus.PAID || status === InstallmentStatus.PENDING || status === InstallmentStatus.OVERDUE) {
    return getInstallmentStatusLabel(status);
  }

  return getSaleStatusLabel(status);
}

function getReceivableStatusBadgeClass(status: InstallmentStatus | SaleStatus) {
  if (status === InstallmentStatus.PAID || status === InstallmentStatus.PENDING || status === InstallmentStatus.OVERDUE) {
    return getInstallmentStatusBadgeClass(status);
  }

  return getSaleStatusBadgeClass(status);
}

function buildReceivablesUrl({ q, segment, sellerId, page }: { q: string; segment: string; sellerId: string; page: number }) {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (segment !== "all") {
    params.set("segment", segment);
  }
  if (sellerId) {
    params.set("sellerId", sellerId);
  }
  params.set("page", String(page));

  const query = params.toString();
  return query ? `/app/receivables?${query}` : "/app/receivables";
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

