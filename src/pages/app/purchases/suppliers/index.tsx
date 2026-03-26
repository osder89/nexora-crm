import type { GetServerSideProps } from "next";

import SuppliersPage from "@/features/purchases/screens/suppliers-page";
import { withTenantPage } from "@/services/pages/guards";
import { getPurchasesDataServer } from "@/services/server/purchases.service";

const PAGE_SIZE = 10;

export const getServerSideProps: GetServerSideProps = withTenantPage(async (context, user) => {
  const q = typeof context.query.q === "string" ? context.query.q.trim().toLowerCase() : "";
  const status = context.query.status === "inactive" ? "inactive" : context.query.status === "active" ? "active" : "all";
  const requestedPage = Number.parseInt(typeof context.query.page === "string" ? context.query.page : "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const { suppliers: allSuppliers } = await getPurchasesDataServer(context);
  const filteredSuppliers = allSuppliers.filter((supplier) => {
    const matchesStatus = status === "all" ? true : status === "active" ? supplier.isActive : !supplier.isActive;
    const haystack = [supplier.name, supplier.nit ?? "", supplier.phone ?? "", supplier.email ?? ""].join(" ").toLowerCase();
    const matchesQuery = !q || haystack.includes(q);

    return matchesStatus && matchesQuery;
  });

  const totalSuppliers = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalSuppliers / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  return {
    props: {
      q,
      status,
      page: currentPage,
      totalSuppliers,
      suppliers: filteredSuppliers.slice(skip, skip + PAGE_SIZE),
      userRole: user.role,
    },
  };
});

export default SuppliersPage;

