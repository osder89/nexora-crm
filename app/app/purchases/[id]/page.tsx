import Link from "next/link";
import { notFound } from "next/navigation";

import { PurchaseStatus, Role } from "@prisma/client";

import { Card, Label, SubmitButton, Textarea } from "@/components/ui";
import { cancelPurchaseAction, receivePurchaseAction } from "@/lib/actions/purchases";
import { getPurchaseStatusBadgeClass, getPurchaseStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireTenantUser();
  const { id } = await params;

  const purchase = await prisma.purchase.findUnique({
    where: {
      id_tenantId: {
        id,
        tenantId: user.tenantId,
      },
    },
    include: {
      supplier: {
        select: {
          name: true,
          nit: true,
          phone: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
      items: {
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!purchase || purchase.deletedAt) {
    notFound();
  }

  const isAdmin = user.role === Role.ADMIN_EMPRESA;
  const canReceive = isAdmin && purchase.status === PurchaseStatus.ORDERED;
  const canCancel = isAdmin && purchase.status === PurchaseStatus.ORDERED;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/purchases/orders" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
          {"<- "}Volver a compras
        </Link>
      </div>

      <Card>
        <h1 className="text-2xl font-semibold text-slate-900">Compra {purchase.id.slice(-8).toUpperCase()}</h1>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
          <p>
            <span className="text-slate-500">Proveedor:</span> {purchase.supplier?.name ?? "-"}
          </p>
          <p>
            <span className="text-slate-500">Pedido:</span> {formatDate(purchase.orderedAt)}
          </p>
          <p>
            <span className="text-slate-500">Esperada:</span> {formatDate(purchase.expectedAt)}
          </p>
          <p>
            <span className="text-slate-500">Recibida:</span> {formatDate(purchase.receivedAt)}
          </p>
          <p>
            <span className="text-slate-500">Total:</span> {formatCurrency(Number(purchase.total))}
          </p>
          <p>
            <span className="text-slate-500">Registrado por:</span> {purchase.createdBy?.email ?? "-"}
          </p>
          <p>
            <span className="text-slate-500">Estado:</span>{" "}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getPurchaseStatusBadgeClass(purchase.status)}`}>
              {getPurchaseStatusLabel(purchase.status)}
            </span>
          </p>
          <p className="md:col-span-2">
            <span className="text-slate-500">Notas:</span> {purchase.notes ?? "-"}
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Items de compra</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Producto</th>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Cantidad</th>
                <th className="py-2 pr-3">Costo unitario</th>
                <th className="py-2 pr-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">{item.product.name}</td>
                  <td className="py-2 pr-3">{item.product.sku ?? "-"}</td>
                  <td className="py-2 pr-3">{item.quantity}</td>
                  <td className="py-2 pr-3">{formatCurrency(Number(item.unitCost))}</td>
                  <td className="py-2 pr-3">{formatCurrency(Number(item.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isAdmin ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Recepcion de compra</h2>
            {canReceive ? (
              <form action={receivePurchaseAction} className="space-y-3">
                <input type="hidden" name="purchaseId" value={purchase.id} />
                <p className="text-sm text-slate-600">Este paso ingresa stock y registra movimientos de inventario IN por cada item.</p>
                <SubmitButton label="Marcar como recibida" />
              </form>
            ) : (
              <p className="text-sm text-slate-600">Solo las compras en estado pedida pueden recibirse.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Cancelar compra</h2>
            {canCancel ? (
              <form action={cancelPurchaseAction} className="space-y-3">
                <input type="hidden" name="purchaseId" value={purchase.id} />
                <div>
                  <Label>Motivo de cancelacion</Label>
                  <Textarea name="cancelReason" rows={2} placeholder="Proveedor sin stock, error de pedido, etc." />
                </div>
                <button type="submit" className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
                  Cancelar compra
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-600">Solo las compras en estado pedida pueden cancelarse.</p>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
