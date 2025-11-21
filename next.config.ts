import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // transpilePackages: ['three'],
  // headers: headers,
  experimental: {
    workerThreads: false,
    cpus: 2, // Limit CPU usage
    serverMinification: false
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all HTTPS domains
      },
            {
        protocol: "http",
        hostname: "**", // Allow all HTTPS domains
      },
    ], 
    // Define device sizes for responsive images
    deviceSizes: [
      320,  //xs
      420,  //sm
      768,  //md
      1024, //lg
      1200  //xl
    ],
    // Define image sizes for optimization
    imageSizes: [
      16,   // tiny icons
      32,   // small icons
      48,   // medium icons
      64,   // large icons
      96,   // avatars
      128,  // thumbnails
      256,  // small images
      384   // medium images
    ],
    // All supported formats in order of preference
    formats: ['image/avif', 'image/webp'],
    // Disable static image imports (optional)
    disableStaticImages: false,
    // Minimum cache TTL in seconds
    minimumCacheTTL: 60,
    // Allow SVG - with security policy
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    // contentSecurityPolicy: "default-src 'self'; script-src 'self'; sandbox allow-scripts;",
  },
};

export default nextConfig;
