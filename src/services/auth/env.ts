function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function resolveHostedUrl(name: string) {
  const value = readEnv(name);

  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function isLocalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function resolveAuthBaseUrl() {
  const configuredUrl = readEnv("NEXTAUTH_URL");
  const hostedUrl = resolveHostedUrl("VERCEL_URL") ?? readEnv("RENDER_EXTERNAL_URL");

  if (configuredUrl) {
    if (hostedUrl && process.env.NODE_ENV === "production" && isLocalUrl(configuredUrl)) {
      return hostedUrl;
    }

    return configuredUrl;
  }

  return hostedUrl;
}

export function resolveAuthSecret() {
  return readEnv("NEXTAUTH_SECRET") ?? readEnv("AUTH_SECRET");
}

export function resolveSecureCookiePreference(protocolHint?: string | null) {
  if (protocolHint) {
    const normalized = protocolHint.replace(":", "").split(",")[0]?.trim().toLowerCase();
    if (normalized === "https") {
      return true;
    }
    if (normalized === "http") {
      return false;
    }
  }

  const authBaseUrl = resolveAuthBaseUrl();
  if (authBaseUrl) {
    return new URL(authBaseUrl).protocol === "https:";
  }

  return process.env.NODE_ENV === "production";
}

export function hydrateAuthEnvironment() {
  const authBaseUrl = resolveAuthBaseUrl();
  const authSecret = resolveAuthSecret();

  if (authBaseUrl && !process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = authBaseUrl;
  }

  if (authSecret && !process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = authSecret;
  }

  return {
    authBaseUrl,
    authSecret,
  };
}
