"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

import {
  clearSessionActivityState,
  markIdleWarning,
  markSessionActivity,
  readSessionActivity,
  SESSION_ACTIVITY_KEY,
  SESSION_WARNING_KEY,
} from "@/services/auth/session-activity.client";
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS, SESSION_HEARTBEAT_MS } from "@/services/auth/session-policy";
import { useToast } from "@/shared/components/toast-provider";

const ACTIVITY_PERSIST_THROTTLE_MS = 10 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"] as const;

export function SessionActivityGuard() {
  const { status, update } = useSession();
  const { info } = useToast();
  const isSigningOutRef = useRef(false);
  const lastPersistedAtRef = useRef(0);
  const warningShownRef = useRef(false);
  const lastHeartbeatAtRef = useRef(0);

  const ensureActivityTimestamp = useEffectEvent(() => {
    const stored = readSessionActivity();

    if (stored) {
      return stored;
    }

    return markSessionActivity();
  });

  const signOutForSecurity = useEffectEvent(async (reason: "idle" | "expired") => {
    if (isSigningOutRef.current) {
      return;
    }

    isSigningOutRef.current = true;
    clearSessionActivityState();
    await signOut({ callbackUrl: `/login?reason=${reason}` });
  });

  const warnAboutExpiry = useEffectEvent((inactiveMs: number) => {
    if (warningShownRef.current || IDLE_WARNING_MS <= 0) {
      return;
    }

    if (inactiveMs < IDLE_TIMEOUT_MS - IDLE_WARNING_MS || inactiveMs >= IDLE_TIMEOUT_MS) {
      return;
    }

    warningShownRef.current = true;
    markIdleWarning();
    const minutes = Math.max(1, Math.ceil((IDLE_TIMEOUT_MS - inactiveMs) / 60_000));
    info(`Tu sesion se cerrara en ${minutes} minuto${minutes === 1 ? "" : "s"} por inactividad.`, "Sesion por expirar");
  });

  const registerActivity = useEffectEvent(() => {
    const now = Date.now();
    const lastActivity = ensureActivityTimestamp();

    if (now - lastActivity >= IDLE_TIMEOUT_MS) {
      void signOutForSecurity("idle");
      return;
    }

    if (now - lastPersistedAtRef.current < ACTIVITY_PERSIST_THROTTLE_MS) {
      return;
    }

    lastPersistedAtRef.current = markSessionActivity(now);
    warningShownRef.current = false;
  });

  const syncSessionState = useEffectEvent(async () => {
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    const lastActivity = ensureActivityTimestamp();
    const inactiveMs = Date.now() - lastActivity;

    if (inactiveMs >= IDLE_TIMEOUT_MS) {
      await signOutForSecurity("idle");
      return;
    }

    warnAboutExpiry(inactiveMs);

    const now = Date.now();
    if (now - lastHeartbeatAtRef.current < SESSION_HEARTBEAT_MS) {
      return;
    }

    lastHeartbeatAtRef.current = now;

    try {
      const refreshed = await update();
      if (!refreshed) {
        await signOutForSecurity("expired");
      }
    } catch {
      await signOutForSecurity("expired");
    }
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      clearSessionActivityState();
      warningShownRef.current = false;
      isSigningOutRef.current = false;
      lastPersistedAtRef.current = 0;
      lastHeartbeatAtRef.current = 0;
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const initialActivity = ensureActivityTimestamp();
    lastPersistedAtRef.current = initialActivity;
    warningShownRef.current = Boolean(window.localStorage.getItem(SESSION_WARNING_KEY));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_WARNING_KEY && !event.newValue) {
        warningShownRef.current = false;
      }

      if (event.key === SESSION_ACTIVITY_KEY && !event.newValue) {
        warningShownRef.current = false;
        lastPersistedAtRef.current = 0;
      }
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, registerActivity, { passive: true });
    }

    window.addEventListener("storage", handleStorage);

    const intervalId = window.setInterval(() => {
      void syncSessionState();
    }, 15_000);

    void syncSessionState();

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, registerActivity);
      }

      window.removeEventListener("storage", handleStorage);
      window.clearInterval(intervalId);
    };
  }, [status]);

  return null;
}

