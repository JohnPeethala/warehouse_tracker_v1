import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Warehouse Ops",
  description: "Warehouse Operations Management Mobile PWA",
  manifest: "/manifest.json",
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
        {/* Desktop Blocker */}
        <div className="fixed inset-0 z-[9999] bg-background hidden sm:flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-xl overflow-hidden">
            <img src="/logo.svg" alt="Warehouse Tracker Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Warehouse OPs</h1>
          <p className="text-base text-foreground/60 max-w-md mx-auto leading-relaxed">
            This application is designed specifically for field operations and must be accessed from a mobile device.
          </p>
          <p className="text-xs font-semibold text-primary/80 mt-8 uppercase tracking-widest">
            Please log in on your phone or tablet
          </p>
        </div>
        
        {/* Main Content (Hidden on desktop to avoid rendering) */}
        <div className="flex-1 flex flex-col sm:hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
