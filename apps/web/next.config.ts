import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@posta/money', '@posta/validation', '@posta/shared-types'],
};

export default nextConfig;
