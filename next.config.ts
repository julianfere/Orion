import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'web-push'],
  // Las migraciones se leen en tiempo de ejecución desde ./drizzle.
  outputFileTracingIncludes: { '/*': ['./drizzle/**/*'] },
};

export default nextConfig;
