import express, { type Request, type Response } from "express";

import { errorHandler } from "@/server/middlewares/error-handler";
import { attachRequestActor } from "@/server/middlewares/request-actor";
import { apiRouter } from "@/server/routes";

type NextRequestHandler = (req: Request, res: Response) => Promise<void> | void;

const REQUEST_BODY_LIMIT = "1mb";
const AUTH_ROUTE_PATTERN = /^\/api\/auth(?:\/.*)?$/;

export function createServerApp(nextHandler: NextRequestHandler) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (req.secure || req.header("x-forwarded-proto") === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }

    next();
  });

  app.use(AUTH_ROUTE_PATTERN, (req, res) => {
    applyNoStoreHeaders(res);
    void handleNextRoute(nextHandler, req, res);
  });

  app.use(
    "/api",
    (_req, res, next) => {
      applyNoStoreHeaders(res);
      next();
    },
    express.json({ limit: REQUEST_BODY_LIMIT }),
    express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }),
    attachRequestActor,
    apiRouter,
  );

  app.use("/api", (_req, res) => {
    applyNoStoreHeaders(res);
    res.status(404).json({
      message: "Ruta API no encontrada.",
    });
  });

  app.use(errorHandler);

  app.all(/.*/, (req, res) => {
    void handleNextRoute(nextHandler, req, res);
  });

  return app;
}

function applyNoStoreHeaders(res: Response) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
}

async function handleNextRoute(nextHandler: NextRequestHandler, req: Request, res: Response) {
  try {
    await nextHandler(req, res);
  } catch (error) {
    console.error("No se pudo resolver la ruta de Next.", error);

    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    }
  }
}
