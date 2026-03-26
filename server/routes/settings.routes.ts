import { Router } from "express";

import { getTenantSettingsController, updateTenantSettingsController } from "@/server/controllers/settings.controller";

const settingsRouter = Router();

settingsRouter.get("/tenant", getTenantSettingsController);
settingsRouter.put("/tenant", updateTenantSettingsController);

export { settingsRouter };
