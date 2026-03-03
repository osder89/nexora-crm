import Link from "next/link";

import { Prisma, PurchaseStatus, Role } from "@prisma/client";

import { Card, PageTitle } from "@/components/ui";
import { receivePurchaseAction } from "@/lib/actions/purchases";
import { getPurchaseStatusBadgeClass, getPurchaseStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

type SearchParams = {
  q?: string;
  status?: string;
  supplierId?: string;
  page?: string;
};

const PAGE_SIZE = 12;

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireTenantUser();
  const query = await searchParams;

  const q = (query.q ?? "").trim();
  const status = query.status === PurchaseStatus.ORDERED || query.status === PurchaseStatus.RECEIVED ? query.status : "all";
  const supplierId = (query.supplierId ?? "").trim();
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const isAdmin = user.role === Role.ADMIN_EMPRESA;

  const suppliers = await prisma.supplier.findMany({
    where: {
      tenantId: user.tenantId,
      deletedAt: null,
      isActive: true,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  const where: Prisma.PurchaseWhereInput = {
    tenantId: user.tenantId,
    deletedAt: null,
    status: status !== "all" ? status : { in: [PurchaseStatus.ORDERED, PurchaseStatus.RECEIVED] },
    ...(supplierId ? { supplierId } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { supplier: { is: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const totalReceipts = await prisma.purchase.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalReceipts / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const purchases = await prisma.purchase.findMany({
    where,
    select: {
      id: true,
      status: true,
      total: true,
      orderedAt: true,
      expectedAt: true,
      receivedAt: true,
      supplier: { select: { name: true } },
      createdBy: { select: { email: true } },
      _count: { select: { items: true } },
    },
    orderBy: [{ expectedAt: "asc" }, { createdAt: "desc" }],
    skip,
    take: PAGE_SIZE,
  });

  const orderedCount = await prisma.purchase.count({
    where: {
      tenantId: user.tenantId,
      deletedAt: null,
      status: PurchaseStatus.ORDERED,
    },
  });

  const receivedCount = await prisma.purchase.count({
    where: {
      tenantId: user.tenantId,
      deletedAt: null,
      status: PurchaseStatus.RECEIVED,
    },
  });

  const pageStart = totalReceipts === 0 ? 0 : skip + 1;
  const pageEnd = totalReceipts === 0 ? 0 : Math.min(skip + PAGE_SIZE, totalReceipts);

  return (
    <div className="space-y-6">
      <PageTitle title="Recibimiento de mercancia" subtitle="Control de compras pedidas y recepcion de stock al inventario." />

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">Pendientes de recepcion</p>
          <p className="mt-1 text-2xl font-semibold text-cyan-800">{orderedCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Compras recibidas</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{receivedCount}</p>
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
              placeholder="ID compra o proveedor"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
            <select name="status" defaultValue={status} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
              <option value="all">Todos</option>
              <option value={PurchaseStatus.ORDERED}>{getPurchaseStatusLabel(PurchaseStatus.ORDERED)}</option>
              <option value={PurchaseStatus.RECEIVED}>{getPurchaseStatusLabel(PurchaseStatus.RECEIVED)}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Proveedor</label>
            <select name="supplierId" defaultValue={supplierId} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
              <option value="">Todos</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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
            <Link href="/app/purchases/receipts" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              Limpiar
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Mostrando {pageStart}-{pageEnd} de {totalReceipts} registros
          </p>
          <p>
            Pagina {currentPage} / {totalPages}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Compra</th>
                <th className="py-2 pr-3">Proveedor</th>
                <th className="py-2 pr-3">Pedido</th>
                <th className="py-2 pr-3">Esperada</th>
                <th className="py-2 pr-3">Recibida</th>
                <th className="py-2 pr-3">Items</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">{purchase.id.slice(-8).toUpperCase()}</td>
                  <td className="py-2 pr-3">{purchase.supplier?.name ?? "-"}</td>
                  <td className="py-2 pr-3">{formatDate(purchase.orderedAt)}</td>
                  <td className="py-2 pr-3">{formatDate(purchase.expectedAt)}</td>
                  <td className="py-2 pr-3">{formatDate(purchase.receivedAt)}</td>
                  <td className="py-2 pr-3">{purchase._count.items}</td>
                  <td className="py-2 pr-3">{formatCurrency(Number(purchase.total))}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getPurchaseStatusBadgeClass(purchase.status)}`}>
                      {getPurchaseStatusLabel(purchase.status)}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end gap-2">
                      {isAdmin && purchase.status === PurchaseStatus.ORDERED ? (
                        <form action={receivePurchaseAction}>
                          <input type="hidden" name="purchaseId" value={purchase.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                          >
                            Recibir
                          </button>
                        </form>
                      ) : null}
                      <Link
                        href={`/app/purchases/${purchase.id}`}
                        className="rounded-md bg-cyan-100 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-200"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-5 text-center text-sm text-slate-500">
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <PaginationLink
            disabled={currentPage <= 1}
            href={buildReceiptsUrl({ q, status, supplierId, page: currentPage - 1 })}
            label="Anterior"
          />
          <PaginationLink
            disabled={currentPage >= totalPages}
            href={buildReceiptsUrl({ q, status, supplierId, page: currentPage + 1 })}
            label="Siguiente"
          />
        </div>
      </Card>
    </div>
  );
}

function buildReceiptsUrl({ q, status, supplierId, page }: { q: string; status: string; supplierId: string; page: number }) {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  if (supplierId) {
    params.set("supplierId", supplierId);
  }
  params.set("page", String(page));

  const query = params.toString();
  return query ? `/app/purchases/receipts?${query}` : "/app/purchases/receipts";
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
