const SESSION_ACTIVITY_KEY = "nexora.session.last-activity-at";
const SESSION_WARNING_KEY = "nexora.session.idle-warning-at";

export { SESSION_ACTIVITY_KEY, SESSION_WARNING_KEY };

export function readSessionActivity() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(SESSION_ACTIVITY_KEY);
  const parsed = Number(rawValue ?? "");

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function markSessionActivity(timestamp = Date.now()) {
  if (typeof window === "undefined") {
    return timestamp;
  }

  window.localStorage.setItem(SESSION_ACTIVITY_KEY, String(timestamp));
  window.localStorage.removeItem(SESSION_WARNING_KEY);
  return timestamp;
}

export function markIdleWarning(timestamp = Date.now()) {
  if (typeof window === "undefined") {
    return timestamp;
  }

  window.localStorage.setItem(SESSION_WARNING_KEY, String(timestamp));
  return timestamp;
}

export function clearSessionActivityState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_ACTIVITY_KEY);
  window.localStorage.removeItem(SESSION_WARNING_KEY);
}
