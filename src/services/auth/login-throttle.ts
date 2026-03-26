type LoginAttemptState = {
  count: number;
  windowStartedAt: number;
  blockedUntil: number | null;
};

type LoginThrottleStore = Map<string, LoginAttemptState>;

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

declare global {
  var __nexoraLoginThrottleStore: LoginThrottleStore | undefined;
}

const loginThrottleStore = globalThis.__nexoraLoginThrottleStore ?? new Map<string, LoginAttemptState>();

globalThis.__nexoraLoginThrottleStore = loginThrottleStore;

export function buildLoginThrottleKey(email: string, headers?: Record<string, unknown>) {
  const normalizedHeaders = headers ?? {};
  const forwardedFor = readHeader(normalizedHeaders, "x-forwarded-for");
  const realIp = readHeader(normalizedHeaders, "x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown";

  return `${ip}:${email}`;
}

export function isLoginBlocked(key: string) {
  cleanupExpiredEntries();

  const state = loginThrottleStore.get(key);
  if (!state?.blockedUntil) {
    return false;
  }

  if (state.blockedUntil <= Date.now()) {
    loginThrottleStore.delete(key);
    return false;
  }

  return true;
}

export function registerFailedLogin(key: string) {
  cleanupExpiredEntries();

  const now = Date.now();
  const current = loginThrottleStore.get(key);

  if (!current || now - current.windowStartedAt > ATTEMPT_WINDOW_MS) {
    loginThrottleStore.set(key, {
      count: 1,
      windowStartedAt: now,
      blockedUntil: null,
    });
    return;
  }

  const nextCount = current.count + 1;
  loginThrottleStore.set(key, {
    count: nextCount,
    windowStartedAt: current.windowStartedAt,
    blockedUntil: nextCount >= MAX_FAILED_ATTEMPTS ? now + BLOCK_DURATION_MS : null,
  });
}

export function clearFailedLogins(key: string) {
  loginThrottleStore.delete(key);
}

function cleanupExpiredEntries() {
  const now = Date.now();

  for (const [key, state] of loginThrottleStore.entries()) {
    const isExpiredBlock = state.blockedUntil !== null && state.blockedUntil <= now;
    const isExpiredWindow = state.blockedUntil === null && now - state.windowStartedAt > ATTEMPT_WINDOW_MS;

    if (isExpiredBlock || isExpiredWindow) {
      loginThrottleStore.delete(key);
    }
  }
}

function readHeader(headers: Record<string, unknown>, headerName: string) {
  const value = headers[headerName];

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }

  return typeof value === "string" ? value : null;
}
