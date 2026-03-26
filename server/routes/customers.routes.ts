import { Router } from "express";

import {
  createCustomerController,
  deleteCustomerController,
  getCustomerController,
  listCustomersController,
  updateCustomerController,
} from "@/server/controllers/customers.controller";

const customersRouter = Router();

customersRouter.get("/", listCustomersController);
customersRouter.get("/:customerId", getCustomerController);
customersRouter.post("/", createCustomerController);
customersRouter.put("/:customerId", updateCustomerController);
customersRouter.delete("/:customerId", deleteCustomerController);

export { customersRouter };
