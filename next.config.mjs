/** @type {import('next').NextConfig} */

// ⚠️ GitHub Pages sert le site depuis un sous-dossier :
//    https://<pseudo>.github.io/<NOM-DU-REPO>/
// Mets ici le nom EXACT de ton dépôt GitHub (voir README).
// Si tu utilises un domaine perso ou un dépôt "<pseudo>.github.io",
// laisse une chaîne vide : const repo = "";
const repo = "dahu-caisse";

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd && repo ? `/${repo}` : "";

const nextConfig = {
  // Export 100% statique (HTML/CSS/JS) -> compatible GitHub Pages, sans serveur
  output: "export",

  // Sous-chemin du dépôt GitHub Pages
  basePath,
  assetPrefix: basePath || undefined,

  // Pages servies comme dossiers (/caisse/ -> /caisse/index.html)
  trailingSlash: true,

  images: {
    // GitHub Pages n'a pas d'optimiseur d'images -> on désactive
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Expose le basePath au code client (utile pour les liens vers les images)
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
