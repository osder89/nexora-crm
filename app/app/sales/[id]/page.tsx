import Link from "next/link";
import { notFound } from "next/navigation";

import { PaymentMethod, SaleStatus } from "@prisma/client";

import { Card, Input, Label, PageTitle, Select, SubmitButton, Textarea } from "@/components/ui";
import { createCollectionLogAction } from "@/lib/actions/receivables";
import { cancelSaleAction, createPaymentAction } from "@/lib/actions/sales";
import { getCustomerFullName } from "@/lib/customers";
import {
  getInstallmentStatusBadgeClass,
  getInstallmentStatusLabel,
  getPaymentMethodLabel,
  getSaleStatusBadgeClass,
  getSaleStatusLabel,
  getSaleTypeLabel,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireTenantUser();
  const { id } = await params;

  const sale = await prisma.sale.findUnique({
    where: {
      id_tenantId: {
        id,
        tenantId: user.tenantId,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      seller: {
        select: {
          email: true,
        },
      },
      items: {
        where: { tenantId: user.tenantId },
        include: {
          product: { select: { name: true } },
        },
      },
      installments: {
        where: { tenantId: user.tenantId },
        orderBy: { installmentNumber: "asc" },
      },
      payments: {
        where: { tenantId: user.tenantId, deletedAt: null },
        orderBy: { paidAt: "desc" },
      },
      collectionLogs: {
        where: { tenantId: user.tenantId },
        include: {
          createdBy: { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!sale || sale.deletedAt) {
    notFound();
  }

  const isCanceled = sale.status === SaleStatus.CANCELED;
  const isPaid = sale.status === SaleStatus.PAID || Number(sale.balance) <= 0;
  const hasPayments = sale.payments.length > 0;
  const canCancel = !isCanceled && !hasPayments && (sale.status === SaleStatus.PENDING || sale.status === SaleStatus.OVERDUE);
  const showCollectionActions = !isCanceled && !isPaid;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/sales" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
          {"<- "}Volver a ventas
        </Link>
      </div>

      <PageTitle title={`Venta ${sale.id.slice(-8).toUpperCase()}`} subtitle="Detalle de items, plan de cuotas, pagos parciales y seguimiento de cobranza." />

      <Card>
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <p>
            <span className="text-slate-500">Cliente:</span> {sale.customer ? getCustomerFullName(sale.customer) : "Consumidor final"}
          </p>
          <p>
            <span className="text-slate-500">Vendedor:</span> {sale.seller.email}
          </p>
          <p>
            <span className="text-slate-500">Tipo:</span> {getSaleTypeLabel(sale.saleType)}
          </p>
          <p>
            <span className="text-slate-500">Estado:</span>{" "}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getSaleStatusBadgeClass(sale.status)}`}>
              {getSaleStatusLabel(sale.status)}
            </span>
          </p>
          <p>
            <span className="text-slate-500">Vencimiento:</span> {formatDate(sale.dueDate)}
          </p>
          <p>
            <span className="text-slate-500">Total:</span> {formatCurrency(Number(sale.total))}
          </p>
          <p>
            <span className="text-slate-500">Saldo:</span> {formatCurrency(Number(sale.balance))}
          </p>
          <p className="md:col-span-2">
            <span className="text-slate-500">Notas:</span> {sale.notes ?? "-"}
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Cancelar venta</h2>

        {canCancel ? (
          <form action={cancelSaleAction} className="space-y-3">
            <input type="hidden" name="saleId" value={sale.id} />
            <div>
              <Label>Motivo de cancelacion</Label>
              <Textarea name="cancelReason" rows={2} placeholder="Error de registro, cliente desistio, etc." />
            </div>
            <button type="submit" className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
              Cancelar venta
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">
            {isCanceled
              ? "Esta venta ya esta cancelada."
              : hasPayments
                ? "No se puede cancelar porque la venta ya tiene pagos registrados."
                : "Solo se pueden cancelar ventas pendientes o vencidas."}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Producto</th>
                <th className="py-2">Cantidad</th>
                <th className="py-2">Precio unit.</th>
                <th className="py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2">{item.product.name}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{formatCurrency(Number(item.unitPrice))}</td>
                  <td className="py-2">{formatCurrency(Number(item.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {sale.saleType === "CREDITO" ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Plan de cuotas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2">#</th>
                  <th className="py-2">Vence</th>
                  <th className="py-2">Monto cuota</th>
                  <th className="py-2">Pagado</th>
                  <th className="py-2">Pendiente</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sale.installments.map((installment) => {
                  const pending = Number(installment.amount) - Number(installment.paidAmount);
                  return (
                    <tr key={installment.id} className="border-b border-slate-100">
                      <td className="py-2">{installment.installmentNumber}</td>
                      <td className="py-2">{formatDate(installment.dueDate)}</td>
                      <td className="py-2">{formatCurrency(Number(installment.amount))}</td>
                      <td className="py-2">{formatCurrency(Number(installment.paidAmount))}</td>
                      <td className="py-2">{formatCurrency(Math.max(pending, 0))}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getInstallmentStatusBadgeClass(installment.status)}`}>
                          {getInstallmentStatusLabel(installment.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {showCollectionActions ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Registrar pago</h2>
            <form action={createPaymentAction} className="space-y-3">
              <input type="hidden" name="saleId" value={sale.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Monto (BOB) *</Label>
                  <Input name="amount" type="number" min="0.01" step="0.01" required />
                </div>
                <div>
                  <Label>Metodo *</Label>
                  <Select name="method" defaultValue={PaymentMethod.CASH}>
                    <option value={PaymentMethod.CASH}>{getPaymentMethodLabel(PaymentMethod.CASH)}</option>
                    <option value={PaymentMethod.TRANSFER}>{getPaymentMethodLabel(PaymentMethod.TRANSFER)}</option>
                    <option value={PaymentMethod.QR}>{getPaymentMethodLabel(PaymentMethod.QR)}</option>
                  </Select>
                </div>
                <div>
                  <Label>Fecha pago</Label>
                  <Input name="paidAt" type="date" />
                </div>
                <div>
                  <Label>Nota</Label>
                  <Input name="note" />
                </div>
              </div>
              <SubmitButton label="Registrar pago" />
            </form>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Monto</th>
                    <th className="py-2">Metodo</th>
                    <th className="py-2">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100">
                      <td className="py-2">{formatDate(payment.paidAt)}</td>
                      <td className="py-2">{formatCurrency(Number(payment.amount))}</td>
                      <td className="py-2">{getPaymentMethodLabel(payment.method)}</td>
                      <td className="py-2">{payment.note ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Seguimiento de cobranza</h2>
            <form action={createCollectionLogAction} className="space-y-3">
              <input type="hidden" name="saleId" value={sale.id} />
              <div>
                <Label>Comentario *</Label>
                <Textarea name="comment" required rows={3} />
              </div>
              <div>
                <Label>Proximo contacto</Label>
                <Input name="nextContactAt" type="date" />
              </div>
              <SubmitButton label="Guardar seguimiento" />
            </form>

            <div className="mt-4 space-y-2 text-sm">
              {sale.collectionLogs.map((log) => (
                <div key={log.id} className="rounded-md border border-slate-200 p-3">
                  <p className="text-slate-900">{log.comment}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(log.createdAt)} · {log.createdBy.email} · Proximo: {formatDate(log.nextContactAt)}
                  </p>
                </div>
              ))}
              {sale.collectionLogs.length === 0 ? <p className="text-sm text-slate-500">Sin seguimiento aun.</p> : null}
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <p className={`text-sm ${isCanceled ? "text-red-700" : "text-green-700"}`}>
            {isCanceled
              ? "Esta venta esta cancelada. No hay cobros ni seguimiento activos."
              : "Esta venta ya fue pagada por completo. No hay cobros ni seguimiento pendientes."}
          </p>
        </Card>
      )}
    </div>
  );
}

