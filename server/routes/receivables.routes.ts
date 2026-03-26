import { Router } from "express";

import { createCollectionLogController, listReceivablesController } from "@/server/controllers/receivables.controller";

const receivablesRouter = Router();

receivablesRouter.get("/", listReceivablesController);
receivablesRouter.post("/collection-logs", createCollectionLogController);

export { receivablesRouter };
