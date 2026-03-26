import type { GetServerSideProps } from "next";

import ProductsPage from "@/features/products/screens/products-page";
import { withTenantPage } from "@/services/pages/guards";
import { getProductsCatalogServer } from "@/services/server/products.service";

const PAGE_SIZE = 10;

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context, user) => {
  const q = typeof context.query.q === "string" ? context.query.q.trim().toLowerCase() : "";
  const status =
    context.query.status === "inactive" ? "inactive" : context.query.status === "active" ? "active" : "all";
  const categoryId = typeof context.query.categoryId === "string" ? context.query.categoryId.trim() : "";
  const requestedPage = Number.parseInt(typeof context.query.page === "string" ? context.query.page : "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const { products: allProducts, categories } = await getProductsCatalogServer(context);
  const filteredProducts = allProducts.filter((product) => {
    const matchesStatus = status === "all" ? true : status === "active" ? product.isActive : !product.isActive;
    const matchesCategory = categoryId ? product.categoryId === categoryId : true;
    const matchesQuery = !q || product.name.toLowerCase().includes(q) || (product.sku ?? "").toLowerCase().includes(q);

    return matchesStatus && matchesCategory && matchesQuery;
  });

  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  return {
    props: {
      q,
      status,
      categoryId,
      page: currentPage,
      totalProducts,
      products: filteredProducts.slice(skip, skip + PAGE_SIZE),
      categories,
      activeCategories: categories.filter((category) => category.isActive),
      userRole: user.role,
    },
  };
});

export default ProductsPage;

