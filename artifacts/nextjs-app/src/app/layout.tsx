import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppProvider"; // Import provider baru

export const metadata: Metadata = {
  title: "Playzetta", // Update nama sesuai project
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
    <html lang="en"> {/* Ganti ke English sesuai rencana */}
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