/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Content-Security-Policy',
            // Wildcard * is intentional — PandaDash clients use white-labeled GHL domains
            value:
              "frame-ancestors 'self' https://*.gohighlevel.com https://*.leadconnectorhq.com https://*.msgsndr.com https://*.highlevel.com https://*.myclients.io *",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
