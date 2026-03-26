import Link from "next/link";

import type { CustomerDetail } from "@/services/server/customers.service";
import { Card, PageTitle } from "@/shared/components/ui";
import { getCustomerFullName } from "@/shared/lib/customers";
import { getPaymentMethodLabel, getSaleStatusBadgeClass, getSaleStatusLabel } from "@/shared/lib/labels";
import { formatCurrency, formatDate } from "@/shared/lib/utils";

type CustomerDetailPageProps = {
  customer: CustomerDetail;
};

export default function CustomerDetailPage({ customer }: CustomerDetailPageProps) {
  const fullName = getCustomerFullName(customer);
  const totalCompras = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalSaldo = customer.sales.reduce((sum, sale) => sum + Number(sale.balance), 0);

  return (
    <div className="space-y-6">
      <PageTitle title={`Ficha cliente: ${fullName}`} subtitle="Historial de ventas, saldo y auditoria." />

      <Card>
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <p>
            <span className="text-slate-500">NIT:</span> {customer.nit ?? "-"}
          </p>
          <p>
            <span className="text-slate-500">Telefono:</span> {customer.phone ?? "-"}
          </p>
          <p>
            <span className="text-slate-500">Email:</span> {customer.email ?? "-"}
          </p>
          <p>
            <span className="text-slate-500">Estado:</span> {customer.isActive ? "Activo" : "Inactivo"}
          </p>
          <p>
            <span className="text-slate-500">Total compras:</span> {formatCurrency(totalCompras)}
          </p>
          <p>
            <span className="text-slate-500">Saldo:</span> {formatCurrency(totalSaldo)}
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Ventas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Venta</th>
                <th className="py-2">Fecha</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Total</th>
                <th className="py-2">Saldo</th>
                <th className="py-2">Pagos</th>
              </tr>
            </thead>
            <tbody>
              {customer.sales.map((sale) => (
                <tr key={sale.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 font-medium">
                    <Link href={`/app/sales/${sale.id}`} className="text-slate-900 underline">
                      {sale.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="py-2">{formatDate(sale.createdAt)}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getSaleStatusBadgeClass(sale.status)}`}>
                      {getSaleStatusLabel(sale.status)}
                    </span>
                  </td>
                  <td className="py-2">{formatCurrency(Number(sale.total))}</td>
                  <td className="py-2">{formatCurrency(Number(sale.balance))}</td>
                  <td className="py-2">
                    {sale.payments.length > 0 ? (
                      <ul className="space-y-1 text-xs">
                        {sale.payments.map((payment) => (
                          <li key={payment.id}>
                            {formatDate(payment.paidAt)}: {formatCurrency(Number(payment.amount))} ({getPaymentMethodLabel(payment.method)})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

