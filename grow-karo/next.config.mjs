/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Start in Report-Only mode so nothing breaks.
// Once the browser console shows no CSP warnings, change the key
// below to "Content-Security-Policy" to enforce it.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://drive.google.com",
  "font-src 'self' data:",
  "connect-src 'self'", // /api goes through nginx on the same domain, so 'self' is enough
  "frame-ancestors 'self'", // matches nginx's X-Frame-Options SAMEORIGIN
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// HSTS, X-Frame-Options, X-Content-Type-Options and Referrer-Policy
// are set by nginx, so they are NOT repeated here.
const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  output: "standalone",
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;