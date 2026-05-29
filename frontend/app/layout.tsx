import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SealQR — Confidential Payments & Red Packets",
  description:
    "Pay by QR and send red packets where every amount is encrypted on-chain with Zama FHE (ERC-7984). The ledger sees that a payment happened — never how much.",
  manifest: "/manifest.webmanifest",
  applicationName: "SealQR",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SealQR" },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
