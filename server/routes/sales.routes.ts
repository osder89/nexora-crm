import { Router } from "express";

import {
  cancelSaleController,
  createSaleController,
  createSalePaymentController,
  getSaleController,
  listSalesController,
} from "@/server/controllers/sales.controller";

const salesRouter = Router();

salesRouter.get("/", listSalesController);
salesRouter.get("/:saleId", getSaleController);
salesRouter.post("/", createSaleController);
salesRouter.post("/:saleId/payments", createSalePaymentController);
salesRouter.post("/:saleId/cancel", cancelSaleController);

export { salesRouter };
