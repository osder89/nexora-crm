import Link from "next/link";

import { Role } from "@prisma/client";

import { CustomerCreateModalButton } from "@/components/customers/customer-create-modal";
import { CustomerUpdateModalButton } from "@/components/customers/customer-update-modal";
import { Card, PageTitle } from "@/components/ui";
import { softDeleteCustomerAction } from "@/lib/actions/customers";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

const PAGE_SIZE = 10;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireTenantUser();
  const query = await searchParams;

  const q = (query.q ?? "").trim();
  const status = query.status === "inactive" ? "inactive" : query.status === "active" ? "active" : "all";
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const where = {
    tenantId: user.tenantId,
    deletedAt: null as null,
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { nit: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const totalCustomers = await prisma.customer.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCustomers / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const customers = await prisma.customer.findMany({
    where,
    include: {
      sales: {
        where: { tenantId: user.tenantId },
        select: { total: true, balance: true },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
  });

  const pageStart = totalCustomers === 0 ? 0 : skip + 1;
  const pageEnd = totalCustomers === 0 ? 0 : Math.min(skip + PAGE_SIZE, totalCustomers);

  return (
    <div className="space-y-6">
      <PageTitle title="Clientes" subtitle="Listado con filtros, paginado y acciones por rol." />

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form className="grid w-full gap-3 md:max-w-3xl md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Buscar</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Nombre, apellido, NIT, email o telefono"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Filtrar
              </button>
              <Link href="/app/customers" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                Limpiar
              </Link>
            </div>
          </form>

          <CustomerCreateModalButton />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Mostrando {pageStart}-{pageEnd} de {totalCustomers} clientes
          </p>
          <p>Pagina {currentPage} / {totalPages}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Nombres</th>
                <th className="py-2 pr-3">Apellidos</th>
                <th className="py-2 pr-3">NIT</th>
                <th className="py-2 pr-3">Telefono</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Total compras</th>
                <th className="py-2 pr-3">Saldo</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const totalCompras = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
                const saldo = customer.sales.reduce((sum, sale) => sum + Number(sale.balance), 0);

                return (
                  <tr key={customer.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3 font-medium text-slate-900">{customer.firstName}</td>
                    <td className="py-2 pr-3">{customer.lastName}</td>
                    <td className="py-2 pr-3">{customer.nit ?? "-"}</td>
                    <td className="py-2 pr-3">{customer.phone ?? "-"}</td>
                    <td className="py-2 pr-3">{customer.email ?? "-"}</td>
                    <td className="py-2 pr-3">{customer.isActive ? "Activo" : "Inactivo"}</td>
                    <td className="py-2 pr-3">{formatCurrency(totalCompras)}</td>
                    <td className="py-2 pr-3">{formatCurrency(saldo)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        <CustomerUpdateModalButton
                          customer={{
                            id: customer.id,
                            firstName: customer.firstName,
                            lastName: customer.lastName,
                            nit: customer.nit,
                            phone: customer.phone,
                            email: customer.email,
                            address: customer.address,
                            notes: customer.notes,
                            isActive: customer.isActive,
                          }}
                        />

                        <Link
                          href={`/app/customers/${customer.id}`}
                          className="rounded-md bg-cyan-100 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-200"
                        >
                          Ver ficha
                        </Link>

                        {user.role === Role.ADMIN_EMPRESA ? (
                          <form action={softDeleteCustomerAction}>
                            <input type="hidden" name="customerId" value={customer.id} />
                            <button
                              type="submit"
                              className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                            >
                              Eliminar
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-5 text-center text-sm text-slate-500">
                    No hay clientes para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <PaginationLink disabled={currentPage <= 1} href={buildCustomersUrl(q, status, currentPage - 1)} label="Anterior" />
          <PaginationLink disabled={currentPage >= totalPages} href={buildCustomersUrl(q, status, currentPage + 1)} label="Siguiente" />
        </div>
      </Card>
    </div>
  );
}

function buildCustomersUrl(q: string, status: string, page: number) {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  params.set("page", String(page));

  const query = params.toString();
  return query ? `/app/customers?${query}` : "/app/customers";
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
