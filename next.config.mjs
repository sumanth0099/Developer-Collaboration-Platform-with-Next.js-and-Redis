
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Never bundle native bcrypt if anything still references it.
      bcrypt: "bcryptjs",
    };
    return config;
  },
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
