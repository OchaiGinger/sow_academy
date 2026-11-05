import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/lib/uploadthing";

export const metadata: Metadata = {
  title: 'AcademiaFlow | School Result Management System',
  description: 'Manage student academic records digitally with efficiency and precision.',
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
