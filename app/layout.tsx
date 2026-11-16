import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameTopUp Bolivia | Recargas rápidas y seguras",
  description: "Recarga Free Fire, Roblox, Mobile Legends y tus juegos favoritos en Bolivia.",
  manifest: "/manifest.json",
  themeColor: "#090B16",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
