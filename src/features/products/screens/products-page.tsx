import Link from "next/link";

import { Role } from "@prisma/client";

import { ProductCategoryCreateModalButton } from "@/features/products/components/product-category-create-modal";
import { ProductCreateModalButton } from "@/features/products/components/product-create-modal";
import { ProductDeleteButton } from "@/features/products/components/product-delete-button";
import { ProductUpdateModalButton } from "@/features/products/components/product-update-modal";
import type { ProductCategory, ProductListItem } from "@/services/server/products.service";
import { Card, PageTitle } from "@/shared/components/ui";
import { formatCurrency } from "@/shared/lib/utils";

type ProductStatusFilter = "all" | "active" | "inactive";

type ProductsPageProps = {
  q: string;
  status: ProductStatusFilter;
  categoryId: string;
  page: number;
  totalProducts: number;
  products: ProductListItem[];
  categories: ProductCategory[];
  activeCategories: ProductCategory[];
  userRole: Role;
};

const PAGE_SIZE = 10;

export default function ProductsPage({ q, status, categoryId, page, totalProducts, products, categories, activeCategories, userRole }: ProductsPageProps) {
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;
  const lowStockCount = products.filter((item) => item.stock <= item.stockMin).length;
  const pageStart = totalProducts === 0 ? 0 : skip + 1;
  const pageEnd = totalProducts === 0 ? 0 : Math.min(skip + PAGE_SIZE, totalProducts);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Productos"
        subtitle="Listado de productos con categorias, filtros y paginado. La gestion manual de movimientos se retiro de esta vista."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Productos en pagina</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{products.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Stock bajo en pagina</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{lowStockCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Categorias activas</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{activeCategories.length}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form className="grid w-full gap-3 md:max-w-4xl md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Buscar</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Nombre o SKU"
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
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
              <select
                name="categoryId"
                defaultValue={categoryId}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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
              <Link href="/app/products" className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                Limpiar
              </Link>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <ProductCategoryCreateModalButton />
            <ProductCreateModalButton categories={activeCategories} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Mostrando {pageStart}-{pageEnd} de {totalProducts} productos
          </p>
          <p>
            Pagina {currentPage} / {totalPages}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Categoria</th>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Costo</th>
                <th className="py-2 pr-3">Precio</th>
                <th className="py-2 pr-3">Stock</th>
                <th className="py-2 pr-3">Stock minimo</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stockLow = product.stock <= product.stockMin;

                return (
                  <tr key={product.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3 font-medium text-slate-900">{product.name}</td>
                    <td className="py-2 pr-3">
                      {product.category ? (
                        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">{product.category.name}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2 pr-3">{product.sku ?? "-"}</td>
                    <td className="py-2 pr-3">{product.cost ? formatCurrency(Number(product.cost)) : "-"}</td>
                    <td className="py-2 pr-3">{formatCurrency(Number(product.price))}</td>
                    <td className="py-2 pr-3">
                      <span className={stockLow ? "font-semibold text-amber-700" : ""}>{product.stock}</span>
                    </td>
                    <td className="py-2 pr-3">{product.stockMin}</td>
                    <td className="py-2 pr-3">{product.isActive ? "Activo" : "Inactivo"}</td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        <ProductUpdateModalButton
                          categories={activeCategories}
                          product={{
                            id: product.id,
                            name: product.name,
                            sku: product.sku,
                            categoryId: product.categoryId,
                            cost: product.cost ? Number(product.cost) : null,
                            price: Number(product.price),
                            stock: product.stock,
                            stockMin: product.stockMin,
                            isActive: product.isActive,
                          }}
                        />

                        {userRole === Role.ADMIN_EMPRESA ? <ProductDeleteButton productId={product.id} /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-5 text-center text-sm text-slate-500">
                    No hay productos para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <PaginationLink
            disabled={currentPage <= 1}
            href={buildProductsUrl({ q, status, categoryId, page: currentPage - 1 })}
            label="Anterior"
          />
          <PaginationLink
            disabled={currentPage >= totalPages}
            href={buildProductsUrl({ q, status, categoryId, page: currentPage + 1 })}
            label="Siguiente"
          />
        </div>
      </Card>
    </div>
  );
}

function buildProductsUrl({ q, status, categoryId, page }: { q: string; status: ProductStatusFilter; categoryId: string; page: number }) {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  if (categoryId) {
    params.set("categoryId", categoryId);
  }
  params.set("page", String(page));

  const query = params.toString();
  return query ? `/app/products?${query}` : "/app/products";
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

