import cors from "cors";
import express from "express";

import { errorHandler } from "@/server/middlewares/error-handler";
import { attachRequestActor } from "@/server/middlewares/request-actor";
import { apiRouter } from "@/server/routes";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:4200";
const REQUEST_BODY_LIMIT = "1mb";

export function createServerApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === FRONTEND_ORIGIN) {
          callback(null, true);
          return;
        }

        callback(new Error("Origen no permitido por CORS."));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-email", "x-user-role", "x-tenant-id"],
    }),
  );

  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (req.secure || req.header("x-forwarded-proto") === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }

    next();
  });

  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));
  app.use(attachRequestActor);

  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}

