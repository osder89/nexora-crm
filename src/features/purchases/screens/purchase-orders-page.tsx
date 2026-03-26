import Link from "next/link";

import { PurchaseStatus, Role } from "@prisma/client";

import { PurchaseCreateModalButton } from "@/features/purchases/components/purchase-create-modal";
import type { ProductListItem } from "@/services/server/products.service";
import type { PurchaseListItem, SupplierListItem } from "@/services/server/purchases.service";
import { Card, PageTitle } from "@/shared/components/ui";
import { getPurchaseStatusBadgeClass, getPurchaseStatusLabel } from "@/shared/lib/labels";
import { formatCurrency, formatDate } from "@/shared/lib/utils";

type PurchaseOrderStatusFilter = PurchaseStatus | "all";

type PurchaseOrdersPageProps = {
  q: string;
  status: PurchaseOrderStatusFilter;
  supplierId: string;
  page: number;
  totalPurchases: number;
  purchases: PurchaseListItem[];
  suppliers: SupplierListItem[];
  products: ProductListItem[];
  userRole: Role;
};

const PAGE_SIZE = 10;

export default function PurchaseOrdersPage({ q, status, supplierId, page, totalPurchases, purchases, suppliers, products, userRole }: PurchaseOrdersPageProps) {
  const totalPages = Math.max(1, Math.ceil(totalPurchases / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;
  const pageStart = totalPurchases === 0 ? 0 : skip + 1;
  const pageEnd = totalPurchases === 0 ? 0 : Math.min(skip + PAGE_SIZE, totalPurchases);
  const isAdmin = userRole === Role.ADMIN_EMPRESA;

  return (
    <div className="space-y-6">
      <PageTitle title="Pedidos de compra" subtitle="Registro y control de pedidos a proveedores." />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
        <p className="text-sm text-slate-600">Listado principal de pedidos de compra.</p>
        {isAdmin ? (
          <PurchaseCreateModalButton
            suppliers={suppliers.filter((supplier) => supplier.isActive).map((supplier) => ({ id: supplier.id, name: supplier.name }))}
            products={products.filter((product) => product.isActive).map((product) => ({ id: product.id, name: product.name }))}
          />
        ) : (
          <p className="text-xs text-slate-500">Solo ADMIN_EMPRESA puede registrar nuevos pedidos de compra.</p>
        )}
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
              <option value={PurchaseStatus.CANCELED}>{getPurchaseStatusLabel(PurchaseStatus.CANCELED)}</option>
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
            <Link href="/app/purchases/orders" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              Limpiar
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Mostrando {pageStart}-{pageEnd} de {totalPurchases} pedidos
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
                  <td className="py-2 pr-3">{purchase.items.length}</td>
                  <td className="py-2 pr-3">{formatCurrency(Number(purchase.total))}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getPurchaseStatusBadgeClass(purchase.status)}`}>
                      {getPurchaseStatusLabel(purchase.status)}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
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
                    No hay pedidos para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <PaginationLink
            disabled={currentPage <= 1}
            href={buildOrdersUrl({ q, status, supplierId, page: currentPage - 1 })}
            label="Anterior"
          />
          <PaginationLink
            disabled={currentPage >= totalPages}
            href={buildOrdersUrl({ q, status, supplierId, page: currentPage + 1 })}
            label="Siguiente"
          />
        </div>
      </Card>
    </div>
  );
}

function buildOrdersUrl({ q, status, supplierId, page }: { q: string; status: PurchaseOrderStatusFilter; supplierId: string; page: number }) {
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
  return query ? `/app/purchases/orders?${query}` : "/app/purchases/orders";
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

