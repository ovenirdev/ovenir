import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "OVENIR - Developer Tools, Instant",
    template: "%s | OVENIR"
  },
  description: "Premium developer toolbox. JSON, Base64, JWT, URL encoding, hashing and more. 100% local, privacy-first. Paste anything, we detect and transform instantly.",
  keywords: ["developer tools", "json formatter", "base64", "jwt decoder", "url encoder", "hash generator", "uuid", "regex tester", "online tools", "privacy-first"],
  authors: [{ name: "OVENIR" }],
  creator: "OVENIR",
  metadataBase: new URL("https://ovenir.dev"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OVENIR",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "OVENIR",
    title: "OVENIR - Developer Tools, Instant",
    description: "Premium developer toolbox. 100% local, privacy-first.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OVENIR - Developer Tools, Instant",
    description: "Premium developer toolbox. 100% local, privacy-first.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
