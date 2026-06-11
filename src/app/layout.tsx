import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OfflineSyncIndicator } from "@/components/shared/OfflineSyncIndicator";
import { InstallPrompt } from "@/components/shared/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Warehouse Ops",
  description: "Warehouse Operations Management Mobile PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Warehouse Ops",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <div className="flex-1 flex flex-col">
          {children}
          <OfflineSyncIndicator />
          <InstallPrompt />
        </div>
      </body>
    </html>
  );
}
