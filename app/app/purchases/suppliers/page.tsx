import Link from "next/link";

import { Role } from "@prisma/client";

import { SupplierCreateModalButton } from "@/components/purchases/supplier-create-modal";
import { Card, PageTitle } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/session";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

const PAGE_SIZE = 10;

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireTenantUser();
  const query = await searchParams;

  const q = (query.q ?? "").trim();
  const status = query.status === "inactive" ? "inactive" : query.status === "active" ? "active" : "all";
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const isAdmin = user.role === Role.ADMIN_EMPRESA;

  const where = {
    tenantId: user.tenantId,
    deletedAt: null as null,
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { nit: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const totalSuppliers = await prisma.supplier.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalSuppliers / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const suppliers = await prisma.supplier.findMany({
    where,
    select: {
      id: true,
      name: true,
      nit: true,
      phone: true,
      email: true,
      isActive: true,
      _count: {
        select: {
          purchases: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
  });

  const pageStart = totalSuppliers === 0 ? 0 : skip + 1;
  const pageEnd = totalSuppliers === 0 ? 0 : Math.min(skip + PAGE_SIZE, totalSuppliers);

  return (
    <div className="space-y-6">
      <PageTitle title="Proveedores" subtitle="Gestion de proveedores para el proceso de compras." />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
        <p className="text-sm text-slate-600">Listado principal de proveedores.</p>
        {isAdmin ? <SupplierCreateModalButton /> : <p className="text-xs text-slate-500">Solo ADMIN_EMPRESA puede registrar proveedores.</p>}
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Nombre, NIT, telefono o email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
            <select name="status" defaultValue={status} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900">
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
            <Link href="/app/purchases/suppliers" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              Limpiar
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Mostrando {pageStart}-{pageEnd} de {totalSuppliers} proveedores
          </p>
          <p>
            Pagina {currentPage} / {totalPages}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">NIT</th>
                <th className="py-2 pr-3">Telefono</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Compras</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">{supplier.name}</td>
                  <td className="py-2 pr-3">{supplier.nit ?? "-"}</td>
                  <td className="py-2 pr-3">{supplier.phone ?? "-"}</td>
                  <td className="py-2 pr-3">{supplier.email ?? "-"}</td>
                  <td className="py-2 pr-3">{supplier.isActive ? "Activo" : "Inactivo"}</td>
                  <td className="py-2 pr-3">{supplier._count.purchases}</td>
                </tr>
              ))}

              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-5 text-center text-sm text-slate-500">
                    No hay proveedores para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <PaginationLink
            disabled={currentPage <= 1}
            href={buildSuppliersUrl({ q, status, page: currentPage - 1 })}
            label="Anterior"
          />
          <PaginationLink
            disabled={currentPage >= totalPages}
            href={buildSuppliersUrl({ q, status, page: currentPage + 1 })}
            label="Siguiente"
          />
        </div>
      </Card>
    </div>
  );
}

function buildSuppliersUrl({ q, status, page }: { q: string; status: string; page: number }) {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  params.set("page", String(page));

  const query = params.toString();
  return query ? `/app/purchases/suppliers?${query}` : "/app/purchases/suppliers";
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
