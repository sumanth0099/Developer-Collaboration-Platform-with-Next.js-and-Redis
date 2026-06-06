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

/**
 * Ensure Auth.js uses the real deployment URL, not template env values.
 *
 * NOTE: This module must NEVER be imported in Edge Runtime (middleware.ts).
 * Webpack inlines process.env.* as string literals in Edge bundles, which
 * turns assignments like `process.env.AUTH_URL = x` into `"literal" = x`
 * (an "Assigning to rvalue" build error).
 *
 * Instead, this runs only via instrumentation.ts (Node.js runtime) and
 * lib/auth.ts (server-side Node.js).
 */
export function resolveAuthUrl(): void {
  const env = process.env as Record<string, string | undefined>;

  for (const key of ["AUTH_URL", "NEXTAUTH_URL"]) {
    if (isPlaceholderAuthUrl(env[key])) {
      delete env[key];
    }
  }

  if (env["AUTH_URL"] || env["NEXTAUTH_URL"]) return;

  const resolved = vercelDeploymentUrl();
  if (!resolved) return;

  env["AUTH_URL"] = resolved;
  env["NEXTAUTH_URL"] = resolved;
}

resolveAuthUrl();
