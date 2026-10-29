import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Transiciones animadas entre pantallas (<ViewTransition> de React).
  experimental: { viewTransition: true },
  serverExternalPackages: ['pg', 'web-push'],
  // Las migraciones se leen en tiempo de ejecución desde ./drizzle.
  outputFileTracingIncludes: { '/*': ['./drizzle/**/*'] },
};

export default nextConfig;
