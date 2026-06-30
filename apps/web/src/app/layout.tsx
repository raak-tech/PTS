import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CrisisResourcesBanner } from "@/components/CrisisResourcesBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PTS — Pain to Strength",
    template: "%s | PTS",
  },
  description:
    "Counseling-led recovery for anyone whose pain has changed how they live.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PTS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a className="skipLink" href="#main-content">
          Skip to content
        </a>
        <CrisisResourcesBanner />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
