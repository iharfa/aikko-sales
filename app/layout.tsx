import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const sg = Space_Grotesk({ subsets: ["latin"], variable: "--font-sg" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jbm = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbm" });

export const metadata: Metadata = {
  title: "Aikko · Fest Tracker",
  description: "Inventory + sales tracker for the Aikko print stall",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Aikko", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f8f9fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sg.variable} ${inter.variable} ${jbm.variable}`}>
      <body>
        <main className="mx-auto max-w-lg px-4 pb-36 pt-4">{children}</main>
        <Nav />
      </body>
    </html>
  );
}
