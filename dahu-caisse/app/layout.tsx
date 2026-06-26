// ============================================================
// Layout RACINE — polices Dahu + métadonnées PWA
// ============================================================
import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Rajdhani, Ubuntu_Mono } from "next/font/google";
import "./globals.css";

// Polices identiques au site vitrine
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});
const rajdhani = Rajdhani({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
  display: "swap",
});
const ubuntuMono = Ubuntu_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-ubuntu-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dahu Caisse",
  description: "Caisse & gestion de stock — Dahu Sound System",
  manifest: "/manifest.json",
  icons: { icon: "/images/logo-dahu-white.png" },
};

export const viewport: Viewport = {
  themeColor: "#0a0710",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // évite le zoom accidentel en rush
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${bebas.variable} ${rajdhani.variable} ${ubuntuMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
