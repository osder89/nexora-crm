import type { Request, Response } from "express";

export function getHealthController(_req: Request, res: Response) {
  res.json({
    ok: true,
    service: "nexora-backend",
    timestamp: new Date().toISOString(),
  });
}
