import { Router } from "express";

import { createVendorController, listUsersController, toggleVendorStatusController } from "@/server/controllers/users.controller";

const usersRouter = Router();

usersRouter.get("/", listUsersController);
usersRouter.post("/vendors", createVendorController);
usersRouter.post("/:userId/toggle-status", toggleVendorStatusController);

export { usersRouter };
