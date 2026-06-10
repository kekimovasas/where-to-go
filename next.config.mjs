/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/pvd/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*"
      },
      {
        source: "/pvd/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*"
      },
      {
        source: "/pvd/:path*",
        destination: "https://us.i.posthog.com/:path*"
      }
    ];
  },
  skipTrailingSlashRedirect: true
};

export default nextConfig;
