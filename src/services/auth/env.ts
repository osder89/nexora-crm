function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function resolveAuthBaseUrl() {
  return readEnv("NEXTAUTH_URL") ?? readEnv("RENDER_EXTERNAL_URL");
}

export function resolveAuthSecret() {
  return readEnv("NEXTAUTH_SECRET") ?? readEnv("AUTH_SECRET");
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
