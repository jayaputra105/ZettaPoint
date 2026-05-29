import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppProvider";
import Script from "next/script"; // 1. IMPORT SCRIPT NEXTJS

export const metadata: Metadata = {
  title: "ZettaPoint",
  description: "Tap to earn Zetta Points and USDT!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly < {
  children: React.ReactNode;
} > ) {
  return (
    <html lang="en">
      <head>
        
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          overflow: "hidden",
          height: "100dvh",
          background: "#000",
        }}
      >
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}