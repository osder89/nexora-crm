import { Router } from "express";

import { getHealthController } from "@/server/controllers/health.controller";

const healthRouter = Router();

healthRouter.get("/", getHealthController);

export { healthRouter };
