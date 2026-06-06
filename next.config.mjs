const PLACEHOLDER_AUTH_HOSTS = new Set(["your-app.vercel.app"]);

function resolveAuthUrlForBuild() {
  const current = process.env.AUTH_URL || process.env.NEXTAUTH_URL;

  if (current) {
    try {
      if (PLACEHOLDER_AUTH_HOSTS.has(new URL(current).hostname)) {
        const host =
          process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
        return host ? `https://${host}` : undefined;
      }
      return current;
    } catch {
      return current;
    }
  }

  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : undefined;
}

const resolvedAuthUrl = resolveAuthUrlForBuild();

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(resolvedAuthUrl
    ? { env: { AUTH_URL: resolvedAuthUrl, NEXTAUTH_URL: resolvedAuthUrl } }
    : {}),
  images: {
    domains: ["avatars.githubusercontent.com", "public.blob.vercel-storage.com", "res.cloudinary.com", "lh3.googleusercontent.com"],
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "/api/:path*",
      },
    ];
  },
};

export default nextConfig;
