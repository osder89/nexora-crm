import { Router } from "express";

import { customersRouter } from "@/server/routes/customers.routes";
import { healthRouter } from "@/server/routes/health.routes";
import { productCategoriesRouter, productsRouter } from "@/server/routes/products.routes";
import { purchasesRouter, suppliersRouter } from "@/server/routes/purchases.routes";
import { receivablesRouter } from "@/server/routes/receivables.routes";
import { salesRouter } from "@/server/routes/sales.routes";
import { settingsRouter } from "@/server/routes/settings.routes";
import { superRouter } from "@/server/routes/super.routes";
import { usersRouter } from "@/server/routes/users.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/customers", customersRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/product-categories", productCategoriesRouter);
apiRouter.use("/purchases", purchasesRouter);
apiRouter.use("/suppliers", suppliersRouter);
apiRouter.use("/sales", salesRouter);
apiRouter.use("/receivables", receivablesRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/super", superRouter);

export { apiRouter };
