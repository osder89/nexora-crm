import express, { type Request, type Response } from "express";

import { errorHandler } from "@/server/middlewares/error-handler";
import { attachRequestActor } from "@/server/middlewares/request-actor";
import { apiRouter } from "@/server/routes";

export function createApiApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use("/api", (req, res, next) => {
    applySecurityHeaders(req, res);
    applyNoStoreHeaders(res);
    next();
  });

  app.use("/api", attachRequestActor, apiRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({
      message: "Ruta API no encontrada.",
    });
  });

  app.use(errorHandler);

  return app;
}

function applyNoStoreHeaders(res: Response) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
}

function applySecurityHeaders(req: Request, res: Response) {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.secure || req.header("x-forwarded-proto") === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
}
