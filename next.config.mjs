/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Autorise les photos de produits servies depuis Supabase Storage.
    // Remplace le hostname par celui de TON projet Supabase si besoin
    // (il est déjà géré dynamiquement via remotePatterns ci-dessous).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
