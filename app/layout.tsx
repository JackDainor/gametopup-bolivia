import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NexTronix FF | Recargas para todo juego",
  description: "Recargas de videojuegos en Bolivia. Diamantes, monedas y paquetes en bolivianos.",
  themeColor: "#08050f",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NexTronix FF" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
