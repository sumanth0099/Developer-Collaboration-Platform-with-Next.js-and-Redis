const PLACEHOLDER_AUTH_HOSTS = new Set(["your-app.vercel.app"]);

function isPlaceholderAuthUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return PLACEHOLDER_AUTH_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function vercelDeploymentUrl(): string | undefined {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;
  return host ? `https://${host}` : undefined;
}

/** Ensure Auth.js uses the real deployment URL, not template env values. */
export function resolveAuthUrl(): void {
  for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
    if (isPlaceholderAuthUrl(process.env[key])) {
      delete process.env[key];
    }
  }

  if (process.env.AUTH_URL || process.env.NEXTAUTH_URL) return;

  const resolved = vercelDeploymentUrl();
  if (!resolved) return;

  process.env.AUTH_URL = resolved;
  process.env.NEXTAUTH_URL = resolved;
}

resolveAuthUrl();
