function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_IDLE_TIMEOUT_MINUTES = 15;
const DEFAULT_IDLE_WARNING_SECONDS = 60;
const DEFAULT_SESSION_HEARTBEAT_SECONDS = 4 * 60;

export const IDLE_TIMEOUT_MINUTES = parsePositiveInteger(
  process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES,
  DEFAULT_IDLE_TIMEOUT_MINUTES,
);

export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

export const IDLE_WARNING_SECONDS = parsePositiveInteger(
  process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS,
  DEFAULT_IDLE_WARNING_SECONDS,
);

export const IDLE_WARNING_MS = Math.min(IDLE_TIMEOUT_MS, IDLE_WARNING_SECONDS * 1000);

export const SESSION_HEARTBEAT_SECONDS = parsePositiveInteger(
  process.env.NEXT_PUBLIC_SESSION_HEARTBEAT_SECONDS,
  DEFAULT_SESSION_HEARTBEAT_SECONDS,
);

export const SESSION_HEARTBEAT_MS = SESSION_HEARTBEAT_SECONDS * 1000;

export const SESSION_MAX_AGE_SECONDS = parsePositiveInteger(
  process.env.NEXTAUTH_SESSION_MAX_AGE_SECONDS,
  IDLE_TIMEOUT_MINUTES * 60,
);
