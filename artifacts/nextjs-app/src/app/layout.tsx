import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zetta Clicker",
  description: "Tap to earn Zetta Coins!",
};

export const viewport: Viewport = {
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
    <html lang="id">
      <body
        style={{
          margin: 0,
          padding: 0,
          overflow: "hidden",
          height: "100dvh",
          background: "#000",
        }}
      >
        {children}
      </body>
    </html>
  );
}
