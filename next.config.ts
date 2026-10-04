import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'sharp'],
  async headers() { return [{ source: '/:path*', headers: [
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'X-Frame-Options',value:'SAMEORIGIN'},
    {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
    {key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.pexels.com https://*.googleusercontent.com https://places.googleapis.com; font-src 'self'; connect-src 'self'; frame-src https://www.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"}
  ]}]; }
};
export default config;
