import type { AppActor } from "@/server/types/actor";

declare global {
  namespace Express {
    interface Request {
      actor?: AppActor | null;
    }
  }
}

export {};
