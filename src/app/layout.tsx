import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/lib/uploadthing";
import { PwaRegister } from "@/components/pwa/pwa-register";

export const metadata: Metadata = {
  title: 'SOWA Academy | School Management',
  description: 'Manage SOWA Academy student records, academic results, and school operations.',
  applicationName: "SOWA Academy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SOWA Academy",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/sowa-app-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/sowa-app-icon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#050c0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <PwaRegister />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
