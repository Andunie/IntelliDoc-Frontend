// Bypass SSL certificate validation for self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import type { NextConfig } from "next";
const nextConfig: NextConfig = {}; // Rewrite/Proxy yok, bomboş bırak.
export default nextConfig;