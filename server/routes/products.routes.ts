import { Router } from "express";

import {
  createCategoryController,
  createProductController,
  deleteProductController,
  listProductsController,
  updateProductController,
} from "@/server/controllers/products.controller";

const productsRouter = Router();
const productCategoriesRouter = Router();

productsRouter.get("/", listProductsController);
productsRouter.post("/", createProductController);
productsRouter.put("/:productId", updateProductController);
productsRouter.delete("/:productId", deleteProductController);

productCategoriesRouter.post("/", createCategoryController);

export { productCategoriesRouter, productsRouter };
