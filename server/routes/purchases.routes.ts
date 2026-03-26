import { Router } from "express";

import {
  cancelPurchaseController,
  createPurchaseController,
  createSupplierController,
  getPurchaseController,
  listPurchasesController,
  receivePurchaseController,
} from "@/server/controllers/purchases.controller";

const purchasesRouter = Router();
const suppliersRouter = Router();

purchasesRouter.get("/", listPurchasesController);
purchasesRouter.get("/:purchaseId", getPurchaseController);
purchasesRouter.post("/", createPurchaseController);
purchasesRouter.post("/:purchaseId/receive", receivePurchaseController);
purchasesRouter.post("/:purchaseId/cancel", cancelPurchaseController);

suppliersRouter.post("/", createSupplierController);

export { purchasesRouter, suppliersRouter };
