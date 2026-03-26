import { Router } from "express";

import {
  createTenantAdminController,
  createTenantController,
  listTenantsController,
  toggleTenantStatusController,
} from "@/server/controllers/super.controller";

const superRouter = Router();

superRouter.get("/tenants", listTenantsController);
superRouter.post("/tenants", createTenantController);
superRouter.post("/tenants/:tenantId/toggle-status", toggleTenantStatusController);
superRouter.post("/tenants/:tenantId/admins", createTenantAdminController);

export { superRouter };
